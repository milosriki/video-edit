import React, { useState } from 'react';
import { CreatorDashboard } from './components/CreatorDashboard';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { SparklesIcon } from './components/icons';
import { BarChartIcon } from './components/icons';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [activeTab, setActiveTab] = useState<'creator' | 'analyst'>('creator');

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            AI Video Command Center
          </h1>
          <p className="mt-3 text-lg text-gray-400 max-w-3xl mx-auto">
            Your unified dashboard for AI-powered ad creation, generation, and performance analysis.
          </p>
        </header>

        <div className="flex justify-center mb-8 bg-gray-800/50 p-1 rounded-lg border border-gray-700/50">
          <TabButton
            icon={<SparklesIcon className="w-5 h-5" />}
            isActive={activeTab === 'creator'}
            onClick={() => setActiveTab('creator')}
          >
            Creator AI Tools
          </TabButton>
          <TabButton
            icon={<BarChartIcon className="w-5 h-5" />}
            isActive={activeTab === 'analyst'}
            onClick={() => setActiveTab('analyst')}
          >
            Performance Dashboard
          </TabButton>
        </div>

        <div className="bg-gray-800/50 rounded-2xl shadow-2xl p-0 sm:p-0 backdrop-blur-sm border border-gray-700/50 min-h-[60vh]">
          <ErrorBoundary>
            {activeTab === 'creator' && <CreatorDashboard />}
            {activeTab === 'analyst' && <div className="p-6 sm:p-8"><PerformanceDashboard /></div>}
          </ErrorBoundary>
        </div>
      </main>
      <footer className="text-center mt-8 text-gray-500 text-sm">
        <p>Powered by Google Gemini & FFmpeg.wasm</p>
      </footer>
    </div>
  );
}

const TabButton: React.FC<{
  children: React.ReactNode;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ children, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-md font-semibold transition-all ${
        isActive
          ? 'bg-indigo-600 text-white shadow-lg'
          : 'text-gray-400 hover:bg-gray-700/50'
      }`}
    >
      {icon}
      {children}
    </button>
  );
};