import { useEffect, useState, useRef } from 'react';

export interface Passenger {
  id: string;
  name: string;
  age: string;
  gender: string;
  seatPref: string;
}

interface BookingGroup {
  groupId?: string;
  id?: string; // for single bookings
  fromStation: string;
  toStation: string;
  date: string;
  classType: string;
  quota: string;
  trainNumber?: string;
  autoTatkal: boolean;
  seatPref?: string; // for single booking
  name?: string;
  age?: string;
  gender?: string;
  passengers?: Passenger[];
  credentials?: {
    username: string;
    password: string;
    paymentMethod?: string;
  };

}



export default function BookingList() {
  const [bookings, setBookings] = useState<BookingGroup[]>([]);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [currentTime, setCurrentTime] = useState('');

   useEffect(() => {
    const checkAndAutoTrigger = () => {
      const now = new Date();

      bookings.forEach((b) => {
        if (!b.autoTatkal || !b.date) return;

        const journeyDate = new Date(b.date);
        const tatkalTime = new Date(journeyDate);
        tatkalTime.setDate(journeyDate.getDate());
        tatkalTime.setHours(17, 0, 0, 0);

        const diff = Math.abs(now.getTime() - tatkalTime.getTime());
        const windowMs = 1000 * 60; // 1 minute window

        if (diff <= windowMs) {
          const key = b.groupId || b.id;
          const btn = buttonRefs.current[key!];
          if (btn) {
            console.log(`🚀 Triggering Tatkal for: ${key}`);
            btn.click();
          }
        }
      });
    };

    const interval = setInterval(checkAndAutoTrigger, 10000); // check every 10s
    return () => clearInterval(interval);
  }, [bookings]);

  useEffect(() => {
    chrome.storage.local.get('trainBookings', (result) => {
      const stored = result.trainBookings || [];
      setBookings(stored);
      console.log('Loaded bookings from chrome.storage:', stored);
    });
  }, []);

  const deleteBooking = (idOrGroupId: string) => {
    console.log('Deleting booking:', idOrGroupId);

    const updated = bookings.filter((b) => {
      if (b.passengers) {
        return b.groupId !== idOrGroupId;
      }
      return b.id !== idOrGroupId;
    });

    console.log('Updated bookings:', updated);

    chrome.storage.local.set({ trainBookings: updated }, () => {
      console.log('Storage updated');
      setBookings(updated);
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour12: true,
      };
      setCurrentTime(new Intl.DateTimeFormat('en-IN', options).format(now));
    }, 1000); // update every second

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="mt-6 space-y-6">
      <h2 className="text-xl font-bold text-indigo-700">Saved Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-gray-500">No bookings available.</p>
      ) : (
        bookings.map((b) => {
          const key = b.groupId || b.id;
          const journeyKey = `journey-${key}`;

          const button = (
            <button
              ref={el => { buttonRefs.current[key!] = el; }}
              onClick={() => open(`https://www.irctc.co.in/nget?bookingId=${key}`, '_blank')}
              className="absolute cursor-pointer top-0 right-8 text-red-600 text-2xl hover:text-red-800"
            >
              ➡️
            </button>
          );

          const deleteBtn = (
            <button
              onClick={() => deleteBooking(key!)}
              className="absolute cursor-pointer top-2 right-2 text-red-600 hover:text-red-800 text-sm"
            >
              ❌
            </button>
          );

          if (b.passengers) {

            // Grouped booking
            return (
              <div key={journeyKey} className="border p-4 rounded-lg shadow bg-white relative">
                {button}
                {deleteBtn}
                <h3 className="font-bold text-indigo-600 mb-2">Family/Group Booking</h3>
                <p><strong>From:</strong> {b.fromStation}</p>
                <p><strong>To:</strong> {b.toStation}</p>
                <p><strong>Date:</strong> {b.date}</p>
                <p><strong>Class:</strong> {b.classType}</p>
                <p><strong>Quota:</strong> {b.quota}</p>
                <div className='flex justify-between items-start md:items-center'>
                <p><strong>Auto Tatkal:</strong> {b.autoTatkal ? 'Yes' : 'No'}</p>
                <strong>{currentTime}</strong>
                </div>
                <p><strong>Train No.:</strong> {b.trainNumber}</p>
                <div className="mt-4 space-y-2">
                  {b.passengers.map((p) => (
                    <div key={p.id} className="p-2 border rounded bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <p><strong>Name:</strong> {p.name}</p>
                      <p><strong>Age:</strong> {p.age}</p>
                      <p><strong>Gender:</strong> {p.gender}</p>
                      <p><strong>Seat:</strong> {p.seatPref}</p>
                    </div>
                  ))}
                </div>
                {
                  b.credentials && (
                    <>
                      <p><strong>Username:</strong> {b.credentials.username}</p>
                      <p><strong>Password:</strong> {b.credentials.password}</p> {/* Masking password for display */}
                    </>
                  )
                }
                {b.credentials && <p><strong>Payment Method:</strong> {b.credentials.paymentMethod}</p>}
              </div>
            );
          }

          // Single booking
          return (
            <div key={journeyKey} className="border p-4 rounded-lg shadow bg-white relative">
          {button}
          {deleteBtn}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p><strong>From:</strong> {b.fromStation}</p>
                <p><strong>To:</strong> {b.toStation}</p>
                <p><strong>Date:</strong> {b.date}</p>
                <p><strong>Name:</strong> {b.name}</p>
                <p><strong>Age:</strong> {b.age}</p>
                <p><strong>Gender:</strong> {b.gender}</p>
                <p><strong>Class:</strong> {b.classType}</p>
                <p><strong>Quota:</strong> {b.quota}</p>
                {b.trainNumber && <p><strong>Train No.:</strong> {b.trainNumber}</p>}
                {b.seatPref && <p><strong>Seat Pref:</strong> {b.seatPref}</p>}
                <div className='flex justify-between items-start md:items-center'>
                <p><strong>Auto Tatkal:</strong> {b.autoTatkal ? 'Yes' : 'No'}</p>
                <strong>{currentTime}</strong>
                </div>
                {b.credentials && (
                  <>
                    <p><strong>Username:</strong> {b.credentials.username}</p>
                    <p><strong>Password:</strong>***********</p>
                  </>
                )}
                {b.credentials && <p><strong>Payment Method:</strong> {b.credentials.paymentMethod}</p>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
