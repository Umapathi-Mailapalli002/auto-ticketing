(function autofillFromBooking() {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');
    if (!bookingId) return;

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
   // Extract train number like "12703" from "FALAKNUMA EXP (12703)"
    const extractTrainNumber = (trainName: string): string | null => {
        const match = trainName.match(/\((\d+)\)/);
        return match ? match[1] : null;
    };

    // Wait for the train name to appear in DOM
    const getTrainNumber = async (): Promise<string | null> => {
        let attempts = 20;
        while (attempts-- > 0) {
            const el = document.querySelector('.train-heading strong');
            if (el?.textContent) {
                const number = extractTrainNumber(el.textContent.trim());
                console.log("Detected Train Number:", number);
                return number;
            }
            await delay(200);
        }
        return null;
    };

    const selectDropdownOption = async (containerSelector: string, targetText: string) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const dropdown = container.querySelector('.ui-dropdown') as HTMLElement;
        if (!dropdown) return;

        dropdown.click(); // Open dropdown
        await delay(200); // Wait for options to render

        const options = document.querySelectorAll('.ui-dropdown-item');
        for (const option of options) {
            if (option.textContent?.trim().toLowerCase() === targetText.toLowerCase()) {
                (option as HTMLElement).click();
                break;
            }
        }
    };

    const populateForm = async (booking: any) => {
        if (!booking) return;

        await selectDropdownOption('#journeyClass', booking.classType);
        await selectDropdownOption('#journeyQuota', booking.quota);
    };

    const fillFromStorage = async (data: any[]) => {
        const booking = data.find((b: any) => b.id === bookingId || b.groupId === bookingId);
        console.log("Found booking:", booking);
        await populateForm(booking);
    };

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get('trainBookings', async (result) => {
            const data = result.trainBookings || [];
            await fillFromStorage(data);
        });
    } else {
        const data = JSON.parse(localStorage.getItem('trainBookings') || '[]');
        fillFromStorage(data);
    }
})();
