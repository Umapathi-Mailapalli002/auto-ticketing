(function autofillFromBooking() {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');
    if (!bookingId) return;

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    let selectedBooking: any = null; // To share booking info across functions

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
