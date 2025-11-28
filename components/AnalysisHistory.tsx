import React, { useState, useEffect } from 'react';
import { EyeIcon, TrashIcon, DownloadIcon } from './icons';

interface AnalysisRecord {
  id: string;
  videoName: string;
  analyzedAt: string;
  hookStyle: string;
  pacing: string;
  emotionalTrigger: string;
  predictedScore: number;
  actualRoas?: number;
  status: 'pending' | 'analyzed' | 'deployed';
}

// Mock data for demo - in production, fetch from Supabase
const mockHistoryData: AnalysisRecord[] = [
  {
    id: '1',
    videoName: 'Summer_Promo_V3.mp4',
    analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    hookStyle: 'Visual Shock',
    pacing: 'Fast',
    emotionalTrigger: 'Urgency',
    predictedScore: 87,
    actualRoas: 3.2,
    status: 'deployed',
  },
  {
    id: '2',
    videoName: 'Testimonial_Mike_Final.mp4',
    analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    hookStyle: 'Testimonial',
    pacing: 'Medium',
    emotionalTrigger: 'Trust',
    predictedScore: 72,
    actualRoas: 2.8,
    status: 'deployed',
  },
  {
    id: '3',
    videoName: 'Problem_Solution_Draft.mp4',
    analyzedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    hookStyle: 'Question',
    pacing: 'Slow',
    emotionalTrigger: 'Fear',
    predictedScore: 65,
    status: 'analyzed',
  },
  {
    id: '4',
    videoName: 'New_Year_Campaign.mp4',
    analyzedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    hookStyle: 'Pattern Interrupt',
    pacing: 'Fast',
    emotionalTrigger: 'FOMO',
    predictedScore: 92,
    status: 'pending',
  },
];

const AnalysisHistory: React.FC = () => {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'analyzed' | 'deployed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  useEffect(() => {
    // Simulate loading from Supabase
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        // In production, fetch from Supabase:
        // const { data } = await supabase.from('analysis_history').select('*').order('analyzed_at', { ascending: false });
        
        // For now, use mock data
        await new Promise(resolve => setTimeout(resolve, 500));
        setHistory(mockHistoryData);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const filteredHistory = history
    .filter(record => filter === 'all' || record.status === filter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime();
      } else {
        return b.predictedScore - a.predictedScore;
      }
    });

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      analyzed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      deployed: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-400">Loading history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analysis History</h2>
          <p className="text-gray-400 text-sm mt-1">View past video analyses and their performance</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="analyzed">Analyzed</option>
            <option value="deployed">Deployed</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
          >
            <option value="date">Sort by Date</option>
            <option value="score">Sort by Score</option>
          </select>
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
          <p className="text-gray-400">No analyses found matching your filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((record) => (
            <div
              key={record.id}
              className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4 hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Video info */}
                <div className="flex-grow">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{record.videoName}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(record.status)}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{formatDate(record.analyzedAt)}</p>
                </div>

                {/* Middle: Analysis features */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full">
                    Hook: {record.hookStyle}
                  </span>
                  <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                    Pacing: {record.pacing}
                  </span>
                  <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full">
                    {record.emotionalTrigger}
                  </span>
                </div>

                {/* Right: Scores and actions */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Predicted</div>
                    <div className={`text-2xl font-bold ${getScoreColor(record.predictedScore)}`}>
                      {record.predictedScore}
                    </div>
                  </div>
                  
                  {record.actualRoas !== undefined && (
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Actual ROAS</div>
                      <div className="text-2xl font-bold text-emerald-400">
                        {record.actualRoas.toFixed(1)}x
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
                      title="View Details"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
                      title="Download Report"
                    >
                      <DownloadIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-gray-800/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-indigo-400">{history.length}</div>
          <div className="text-sm text-gray-400">Total Analyses</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {history.filter(h => h.status === 'deployed').length}
          </div>
          <div className="text-sm text-gray-400">Deployed</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {Math.round(history.reduce((acc, h) => acc + h.predictedScore, 0) / (history.length || 1))}
          </div>
          <div className="text-sm text-gray-400">Avg Score</div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {(() => {
              const withRoas = history.filter(h => h.actualRoas);
              const total = withRoas.reduce((acc, h) => acc + (h.actualRoas || 0), 0);
              return (total / (withRoas.length || 1)).toFixed(1);
            })()}x
          </div>
          <div className="text-sm text-gray-400">Avg ROAS</div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisHistory;
