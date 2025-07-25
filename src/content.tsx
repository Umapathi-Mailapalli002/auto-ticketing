(function autofillFromBooking() {
    // Parse the booking ID from the URL
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');
    if (!bookingId) return;

    // Utility: Delay for async UI steps
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    let selectedBooking: any = null; // Holds the booking info for autofill

    /**
         * Wait for the train list to load after search.
         */
    async function findAndBookTrainClass(selectedBooking: any) {
        // Wait for train list to load
        const waitForTrainList = async (timeout = 5000) => {
            const start = Date.now();
            while (Date.now() - start < timeout) {
                const trainBlocks = document.querySelectorAll('app-train-avl-enq');
                console.log("this is trainBlocks", trainBlocks);
                if (trainBlocks.length > 0) return Array.from(trainBlocks);
                await new Promise(res => setTimeout(res, 300));
            }
            return [];
        };

        // Normalize class names for matching
        const classMap: Record<string, string> = {
            'SL': 'Sleeper (SL)',
            '3A': 'AC 3 Tier (3A)',
            '2A': 'AC 2 Tier (2A)',
            '1A': 'AC First Class (1A)'
            // Add more if needed
        };

        const trainBlocks = await waitForTrainList();
        if (!trainBlocks.length) {
            console.warn("No trains found.");
            return false;
        }

        const trainNumber = String(selectedBooking.trainNumber).replace(/\D/g, '');
        const classType = String(selectedBooking.classType).toUpperCase();
        const classFullName = classMap[classType] || classType;

        // 1. Find the train block by train number
        let matchedTrainBlock = null;
        for (const block of trainBlocks) {
            const heading = block.querySelector('.train-heading strong');
            if (heading && heading.textContent) {
                const match = heading.textContent.match(/\((\d+)\)/);
                if (match && match[1] === trainNumber) {
                    matchedTrainBlock = block;
                    console.log("Matched train block:", matchedTrainBlock);
                    break;
                }
            }
        }
        if (!matchedTrainBlock) {
            console.warn("Train number not found:", trainNumber);
            return false;
        }

        // 2. Find the class cell by class name
        const classCells = matchedTrainBlock.querySelectorAll('div.pre-avl');
        let foundClassCell = null;
        for (const cell of classCells) {
            const strong = cell.querySelector('strong');
            if (
                strong &&
                strong.textContent &&
                strong.textContent.trim().toUpperCase() === selectedBooking.classType.toUpperCase()
            ) {
                foundClassCell = cell;
                console.log("Matched class cell:", foundClassCell);
                (cell as HTMLElement).click(); // Click to expand if needed
                break;
            }
        }
        if (!foundClassCell) {
            console.warn("Class not found:", classType, "as", classFullName);
            return false;
        }

        await delay(300); // Give it time to render WL shell
        const wlShell = matchedTrainBlock.querySelector('td.link.ng-star-inserted .WL strong') as HTMLElement;
        if (wlShell) {
            console.log("Found WL shell:", wlShell);
            await delay(100); // Wait for any animations
            wlShell.click();
        } else {
            console.warn("⚠️ WL shell not found under matched train block");
        }


        await delay(300); // Give it time to render WL shell
        const bookBtn = matchedTrainBlock.querySelector('button.btnDefault:not(.disable-book):not([disabled])');
        if (bookBtn) {
            bookBtn.scrollIntoView({ block: 'center' });
            (bookBtn as HTMLElement).click();
            await new Promise(res => setTimeout(res, 500));
            console.log(`✅ Booked ${classFullName} in train ${trainNumber}`);
            return true;
        } else {
            console.warn("No available Book Now button for this train.");
            return false;
        }
    }

    /**
     * Get the PrimeNG autocomplete input by formControlName.
     * @param formControlName The Angular form control name (e.g., 'origin', 'destination')
     */
    const getAutocompleteInput = (formControlName: string) => {
        const field = document.querySelector(
            `p-autocomplete[formcontrolname="${formControlName}"] input[role="searchbox"]`
        ) as HTMLInputElement;
        return field;
    };

    /**
     * Wait for the autocomplete suggestion panel to become visible.
     * @param timeout Maximum time to wait in ms.
     */
    const waitForVisiblePanel = async (timeout = 500) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const panel = document.querySelector('.ui-autocomplete-panel[style*="opacity: 1"]');
            if (panel && getComputedStyle(panel).opacity === '1') return panel;
            await delay(100);
        }
        return null;
    };

    /**
     * Simulate typing and select a suggestion in the PrimeNG autocomplete.
     * Matches first 4 chars (or less) of the station name.
     * @param formControlName The Angular form control name.
     * @param stationName The full station name to match.
     */
    const simulateAutoCompleteInput = async (formControlName: string, stationName: string) => {
        const input =
            getAutocompleteInput(formControlName);
        if (!input) {
            console.warn(`Input not found for form control: ${formControlName}`);
            return false;
        }

        // Focus and clear input
        input.focus();
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        await delay(200);

        // Prepare substring for typing and matching
        const stationNorm = stationName.replace(/\s+/g, '');
        const partialInput = stationNorm.length >= 4 ? stationNorm.slice(0, 4) : stationNorm;

        // Simulate typing each character
        for (let i = 0; i < partialInput.length; i++) {
            input.value = partialInput.slice(0, i + 1);
            input.dispatchEvent(new KeyboardEvent('keydown', { key: partialInput[i] }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
            await delay(120);
        }

        // Wait for the suggestion panel
        const panel = await waitForVisiblePanel();
        if (!panel) {
            console.warn('Autocomplete panel not visible');
            return false;
        }

        // Try to find and select the matching suggestion
        const items = Array.from(panel.querySelectorAll('li[role="option"]'));
        const norm = (s: string) => s.replace(/\s+/g, '').toLowerCase();
        const matchLen = partialInput.length;
        const inputNorm = partialInput.toLowerCase();

        let found = false;
        for (const item of items) {
            // Skip group headers
            if (!item.textContent || item.textContent.trim().startsWith('-----')) continue;

            let text = (item.textContent || '').replace(/\(.*?\)/g, '').trim();
            let suggestionNorm = norm(text);

            // Match first N chars (N = 4 or less)
            let suggestionSub = suggestionNorm.slice(0, matchLen);
            if (suggestionSub === inputNorm) {
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
            console.warn(`❌ No suggestion matched "${partialInput}"`);
        }
        return found;
    };

    /**
     * Opens the login modal and autofills credentials from booking.
     */
    const autofillLoginWhenModalAppears = async () => {
        let tries = 30;
        let usernameInput = null, passwordInput = null;
        while (tries-- > 0) {
            await delay(300);
            usernameInput = document.querySelector('input[formcontrolname="userid"]');
            passwordInput = document.querySelector('input[formcontrolname="password"]');
            if (usernameInput && passwordInput) break;
        }
        if (!usernameInput || !passwordInput || !selectedBooking?.credentials) {
            console.warn("Username/password fields or credentials not found.");
            return;
        }
        (usernameInput as HTMLInputElement).value = selectedBooking.credentials.username;
        usernameInput.dispatchEvent(new Event("input", { bubbles: true }));
        usernameInput.dispatchEvent(new Event("change", { bubbles: true }));
        (passwordInput as HTMLInputElement).value = selectedBooking.credentials.password;
        passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
        passwordInput.dispatchEvent(new Event("change", { bubbles: true }));
        console.log("✅ Autofilled login credentials.");
    };

    // --- Watch for login modal after "Book Now" is clicked ---
    const watchForLoginModal = () => {
        const observer = new MutationObserver(() => {
            const usernameInput = document.querySelector('input[formcontrolname="userid"]');
            const passwordInput = document.querySelector('input[formcontrolname="password"]');
            if (usernameInput && passwordInput) {
                observer.disconnect();
                autofillLoginWhenModalAppears();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    /**
     * Selects the date in the PrimeNG calendar widget based on booking.
     * @param selectedBooking The booking object containing the date (YYYY-MM-DD).
     */
    async function selectDateFromBooking(selectedBooking: any) {
        const dateInput = document.querySelector('.ui-calendar input[type="text"]') as HTMLInputElement;
        if (!dateInput) return false;
        dateInput.focus();
        dateInput.click();
        await delay(100);

        // Wait for calendar popup
        const waitForCalendarPanel = async (timeout = 1000) => {
            const start = Date.now();
            while (Date.now() - start < timeout) {
                const panel = document.querySelector('.ui-datepicker');
                if (panel && getComputedStyle(panel).opacity === '1') return panel;
                await delay(50);
            }
            return null;
        };
        const calendarPanel = await waitForCalendarPanel();
        if (!calendarPanel) return false;

        // Parse target date
        const targetDate = selectedBooking.date; // e.g., "2025-06-12"
        const [year, month, day] = targetDate.split('-').map(Number);
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const targetMonthName = monthNames[month - 1];

        // Helper to get current calendar month/year
        const getCurrentMonthYear = () => {
            const monthText = (calendarPanel.querySelector('.ui-datepicker-month')?.textContent ?? '').trim();
            const yearText = (calendarPanel.querySelector('.ui-datepicker-year')?.textContent ?? '').trim();
            return { month: monthText, year: Number(yearText) };
        };

        // Navigate to correct month/year
        for (let i = 0; i < 12; i++) {
            const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
            if (currentMonth === targetMonthName && currentYear === year) break;
            if (currentYear > year || (currentYear === year && monthNames.indexOf(currentMonth) > (month - 1))) {
                (calendarPanel.querySelector('.ui-datepicker-prev') as HTMLElement)?.click();
            } else {
                (calendarPanel.querySelector('.ui-datepicker-next') as HTMLElement)?.click();
            }
            await delay(150);
        }

        // Select the correct day
        const dayCells = calendarPanel.querySelectorAll('a.ui-state-default:not(.ui-state-disabled)') as NodeListOf<HTMLAnchorElement>;
        for (const cell of dayCells) {
            if (cell.textContent && cell.textContent.trim() === String(day)) {
                cell.scrollIntoView({ block: 'center' });
                cell.click();
                break;
            }
        }
    }

    /**
     * Select an option from a PrimeNG dropdown by visible text.
     * @param containerSelector The selector for the dropdown container.
     * @param targetText The text to match.
     */
    const selectDropdownOption = async (containerSelector: string, targetText: string) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const dropdown = container.querySelector('.ui-dropdown') as HTMLElement;
        if (!dropdown) return;

        dropdown.click();
        await delay(50);

        const options = document.querySelectorAll('.ui-dropdown-item');
        for (const option of options) {
            if (option.textContent?.trim().toLowerCase() === targetText.toLowerCase()) {
                (option as HTMLElement).click();
                break;
            }
        }
    };

    function autofillPassengersJob(passengerList: any[]) {
        const intervalId = setInterval(async () => {
            // Correct selector for name input (PrimeNG autocomplete)
            const nameInputs = document.querySelectorAll<HTMLInputElement>(
                'p-autocomplete[formcontrolname="passengerName"] input[placeholder="Name"]'
            );
            const ageInputs = document.querySelectorAll<HTMLInputElement>('[formcontrolname="passengerAge"]');
            const genderSelects = document.querySelectorAll<HTMLSelectElement>('[formcontrolname="passengerGender"]');
            const berthSelects = document.querySelectorAll<HTMLSelectElement>('[formcontrolname="passengerBerthChoice"]');

            // Wait until at least the first row is loaded
            if (
                nameInputs.length === 0 ||
                ageInputs.length === 0 ||
                genderSelects.length === 0 ||
                berthSelects.length === 0
            ) {
                console.log("⏳ Waiting for passenger form to load...");
                return;
            }

            for (let i = 0; i < passengerList.length; i++) {
                // Add row if needed
                let currentNameInputs = document.querySelectorAll<HTMLInputElement>(
                    'p-autocomplete[formcontrolname="passengerName"] input[placeholder="Name"]'
                );
                if (i > 0 && currentNameInputs.length <= i) {
                    const addBtn = Array.from(document.querySelectorAll('span.prenext'))
                        .find(el => el.textContent?.trim() === '+ Add Passenger');
                    if (addBtn) {
                        (addBtn as HTMLElement).click();
                        await new Promise(res => setTimeout(res, 300));
                    } else {
                        console.warn("❌ 'Add Passenger' button not found.");
                        clearInterval(intervalId);
                        return;
                    }
                }

                // Wait until the new row is present
                let tries = 10;
                while (
                    document.querySelectorAll<HTMLInputElement>(
                        'p-autocomplete[formcontrolname="passengerName"] input[placeholder="Name"]'
                    ).length <= i &&
                    tries-- > 0
                ) {
                    await new Promise(res => setTimeout(res, 100));
                }

                // Re-query all fields to get the latest row
                const nameInputs = document.querySelectorAll<HTMLInputElement>(
                    'p-autocomplete[formcontrolname="passengerName"] input[placeholder="Name"]'
                );
                const ageInputs = document.querySelectorAll<HTMLInputElement>('[formcontrolname="passengerAge"]');
                const genderSelects = document.querySelectorAll<HTMLSelectElement>('[formcontrolname="passengerGender"]');
                const berthSelects = document.querySelectorAll<HTMLSelectElement>('[formcontrolname="passengerBerthChoice"]');

                const p = passengerList[i];

                // Fill name (simulate typing for PrimeNG autocomplete)
                if (nameInputs[i]) {
                    nameInputs[i].focus();
                    nameInputs[i].value = '';
                    nameInputs[i].dispatchEvent(new Event('input', { bubbles: true }));
                    for (let j = 0; j < p.name.length; j++) {
                        nameInputs[i].value = p.name.slice(0, j + 1);
                        nameInputs[i].dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    nameInputs[i].blur();
                }

                // Fill age
                if (ageInputs[i]) {
                    ageInputs[i].value = String(p.age);
                    ageInputs[i].dispatchEvent(new Event('input', { bubbles: true }));
                    ageInputs[i].dispatchEvent(new Event('change', { bubbles: true }));
                }


                function setSelectValue(select: HTMLSelectElement, value: string) {
                    // Find the matching option
                    const options = Array.from(select.options);
                    const found = options.find(opt => opt.text === value);
                    if (found) {
                        select.value = value;
                        select.selectedIndex = options.indexOf(found);
                        // Dispatch both events for Angular/PrimeNG
                        select.dispatchEvent(new Event('input', { bubbles: true }));
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        // Extra: blur to trigger validation
                        select.blur();
                    } else {
                        console.warn(`Value "${value}" not found in options`, options.map(o => o.value));
                    }
                }

                // Usage inside your autofill loop:
                if (genderSelects[i]) {
                    setSelectValue(genderSelects[i], String(p.gender));
                }
                if (berthSelects[i] && p.seatPref) {
                    setSelectValue(berthSelects[i], String(p.seatPref));
                }
                function selectPaymentMethod(paymentValue: string) {
                    // Find the radio input by value
                    const radioInput = document.querySelector<HTMLInputElement>(
                        `input[type="radio"][name="paymentType"][value="${paymentValue}"]`
                    );
                    if (radioInput) {
                        radioInput.click(); // This should select the method and update the form model
                        // Optionally, click the visible box for UI feedback (PrimeNG/Angular)
                        const radiobuttonBox = radioInput.closest('.ui-radiobutton')?.querySelector('.ui-radiobutton-box');
                        if (radiobuttonBox) {
                            (radiobuttonBox as HTMLElement).click();
                        }
                        console.log(`✅ Selected payment method: ${paymentValue}`);
                    } else {
                        console.warn(`❌ Payment radio button with value "${paymentValue}" not found`);
                    }
                }

                // Example usage: select "Credit & Debit Cards / Net Banking / Wallets / EMI / Rewards and Others"
                selectPaymentMethod("3");

                // Example usage: select "BHIM/UPI"
                selectPaymentMethod("2");

                const continueButton = document.querySelector('.train_Search.btnDefault')
                if ((continueButton as HTMLElement).innerText.trim() === 'Continue') {
                    (continueButton as HTMLElement).click();
                    await delay(300);
                    console.log(`✅ Autofilled passenger ${i + 1}/${passengerList.length}`);
                    
                };

            }

            clearInterval(intervalId);
            console.log("✅ All passengers filled.");
        }, 1000);
    }

    /**
     * Populates the form fields using the selected booking.
     */
    const populateForm = async () => {
        if (!selectedBooking) return;

        await selectDropdownOption('#journeyClass', selectedBooking.classType);
        await delay(50);

        await selectDropdownOption('#journeyQuota', selectedBooking.quota);
        await delay(50);

        await selectDateFromBooking(selectedBooking);
        await delay(50);

        const fromSuccess = await simulateAutoCompleteInput('origin', selectedBooking.fromStation);
        await delay(fromSuccess ? 300 : 100);

        const toSuccess = await simulateAutoCompleteInput('destination', selectedBooking.toStation);
        await delay(toSuccess ? 300 : 100);

        const searchButton = document.querySelector('button.search_btn.train_Search[type="submit"]');
        if (searchButton) {
            searchButton.scrollIntoView({ block: 'center' });
            (searchButton as HTMLElement).click();
            await delay(300);
            console.log("✅ Clicked the Search button.");
        } else {
            console.warn("❌ Search button not found.");
            return false;
        }

        // Prepare to autofill login when modal appears
        watchForLoginModal();

        // Prepare autofill for login modal (but do NOT trigger it)
        autofillLoginWhenModalAppears();

        // Book train/class
        await findAndBookTrainClass(selectedBooking);
        await delay(300);

        autofillPassengersJob(selectedBooking.passengers);

        return fromSuccess && toSuccess;
    };

    /**
     * Loads the booking data from storage and populates the form.
     * @param data The array of stored bookings.
     */
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

    /**
     * Entry point: loads booking data from Chrome storage or localStorage, then autofills.
     */
    const start = async () => {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            chrome.storage.local.get('trainBookings', async (result) => {
                const data = result.trainBookings || [];
                await fillFromStorage(data);
            });
        } else {
            const data = JSON.parse(localStorage.getItem('trainBookings') || '[]');
            await fillFromStorage(data);
        }
    };

    start();
})();
