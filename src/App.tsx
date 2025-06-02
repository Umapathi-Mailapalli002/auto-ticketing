import { useState } from "react";
import BookingForm from "./components/BookingForm";
import BookingList from "./components/BookingList";

function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');
  const [refresh, setRefresh] = useState(false);

  return (
    <div className="p-4 bg-gray-100 min-h-screen w-80">
      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('form')}
          className={`px-4 py-2 rounded-md font-medium ${
            activeTab === 'form'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Booking Form
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 rounded-md font-medium ${
            activeTab === 'list'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300'
          }`}
        >
          Booking List
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'form' ? (
        <BookingForm onAdd={() => setRefresh(!refresh)} />
      ) : (
        <BookingList key={refresh.toString()} />
      )}
    </div>
  );
}

export default App;
