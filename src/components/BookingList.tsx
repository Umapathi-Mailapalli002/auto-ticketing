import { useEffect, useState } from 'react';

interface Booking {
    id: string;
  name: string;
  age: string;
  gender: string;
  email: string;
  phone: string;
  from: string;
  to: string;
  date: string;
  classType: string;
  quota: string;
  trainNumber: string;
  seatPref: string;
  autoTatkal: boolean;
}

export default function BookingList() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('trainBookings') || '[]');
    setBookings(stored);
    console.log('Loaded bookings:', stored);
  }, []);

  const deleteBooking = (id: string) => {
    const updated = bookings.filter((b) => b.id !== id);
    localStorage.setItem('trainBookings', JSON.stringify(updated));
    setBookings(updated);
  };


  return (
    <div className="mt-6 space-y-4 ">
      <h2 className="text-lg font-bold text-indigo-700">Saved Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-gray-500">No bookings available.</p>
      ) : (
        bookings.map((b) => (
          <div key={b.email} className="border p-2 rounded shadow-sm relative">
            <p><strong>Name:</strong> {b.name}</p>
            <p><strong>From:</strong> {b.from} → {b.to}</p>
            <p><strong>Date:</strong> {b.date}</p>
            <p><strong>Class:</strong> {b.classType}</p>
            <div className="space-x-2 mt-2">
              <button onClick={() => deleteBooking(b.id)} className="text-red-600 top-0 right-0 absolute">❌</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
