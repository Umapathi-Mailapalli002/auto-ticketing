(function autofillFromBooking() {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');
    if (!bookingId) return;

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    let selectedBooking: any = null; // To share booking info across functions

    const getAutocompleteInput = (formControlName: string) => {
        const field = document.querySelector(`p-autocomplete[formcontrolname="${formControlName}"] input[role="searchbox"]`) as HTMLInputElement;
        console.log(`Found autocomplete input for ${formControlName}:`, field);
        return field;
    };

    const waitForVisiblePanel = async (timeout = 1000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const panel = document.querySelector('.ui-autocomplete-panel[style*="opacity: 1"]');
            if (panel && getComputedStyle(panel).opacity === '1') return panel;
            await delay(100);
        }
        return null;
    };

    const simulateAutoCompleteInput = async (formControlName: string, stationName: string) => {
        const input = getAutocompleteInput(formControlName);
        if (!input) {
            console.warn(`Input not found for form control: ${formControlName}`);
            return false;
        }

        // Focus the input field before typing
        input.focus();
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await delay(200);

        // Type the first 4 characters
        const partialInput = stationName.replace(/\s+/g, '').slice(0, 4);
        for (let i = 0; i < partialInput.length; i++) {
            input.value = partialInput.slice(0, i + 1);
            input.dispatchEvent(new KeyboardEvent('keydown', { key: partialInput[i] }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
            await delay(120);
        }

        // Wait for suggestion panel
        const panel = await waitForVisiblePanel();
        if (!panel) {
            console.warn('Autocomplete panel not visible');
            return false;
        }

        // Find first suggestion whose first 4 chars match input
        const items = Array.from(panel.querySelectorAll('li[role="option"]'));
        const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();
        const inputNorm = partialInput.toLowerCase();

        let found = false;
        for (const item of items) {
            // Get the suggestion text, strip parentheses, etc.
            let text = (item.textContent || '').replace(/\(.*?\)/g, '').trim();
            let suggestionNorm = norm(text).slice(0, 4);
            if (suggestionNorm === inputNorm) {
                // Simulate real user interaction
                item.scrollIntoView({ behavior: 'auto', block: 'center' });
                await delay(100);
                ['pointerdown', 'mousedown', 'mouseup', 'click'].forEach(eventType => {
                    item.dispatchEvent(new MouseEvent(eventType, {
                        view: window,
                        bubbles: true,
                        cancelable: true,
                        composed: true
                    }));
                });
                input.blur();
                console.log(`✅ Selected: ${text}`);
                found = true;
                await delay(300);
                break;
            }
        }
        if (!found) {
            console.warn(`❌ No suggestion matched first 4 chars "${partialInput}"`);
        }
        return found;
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
        await delay(500);

        await selectDropdownOption('#journeyQuota', selectedBooking.quota);
        await delay(500);

        // Updated autocomplete calls with formControlName
        const fromSuccess = await simulateAutoCompleteInput('origin', selectedBooking.fromStation);
        await delay(fromSuccess ? 800 : 500);

        const toSuccess = await simulateAutoCompleteInput('destination', selectedBooking.toStation);
        await delay(toSuccess ? 800 : 500);

        return fromSuccess && toSuccess;
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
