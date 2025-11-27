/**
 * ProactiveInsights Component
 * Shows AI-generated proactive suggestions based on historical patterns
 */

import React, { useState, useEffect } from 'react';
import { titanApi, ProactiveInsight } from '../services/titanApi';
import { SparklesIcon } from './icons';

interface ProactiveInsightsProps {
  onInsightClick?: (insight: ProactiveInsight) => void;
}

const InsightCard: React.FC<{ 
  insight: ProactiveInsight; 
  onClick?: () => void;
}> = ({ insight, onClick }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-900/20';
      case 'high': return 'border-orange-500 bg-orange-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-900/20';
      case 'low': return 'border-blue-500 bg-blue-900/20';
      default: return 'border-gray-500 bg-gray-900/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return '📊';
      case 'optimization': return '⚡';
      case 'trend': return '📈';
      case 'warning': return '⚠️';
      default: return '💡';
    }
  };

  return (
    <div 
      className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:scale-[1.02] ${getPriorityColor(insight.priority)}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getTypeIcon(insight.insight_type)}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold">{insight.title}</h4>
            <span className="text-xs text-gray-500 uppercase">{insight.priority}</span>
          </div>
          <p className="text-sm text-gray-400 mb-2">{insight.description}</p>
          {insight.action && (
            <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">
              {insight.action} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProactiveInsights: React.FC<ProactiveInsightsProps> = ({ onInsightClick }) => {
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await titanApi.getProactiveInsights();
      setInsights(response.insights || []);
    } catch (err) {
      console.error('Failed to load insights:', err);
      setError('Failed to load insights');
      // Fallback to mock insights
      setInsights([
        {
          insight_type: 'performance',
          title: 'Your hook game is strong!',
          description: 'Videos with pattern interrupt hooks are performing 42% better than average.',
          action: 'See top hooks',
          priority: 'high',
        },
        {
          insight_type: 'optimization',
          title: 'Add more transformations',
          description: 'Before/after content has 3.2x higher ROAS in your niche.',
          action: 'Generate blueprints',
          priority: 'medium',
        },
        {
          insight_type: 'trend',
          title: 'Short-form trending',
          description: '15-second versions of your ads are seeing 28% higher CTR.',
          action: 'Try Smart Cutter',
          priority: 'medium',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <SparklesIcon className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h3 className="text-lg font-bold">Loading Insights...</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-purple-900/30 to-pink-900/30">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
            Proactive Insights
          </h3>
          <button 
            onClick={loadInsights}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          AI-powered suggestions based on your historical data
        </p>
      </div>

      <div className="p-4 space-y-3">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <SparklesIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No insights available yet.</p>
            <p className="text-sm">Analyze some videos to get personalized suggestions.</p>
          </div>
        ) : (
          insights.map((insight, i) => (
            <InsightCard 
              key={i} 
              insight={insight}
              onClick={() => onInsightClick?.(insight)}
            />
          ))
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border-t border-red-900/50">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ProactiveInsights;
