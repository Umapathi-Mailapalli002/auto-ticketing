import { useState, useId } from 'react';
import type { Passenger } from './BookingList';
function BookingForm({ onAdd }: { onAdd: () => void }) {
  const formId = useId();
  const [sharedData, setSharedData] = useState({
    from: '',
    to: '',
    date: '',
    classType: 'Sleeper',
    quota: 'General',
    trainNumber: '',
    autoTatkal: false,
  });

  const [passengers, setPassengers] = useState([
    { name: '', age: '', gender: '', seatPref: '' }
  ]);

  const inputStyle =
    'border border-gray-300 bg-white rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 placeholder:text-gray-400 transition w-full';

  const handleSharedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSharedData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

 const handlePassengerChange = (
  index: number,
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;
  const updated = [...passengers];

  const key = name as keyof Passenger;

  updated[index] = {
    ...updated[index],
    [key]: value,
  };

  setPassengers(updated);
};


  const addPassenger = () => {
    setPassengers((prev) => [...prev, { name: '', age: '', gender: '', seatPref: '' }]);
  };
  const removePassenger = (index: number) => {
    setPassengers((prev) => prev.filter((_, i) => i !== index));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existingData = localStorage.getItem('trainBookings');
    const bookings = existingData ? JSON.parse(existingData) : [];

    const generateId = () => Math.random().toString(36).substring(2, 9);

const updatedBookings = [...bookings];

if (passengers.length === 1) {
  const p = passengers[0];
  const isDuplicate = bookings.some(
    (b: any) =>
      !b.passengers && // ensure it's not a group
      b.name === p.name &&
      b.date === sharedData.date &&
      b.from.toLowerCase() === sharedData.from.toLowerCase() &&
      b.to.toLowerCase() === sharedData.to.toLowerCase()
  );

  if (!isDuplicate) {
    updatedBookings.push({ ...sharedData, ...p, id: `${formId}-${p.name}` });
  }
} else {
  // multiple passengers, store as a group
  const groupId = `grp-${generateId()}`;
  const passengerList = passengers.map((p, idx) => ({
    ...p,
    id: `${groupId}-${idx + 1}`,
  }));

  updatedBookings.push({
    groupId,
    ...sharedData,
    passengers: passengerList,
  });
}

localStorage.setItem('trainBookings', JSON.stringify(updatedBookings));

    alert('Booking submitted!');
    onAdd();

    // Reset form
    setSharedData({
      from: '',
      to: '',
      date: '',
      classType: 'Sleeper',
      quota: 'General',
      trainNumber: '',
      autoTatkal: false,
    });
    setPassengers([{ name: '', age: '', gender: '', seatPref: '' }]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-indigo-100 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-2xl rounded-xl p-4 w-full max-w-2xl space-y-6 border border-indigo-100"
      >
        <h1 className="text-3xl font-extrabold text-center text-indigo-700">Auto Ticketing</h1>

        {/* Shared Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="from" placeholder="From Station" required value={sharedData.from} onChange={handleSharedChange} className={inputStyle} />
          <input name="to" placeholder="To Station" required value={sharedData.to} onChange={handleSharedChange} className={inputStyle} />
          <input name="date" type="date" required value={sharedData.date} onChange={handleSharedChange} className={inputStyle} />
          <input name="trainNumber" placeholder="Train Number (Optional)" value={sharedData.trainNumber} onChange={handleSharedChange} className={inputStyle} />
          <select name="classType" value={sharedData.classType} onChange={handleSharedChange} className={inputStyle}>
            <option value="Sleeper">Sleeper</option>
            <option value="3AC">3AC</option>
            <option value="2AC">2AC</option>
            <option value="1AC">1AC</option>
          </select>
          <select name="quota" value={sharedData.quota} onChange={handleSharedChange} className={inputStyle}>
            <option value="General">General</option>
            <option value="Tatkal">Tatkal</option>
            <option value="Ladies">Ladies</option>
            <option value="Senior Citizen">Senior Citizen</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="autoTatkal" checked={sharedData.autoTatkal} onChange={handleSharedChange} />
          <label className="text-sm text-gray-700">Auto-book at Tatkal Opening Time</label>
        </div>

        <hr className="my-4 border-indigo-200" />

        {/* Passenger Forms */}
        <div className="space-y-4">
          {passengers.map((passenger, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative border border-gray-200 p-4 rounded-lg bg-gray-50">
              <input name="name" placeholder="Passenger Name" value={passenger.name} onChange={(e) => handlePassengerChange(idx, e)} required className={inputStyle} />
              <input name="age" type="number" placeholder="Age" value={passenger.age} onChange={(e) => handlePassengerChange(idx, e)} required className={inputStyle} />
              <select name="gender" value={passenger.gender} onChange={(e) => handlePassengerChange(idx, e)} required className={inputStyle}>
                <option value="">Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              <select name="seatPref" value={passenger.seatPref} onChange={(e) => handlePassengerChange(idx, e)} className={inputStyle}>
                <option value="">Seat Pref</option>
                <option>Lower</option>
                <option>Middle</option>
                <option>Upper</option>
                <option>Side Lower</option>
                <option>Side Upper</option>
              </select>

              {/* Remove Button */}
              {passengers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePassenger(idx)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm"
                >
                  ❌ Remove
                </button>
              )}
            </div>
          ))}

        </div>

        <button type="button" onClick={addPassenger} className="w-full py-2 text-indigo-700 font-semibold border border-indigo-300 rounded-lg hover:bg-indigo-100 transition">
          ➕ Add Passenger
        </button>

        <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">
          Book Ticket
        </button>
      </form>
    </div>
  );
}

export default BookingForm;
