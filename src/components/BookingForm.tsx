import { useState, useId } from 'react';

function BookingForm({ onAdd }: { onAdd: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    email: '',
    phone: '',
    from: '',
    to: '',
    date: '',
    classType: 'Sleeper',
    quota: 'General',
    trainNumber: '',
    seatPref: '',
    autoTatkal: false,
  });
  const formId = useId();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Step 1: Get existing bookings
    const existingData = localStorage.getItem('trainBookings');
    const bookings = existingData ? JSON.parse(existingData) : [];

    // Step 2: Check if this booking already exists
    const isDuplicate = bookings.some(
      (booking: typeof formData) =>
        booking.name === formData.name &&
        booking.phone === formData.phone &&
        booking.date === formData.date &&
        booking.from.toLowerCase() === formData.from.toLowerCase() &&
        booking.to.toLowerCase() === formData.to.toLowerCase()
    );

    if (isDuplicate) {
      alert('This booking already exists.');
      return;
    }

    // Step 3: Save booking if it's new
    const addBooking = {
      ...formData,
      id: formId, // Generate a unique ID for the booking
    };
    bookings.push(addBooking);
    localStorage.setItem('trainBookings', JSON.stringify(bookings));

    alert('Train booking submitted and saved!');
    setFormData({
      name: '',
      age: '',
      gender: '',
      email: '',
      phone: '',
      from: '',
      to: '',
      date: '',
      classType: 'Sleeper',
      quota: 'General',
      trainNumber: '',
      seatPref: '',
      autoTatkal: false,
    });
    onAdd(); // Notify parent to refresh the booking list

    console.log('Booking saved:', formData);
  };


  const inputStyle =
    'border border-gray-300 bg-white rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 placeholder:text-gray-400 transition w-full';

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 to-indigo-100 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-2xl rounded-xl p-4 w-full max-w-2xl space-y-6 border border-indigo-100"
      >
        <h1 className="text-3xl font-extrabold text-center text-indigo-700">Auto Ticketing Tool</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            type="text"
            value={formData.name}
            placeholder="Full Name"
            required
            onChange={handleChange}
            className={inputStyle}
          />
          <input
            name="age"
            type="number"
            value={formData.age}
            placeholder="Age"
            required
            onChange={handleChange}
            className={inputStyle}
          />
          <select
            name="gender"
            value={formData.gender}
            required
            onChange={handleChange}
            className={inputStyle}
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
          <input
            name="phone"
            type="tel"
            value={formData.phone}
            placeholder="Phone Number"
            required
            onChange={handleChange}
            className={inputStyle}
          />
          <input
            name="email"
            type="email"
            value={formData.email}
            placeholder="Email Address"
            onChange={handleChange}
            className={inputStyle}
          />
          <input
            name="date"
            type="date"
            value={formData.date}
            required
            onChange={handleChange}
            className={inputStyle}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="from"
            type="text"
            value={formData.from}
            placeholder="From Station"
            required
            onChange={handleChange}
            className={inputStyle}
          />
          <input
            name="to"
            type="text"
            value={formData.to}
            placeholder="To Station"
            required
            onChange={handleChange}
            className={inputStyle}
          />
          <select
            name="classType"
            value={formData.classType}
            onChange={handleChange}
            className={inputStyle}
          >
            <option value="Sleeper">Sleeper</option>
            <option value="3AC">3AC</option>
            <option value="2AC">2AC</option>
            <option value="1AC">1AC</option>
          </select>
          <select
            name="quota"
            value={formData.quota}
            onChange={handleChange}
            className={inputStyle}
          >
            <option value="General">General</option>
            <option value="Tatkal">Tatkal</option>
            <option value="Ladies">Ladies</option>
            <option value="Senior Citizen">Senior Citizen</option>
          </select>
          <input
            name="trainNumber"
            type="text"
            value={formData.trainNumber}
            placeholder="Train Number (Optional)"
            onChange={handleChange}
            className={inputStyle}
          />
          <input
            name="seatPref"
            type="text"
            value={formData.seatPref}
            placeholder="Seat Preference (Optional)"
            onChange={handleChange}
            className={inputStyle}
          />
        </div>

        <div className="flex items-center space-x-3">
          <input
            name="autoTatkal"
            type="checkbox"
            checked={formData.autoTatkal}
            onChange={handleChange}
            className="accent-indigo-600"
          />
          <span className="text-sm text-gray-700">Auto-book at Tatkal Opening Time</span>
        </div>


        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
        >
          Book Ticket
        </button>
      </form>
    </div>
  );
}

export default BookingForm;
