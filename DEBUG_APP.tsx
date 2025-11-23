import React from 'react';

export default function DebugApp() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-indigo-400">✅ App is Loading!</h1>
        <p className="text-xl text-gray-300 mb-8">If you see this, the basic setup is working.</p>
        
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="font-bold text-indigo-300">✓ React</p>
            <p className="text-sm text-gray-400">Running</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="font-bold text-indigo-300">✓ Vite</p>
            <p className="text-sm text-gray-400">localhost:3001</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="font-bold text-indigo-300">✓ TypeScript</p>
            <p className="text-sm text-gray-400">Configured</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <p className="font-bold text-indigo-300">✓ Tailwind</p>
            <p className="text-sm text-gray-400">Loaded</p>
          </div>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-8 max-w-2xl">
          <p className="text-yellow-300 font-bold mb-2">Next Step:</p>
          <p className="text-yellow-100">Check browser DevTools Console (F12) for any errors</p>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition"
        >
          Reload Full App
        </button>
      </div>
    </div>
  );
}
