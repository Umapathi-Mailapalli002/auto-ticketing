import { useState, useId, useEffect } from 'react';
import type { Passenger } from './BookingList';
function BookingForm({ onAdd }: { onAdd: () => void }) {
  const formId = useId();
  const [sharedData, setSharedData] = useState({
    fromStation: '',
    toStation: '',
    date: '',
    classType: 'Sleeper',
    quota: 'General',
    trainNumber: '',
    autoTatkal: false,
  });
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    paymentMethod: 'UPI',
  });
  const [passengers, setPassengers] = useState([
    { name: '', age: '', gender: '', seatPref: '' }
  ]);

  const [stationData, setStationData] = useState<{ station_name: string; station_code: string }[]>([]);

  useEffect(() => {
    fetch('/list_of_stations.json')
      .then((res) => res.json())
      .then((data) => setStationData(data));
  }, []);

  const stationNames = stationData.map(s => `${s.station_name} (${s.station_code})`);
  console.log('Available stations:', stationNames);
  const inputStyle =
    'border border-gray-300 bg-white rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 placeholder:text-gray-400 transition w-full';

  const handleSharedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSharedData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };
  const handleCredentialChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
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
    if (passengers.length < 4) {
      setPassengers((prev) => [...prev, { name: '', age: '', gender: '', seatPref: '' }]);
    }
  };

  const removePassenger = (index: number) => {
    setPassengers((prev) => prev.filter((_, i) => i !== index));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const generateId = () => Math.random().toString(36).substring(2, 9);

    // Get existing bookings from chrome.storage
    chrome.storage.local.get(['trainBookings'], (result) => {
      const bookings = result.trainBookings || [];
      const updatedBookings = [...bookings];

      if (passengers.length === 1) {
        const p = passengers[0];
        const isDuplicate = bookings.some(
          (b: any) =>
            !b.passengers && // ensure it's not a group
            b.name === p.name &&
            b.date === sharedData.date
        );

        if (!isDuplicate) {
          updatedBookings.push({ ...sharedData, ...p, credentials, id: `${formId}-${p.name}` });
        }
      } else {
        const groupId = `grp-${generateId()}`;
        const passengerList = passengers.map((p, idx) => ({
          ...p,
          id: `${groupId}-${idx + 1}`,
        }));

        updatedBookings.push({
          groupId,
          ...sharedData,
          passengers: passengerList,
          credentials,
        });
      }

      // Save updated data back to chrome.storage
      chrome.storage.local.set({ trainBookings: updatedBookings }, () => {
        alert('Booking submitted!');
        onAdd();

        // Reset form
        setSharedData({
          fromStation: '',
          toStation: '',
          date: '',
          classType: 'Sleeper',
          quota: 'General',
          trainNumber: '',
          autoTatkal: false,
        });
        setPassengers([{ name: '', age: '', gender: '', seatPref: '' }]);
      });
    });
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
          <hr className="my-4 border-indigo-200" />
          <input
            list="station-options"
            name="fromStation"
            placeholder="From Station"
            value={sharedData.fromStation}
            onChange={handleSharedChange}
            className={inputStyle}
            required
          />

          <input
            list="station-options"
            name="toStation"
            placeholder="To Station"
            value={sharedData.toStation}
            onChange={handleSharedChange}
            className={inputStyle}
            required
          />

          <datalist id="station-options">
            {stationNames.map((station, index) => (
              <option key={index} value={station} />
            ))}
          </datalist>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={credentials.username}
              onChange={handleCredentialChange}
              required
              className={inputStyle}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={credentials.password}
              onChange={handleCredentialChange}
              required
              className={inputStyle}
            />
            <select
              name="paymentMethod"
              value={credentials.paymentMethod}
              onChange={handleCredentialChange}
              className={inputStyle}
            >
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="NetBanking">Net Banking</option>
              <option value="Wallet">Wallet</option>
              <option value="Cash on Counter">Cash on Counter</option>
            </select>
          </div>

          <input name="date" type="date" required value={sharedData.date} onChange={handleSharedChange} className={inputStyle} />
          <input name="trainNumber" placeholder="Train Number" value={sharedData.trainNumber} onChange={handleSharedChange} className={inputStyle} />
          <select name="classType" value={sharedData.classType} onChange={handleSharedChange} className={inputStyle}>
            <option value="All Classes">All Classes</option>
            <option value="Anubhuti Class (EA)">Anubhuti Class (EA)</option>
            <option value="AC First Class (1A)">AC First Class (1A)</option>
            <option value="Vistadome AC (EV)">Vistadome AC (EV)</option>
            <option value="Exec. Chair Car (EC)">Exec. Chair Car (EC)</option>
            <option value="AC 2 Tier (2A)">AC 2 Tier (2A)</option>
            <option value="First Class (FC)">First Class (FC)</option>
            <option value="AC 3 Tier (3A)">AC 3 Tier (3A)</option>
            <option value="AC 3 Economy (3E)">AC 3 Economy (3E)</option>
            <option value="Vistadome Chair Car (VC)">Vistadome Chair Car (VC)</option>
            <option value="AC Chair car (CC)">AC Chair car (CC)</option>
            <option value="Sleeper (SL)">Sleeper (SL)</option>
            <option value="Vistadome Non AC (VS)">Vistadome Non AC (VS)</option>
            <option value="Second Sitting (2S)">Second Sitting (2S)</option>
          </select>
          <select
            name="quota"
            value={sharedData.quota}
            onChange={handleSharedChange}
            className={inputStyle}
          >
            <option value="GENERAL">GENERAL</option>
            <option value="LADIES">LADIES</option>
            <option value="LOWER BERTH/SR.CITIZEN">LOWER BERTH/SR.CITIZEN</option>
            <option value="PERSON WITH DISABILITY">PERSON WITH DISABILITY</option>
            <option value="DUTY PASS">DUTY PASS</option>
            <option value="TATKAL">TATKAL</option>
            <option value="PREMIUM TATKAL">PREMIUM TATKAL</option>
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

        <button
          type="button"
          onClick={addPassenger}
          disabled={passengers.length >= 4}
          className={`w-full py-2 font-semibold rounded-lg transition ${passengers.length >= 4
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'text-indigo-700 border border-indigo-300 hover:bg-indigo-100'
            }`}
        >
          ➕ Add Passenger {passengers.length}/4
        </button>


        <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition">
          Book Ticket
        </button>
      </form>
    </div>
  );
}

export default BookingForm;
