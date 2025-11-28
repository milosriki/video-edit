import React, { useState } from 'react';
import { CreatorDashboard } from './components/CreatorDashboard';
import { PerformanceDashboard } from './components/PerformanceDashboard';
import { SparklesIcon, BarChartIcon, HistoryIcon, SettingsIcon } from './components/icons';
import { ErrorBoundary } from './components/ErrorBoundary';
import AnalysisHistory from './components/AnalysisHistory';

type TabType = 'home' | 'creator' | 'analyst' | 'history';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <main className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            PTD Elite Dashboard
          </h1>
          <p className="mt-3 text-lg text-gray-400 max-w-3xl mx-auto">
            AI-powered video ad analysis, prediction, and generation platform
          </p>
        </header>

        <div className="flex justify-center mb-8 bg-gray-800/50 p-1 rounded-lg border border-gray-700/50 overflow-x-auto">
          <TabButton
            icon={<SparklesIcon className="w-5 h-5" />}
            isActive={activeTab === 'home'}
            onClick={() => setActiveTab('home')}
          >
            Home
          </TabButton>
          <TabButton
            icon={<SparklesIcon className="w-5 h-5" />}
            isActive={activeTab === 'creator'}
            onClick={() => setActiveTab('creator')}
          >
            Creator Tools
          </TabButton>
          <TabButton
            icon={<BarChartIcon className="w-5 h-5" />}
            isActive={activeTab === 'analyst'}
            onClick={() => setActiveTab('analyst')}
          >
            Performance
          </TabButton>
          <TabButton
            icon={<HistoryIcon className="w-5 h-5" />}
            isActive={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          >
            History
          </TabButton>
        </div>

        <div className="bg-gray-800/50 rounded-2xl shadow-2xl p-0 sm:p-0 backdrop-blur-sm border border-gray-700/50 min-h-[60vh]">
          <ErrorBoundary>
            {activeTab === 'home' && <HomeDashboard onNavigate={setActiveTab} />}
            {activeTab === 'creator' && <CreatorDashboard />}
            {activeTab === 'analyst' && <div className="p-6 sm:p-8"><PerformanceDashboard /></div>}
            {activeTab === 'history' && <div className="p-6 sm:p-8"><AnalysisHistory /></div>}
          </ErrorBoundary>
        </div>
      </main>
      <footer className="text-center mt-8 text-gray-500 text-sm">
        <p>Powered by Google Gemini & Project Titan AI</p>
      </footer>
    </div>
  );
}

// Home Dashboard with Quick Action Cards
const HomeDashboard: React.FC<{ onNavigate: (tab: TabType) => void }> = ({ onNavigate }) => {
  const quickActions = [
    {
      title: '📂 Scan New Video',
      description: 'Upload a video to analyze hook, pacing, and emotional triggers',
      action: () => onNavigate('creator'),
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      title: '📊 View Ad Performance',
      description: 'Check ROAS, CTR, and conversions across your campaigns',
      action: () => onNavigate('analyst'),
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: '🕐 Analysis History',
      description: 'View past video analyses and their predicted scores',
      action: () => onNavigate('history'),
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: '🧠 AI Assistant',
      description: 'Chat with your AI ad strategist for brainstorming',
      action: () => onNavigate('creator'),
      gradient: 'from-rose-500 to-pink-600',
    },
  ];

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Welcome to Project Titan</h2>
        <p className="text-gray-400">Your 11-engine AI ensemble for winning ad predictions</p>
      </div>
      
      {/* Quick Action Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`group relative bg-gradient-to-br ${action.gradient} p-6 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
          >
            <h3 className="text-xl font-bold mb-2">{action.title}</h3>
            <p className="text-white/80 text-sm">{action.description}</p>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 group-hover:opacity-100 transition-opacity">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatusCard title="System Status" value="Operational" status="success" />
        <StatusCard title="AI Engines" value="11 Active" status="success" />
        <StatusCard title="Last Sync" value="Just now" status="info" />
      </div>
    </div>
  );
};

const StatusCard: React.FC<{
  title: string;
  value: string;
  status: 'success' | 'warning' | 'error' | 'info';
}> = ({ title, value, status }) => {
  const statusColors = {
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
};

const TabButton: React.FC<{
  children: React.ReactNode;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ children, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-md font-semibold transition-all whitespace-nowrap ${
        isActive
          ? 'bg-indigo-600 text-white shadow-lg'
          : 'text-gray-400 hover:bg-gray-700/50'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
};