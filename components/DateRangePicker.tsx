import React, { useState, useEffect } from 'react';
import { CalendarIcon } from './icons';

interface DateRangePickerProps {
  initialFrom: number;
  initialTo: number;
  onChange: (from: number, to: number) => void;
}

// Helper to format timestamp to YYYY-MM-DD for date input
const toInputDate = (timestamp: number) => {
  return new Date(timestamp).toISOString().split('T')[0];
};

const DateRangePicker: React.FC<DateRangePickerProps> = ({ initialFrom, initialTo, onChange }) => {
  const [from, setFrom] = useState(toInputDate(initialFrom));
  const [to, setTo] = useState(toInputDate(initialTo));

  useEffect(() => {
    setFrom(toInputDate(initialFrom));
    setTo(toInputDate(initialTo));
  }, [initialFrom, initialTo]);
  
  const applyDateChange = () => {
    // Convert YYYY-MM-DD from input to timestamp at start/end of day
    const fromTimestamp = new Date(from).getTime();
    // Set 'to' date to the very end of the day
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    const toTimestamp = toDate.getTime();

    if (fromTimestamp && toTimestamp && fromTimestamp <= toTimestamp) {
      onChange(fromTimestamp, toTimestamp);
    }
  };

  const setPresetRange = (days: number) => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const toTimestamp = now.getTime();
    
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - (days -1));
    fromDate.setHours(0, 0, 0, 0);
    const fromTimestamp = fromDate.getTime();

    onChange(fromTimestamp, toTimestamp);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-gray-800/60 border border-gray-700/60 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-gray-400" />
        <span className="text-sm font-semibold">Date Range:</span>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <input 
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="bg-gray-900 border border-gray-600 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-gray-400">-</span>
        <input 
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="bg-gray-900 border border-gray-600 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500"
        />
        <button 
          onClick={applyDateChange}
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-md text-sm font-semibold transition-colors"
        >
          Apply
        </button>
      </div>

      <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
        <button onClick={() => setPresetRange(7)} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm">Last 7d</button>
        <button onClick={() => setPresetRange(14)} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm">Last 14d</button>
        <button onClick={() => setPresetRange(30)} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-sm">Last 30d</button>
      </div>
    </div>
  );
};

export default DateRangePicker;
