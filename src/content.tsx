(function autofillFromBooking() {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');
    if (!bookingId) return;

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    let selectedBooking: any = null; // To share booking info across functions

const simulateAutoCompleteInput = async (inputSelector: string, stationName: string) => {
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const input = document.querySelector(inputSelector) as HTMLInputElement;
    if (!input) {
        console.warn(`Input not found for selector: ${inputSelector}`);
        return;
    }

    const firstFour = stationName.substring(0, 4);
    input.focus();
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await delay(100);

    for (let i = 1; i <= firstFour.length; i++) {
        input.value = firstFour.substring(0, i);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await delay(200); // delay after each keystroke
    }

    await delay(1000); // wait for suggestions to appear

    // Look globally because suggestions are often appended to <body>
    const options = document.querySelectorAll('.ui-autocomplete-panel .ui-autocomplete-item');
    console.log(`Found ${options.length} autocomplete options for "${stationName}"`);
    let clicked = false;

    for (const option of options) {
        const text = option.textContent?.trim().toLowerCase();
        if (text && stationName.toLowerCase().includes(text)) {
            (option as HTMLElement).click();
            clicked = true;
            console.log(`✅ Selected: ${option.textContent}`);
            break;
        }
    }

    if (!clicked) {
        console.warn(`❌ No autocomplete match found for "${stationName}"`);
    }
};



    const triggerLoginModalAndAutofill = async () => {
        const loginLink = document.querySelector('a.loginText') as HTMLElement;
        if (!loginLink) return console.warn("LOGIN link not found");

        loginLink.click(); // Open the login modal
        console.log("Clicked login button to open modal");

        // Wait for login fields
        let tries = 30;
        let usernameInput: HTMLInputElement | null = null;
        let passwordInput: HTMLInputElement | null = null;

        while (tries-- > 0) {
            await delay(300);
            usernameInput = document.querySelector('input[formcontrolname="userid"]') as HTMLInputElement;
            passwordInput = document.querySelector('input[formcontrolname="password"]') as HTMLInputElement;

            if (usernameInput && passwordInput) break;
        }

        if (!usernameInput || !passwordInput || !selectedBooking?.credentials) {
            console.warn("Username/password fields or credentials not found.");
            return;
        }

        // Fill without focus
        usernameInput.value = selectedBooking.credentials.username;
        usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
        usernameInput.dispatchEvent(new Event("change", { bubbles: true }));

        passwordInput.value = selectedBooking.credentials.password;
        passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
        passwordInput.dispatchEvent(new Event("change", { bubbles: true }));

        console.log("Filled in username and password without focusing.");
    };


    const selectDropdownOption = async (containerSelector: string, targetText: string) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const dropdown = container.querySelector('.ui-dropdown') as HTMLElement;
        if (!dropdown) return;

        dropdown.click();
        await delay(200);

        const options = document.querySelectorAll('.ui-dropdown-item');
        for (const option of options) {
            if (option.textContent?.trim().toLowerCase() === targetText.toLowerCase()) {
                (option as HTMLElement).click();
                break;
            }
        }
    };

    const populateForm = async () => {
        if (!selectedBooking) return;
        await selectDropdownOption('#journeyClass', selectedBooking.classType);
        await selectDropdownOption('#journeyQuota', selectedBooking.quota);
        await simulateAutoCompleteInput('input[aria-label="Enter From station. Input is Mandatory."]', selectedBooking.fromStation);
        await simulateAutoCompleteInput('input[aria-label="Enter To station. Input is Mandatory."]', selectedBooking.toStation);
    };

    const fillFromStorage = async (data: any[]) => {
        const found = data.find((b: any) => b.id === bookingId || b.groupId === bookingId);
        if (!found) {
            console.warn("Booking not found in storage.");
            return;
        }
        selectedBooking = found;
        console.log("Using booking:", selectedBooking);
        await populateForm();
    };

    const start = async () => {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.get('trainBookings', async (result) => {
                const data = result.trainBookings || [];
                console.log("Loaded bookings from chrome.storage:", data);
                await fillFromStorage(data);
                await triggerLoginModalAndAutofill(); // do this after loading credentials
            });
        } else {
            const data = JSON.parse(localStorage.getItem('trainBookings') || '[]');
            await fillFromStorage(data);
            await triggerLoginModalAndAutofill();
        }
    };

    start();
})();
