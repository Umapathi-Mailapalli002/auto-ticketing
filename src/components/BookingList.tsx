import { useEffect, useState } from 'react';

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
  from: string;
  to: string;
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
}

export default function BookingList() {
  const [bookings, setBookings] = useState<BookingGroup[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('trainBookings') || '[]');
    setBookings(stored);
    console.log('Loaded bookings:', stored);
  }, []);

  const deleteBooking = (idOrGroupId: string) => {
    const updated = bookings.filter((b) => {
      if (b.passengers) {
        return b.groupId !== idOrGroupId;
      }
      return b.id !== idOrGroupId;
    });
    localStorage.setItem('trainBookings', JSON.stringify(updated));
    setBookings(updated);
  };

  return (
    <div className="mt-6 space-y-6">
      <h2 className="text-xl font-bold text-indigo-700">Saved Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-gray-500">No bookings available.</p>
      ) : (
        bookings.map((b, index) => {
          if (b.passengers) {
            // Grouped booking
            return (
              <div key={b.groupId || index} className="border p-4 rounded-lg shadow bg-white relative">
                <button
                  onClick={() => deleteBooking(b.groupId!)}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm"
                >
                  ❌
                </button>
                <h3 className="font-bold text-indigo-600 mb-2">Family/Group Booking</h3>
                <p><strong>Date:</strong> {b.date}</p>
                <p><strong>From:</strong> {b.from}</p>
                <p><strong>To:</strong> {b.to}</p>
                <p><strong>Class:</strong> {b.classType}</p>
                <p><strong>Quota:</strong> {b.quota}</p>
                <p><strong>Auto Tatkal:</strong> {b.autoTatkal ? 'Yes' : 'No'}</p>
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
              </div>
            );
          }

          // Single booking
          return (
            <div key={b.id || index} className="border p-4 rounded-lg shadow bg-white relative">
              <button
                onClick={() => deleteBooking(b.id!)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm"
              >
                ❌
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p><strong>Name:</strong> {b.name}</p>
                <p><strong>Age:</strong> {b.age}</p>
                <p><strong>Gender:</strong> {b.gender}</p>
                <p><strong>Date:</strong> {b.date}</p>
                <p><strong>From:</strong> {b.from}</p>
                <p><strong>To:</strong> {b.to}</p>
                <p><strong>Class:</strong> {b.classType}</p>
                <p><strong>Quota:</strong> {b.quota}</p>
                {b.trainNumber && <p><strong>Train No.:</strong> {b.trainNumber}</p>}
                {b.seatPref && <p><strong>Seat Pref:</strong> {b.seatPref}</p>}
                <p>
                  <strong>Auto Tatkal:</strong>{' '}
                  {b.autoTatkal ? (
                    <span className="text-green-600 font-semibold">Yes</span>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
