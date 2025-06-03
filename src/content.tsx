(function autofillFromBooking() {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');
    if (!bookingId) return;

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const selectDateFromPicker = async (containerSelector: string, targetDate: string) => {
    const container = document.querySelector(containerSelector) as HTMLElement | null;
    if (!container) return;

    // Step 1: Parse date
    const [, , day] = targetDate.split('-').map(Number);

    // Step 2: Open the date picker
    container.click();
    await delay(500); // wait for the calendar popup

    // Step 3: Try to find and click the matching date
    const dayStr = `${day}`; // convert day to string for matching

    const calendar = document.querySelector('.ui-datepicker');
    if (!calendar) return;

    // Find all day spans inside datepicker (exclude disabled/empty cells)
    const allSpans = calendar.querySelectorAll('td span.ui-state-default:not(.ui-state-disabled)');
    for (const span of allSpans) {
        const el = span as HTMLElement;
        const text = el.textContent?.trim();

        // Match day number exactly
        if (text === dayStr) {
            el.click();
            break;
        }
    }
};


    //     const container = document.querySelector(containerSelector) as HTMLElement | null;
    //     if (!container) return;

    //     container.click(); // open date picker
    //     await delay(300);

    //     const day = parseInt(targetDate.split('-')[2], 10);

    //     // Select only td elements with the class
    //     const dateCells = document.querySelectorAll('td.ng-tns-c58-10');
    //     for (const cell of dateCells) {
    //         const span = cell.querySelector('span');
    //         if (!span) continue;

    //         const cellDay = parseInt(span.textContent?.trim() || '', 10);
    //         if (cellDay === day) {
    //             (cell as HTMLElement).click();
    //             break;
    //         }
    //     }
    // };


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
       
        await selectDateFromPicker('#journeyDate', booking.date);
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
