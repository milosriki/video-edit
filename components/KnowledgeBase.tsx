/**
 * KnowledgeBase Component
 * Displays winning patterns from historical $2M data
 */

import React, { useState, useEffect } from 'react';
import { titanApi, KnowledgePattern } from '../services/titanApi';
import { SparklesIcon, TagIcon } from './icons';

interface KnowledgeBaseProps {
  onPatternSelect?: (pattern: KnowledgePattern) => void;
}

type PatternCategory = 'all' | 'hooks' | 'triggers' | 'structures' | 'ctas';

const CategoryButton: React.FC<{
  category: PatternCategory;
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
      active
        ? 'bg-indigo-600 text-white'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
    }`}
  >
    <span>{icon}</span>
    {label}
  </button>
);

const PatternCard: React.FC<{
  pattern: KnowledgePattern;
  onClick?: () => void;
}> = ({ pattern, onClick }) => {
  const perf = pattern.performance_data || {};
  
  return (
    <div
      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-indigo-500/50 cursor-pointer transition-all hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 capitalize">
          {pattern.pattern_type}
        </span>
        {perf.avg_roas && (
          <span className="text-xs text-green-400 font-semibold">
            {perf.avg_roas.toFixed(1)}x ROAS
          </span>
        )}
      </div>
      
      <p className="font-medium mb-2">{pattern.pattern_value}</p>
      
      {/* Performance Data */}
      <div className="flex flex-wrap gap-2 text-xs">
        {perf.effectiveness && (
          <span className="px-2 py-0.5 rounded bg-indigo-900/50 text-indigo-300">
            {perf.effectiveness}/10 effectiveness
          </span>
        )}
        {perf.best_platform && (
          <span className="px-2 py-0.5 rounded bg-purple-900/50 text-purple-300">
            Best on {perf.best_platform}
          </span>
        )}
        {perf.usage_frequency && (
          <span className="px-2 py-0.5 rounded bg-blue-900/50 text-blue-300">
            {Math.round(perf.usage_frequency * 100)}% usage
          </span>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        Source: {pattern.source}
      </div>
    </div>
  );
};

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onPatternSelect }) => {
  const [category, setCategory] = useState<PatternCategory>('all');
  const [patterns, setPatterns] = useState<Record<string, KnowledgePattern[]>>({
    hooks: [],
    triggers: [],
    structures: [],
    ctas: [],
  });
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [patternsRes, statsRes] = await Promise.all([
        titanApi.getWinningPatterns(),
        titanApi.getKnowledgeStats(),
      ]);
      
      // Organize patterns by type
      const organized: Record<string, KnowledgePattern[]> = {
        hooks: [],
        triggers: [],
        structures: [],
        ctas: [],
      };
      
      if (patternsRes.patterns && typeof patternsRes.patterns === 'object') {
        // Handle object format { hooks: [], triggers: [], ... }
        if (patternsRes.patterns.hooks) {
          organized.hooks = patternsRes.patterns.hooks;
          organized.triggers = patternsRes.patterns.triggers || [];
          organized.structures = patternsRes.patterns.structures || [];
          organized.ctas = patternsRes.patterns.ctas || [];
        } else if (Array.isArray(patternsRes.patterns)) {
          // Handle array format
          patternsRes.patterns.forEach((p: KnowledgePattern) => {
            const key = p.pattern_type === 'hook' ? 'hooks' 
              : p.pattern_type === 'trigger' ? 'triggers'
              : p.pattern_type === 'structure' ? 'structures'
              : p.pattern_type === 'cta' ? 'ctas'
              : null;
            if (key && organized[key]) {
              organized[key].push(p);
            }
          });
        }
      }
      
      setPatterns(organized);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load knowledge base:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayPatterns = (): KnowledgePattern[] => {
    let result: KnowledgePattern[] = [];
    
    if (category === 'all') {
      result = [
        ...patterns.hooks,
        ...patterns.triggers,
        ...patterns.structures,
        ...patterns.ctas,
      ];
    } else {
      result = patterns[category] || [];
    }
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(p => 
        p.pattern_value.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return result;
  };

  const displayPatterns = getDisplayPatterns();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TagIcon className="w-6 h-6 text-indigo-400" />
            Knowledge Base
          </h2>
          <p className="text-gray-400 mt-1">
            Winning patterns from $2M+ historical campaign data
          </p>
        </div>
        {stats && (
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {stats.avg_roas?.toFixed(2)}x
            </div>
            <div className="text-xs text-gray-500">Historical Avg ROAS</div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="text-2xl font-bold">{stats.total_campaigns || 0}</div>
            <div className="text-xs text-gray-500">Total Campaigns</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="text-2xl font-bold">${((stats.total_spend || 0) / 1000).toFixed(1)}k</div>
            <div className="text-xs text-gray-500">Total Spend</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="text-2xl font-bold">{stats.total_patterns || 0}</div>
            <div className="text-xs text-gray-500">Patterns Learned</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="text-2xl font-bold">{(stats.by_type?.hooks || 0)}</div>
            <div className="text-xs text-gray-500">Winning Hooks</div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <CategoryButton
          category="all"
          label="All"
          icon="📚"
          active={category === 'all'}
          onClick={() => setCategory('all')}
        />
        <CategoryButton
          category="hooks"
          label="Hooks"
          icon="🪝"
          active={category === 'hooks'}
          onClick={() => setCategory('hooks')}
        />
        <CategoryButton
          category="triggers"
          label="Triggers"
          icon="💡"
          active={category === 'triggers'}
          onClick={() => setCategory('triggers')}
        />
        <CategoryButton
          category="structures"
          label="Structures"
          icon="🏗️"
          active={category === 'structures'}
          onClick={() => setCategory('structures')}
        />
        <CategoryButton
          category="ctas"
          label="CTAs"
          icon="👆"
          active={category === 'ctas'}
          onClick={() => setCategory('ctas')}
        />
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search patterns..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Patterns Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : displayPatterns.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <SparklesIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No patterns found</p>
          <p className="text-sm">Try a different category or search term</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayPatterns.map((pattern, i) => (
            <PatternCard
              key={pattern.id || i}
              pattern={pattern}
              onClick={() => onPatternSelect?.(pattern)}
            />
          ))}
        </div>
      )}

      {/* Add Pattern Button */}
      <div className="text-center pt-4 border-t border-gray-700">
        <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
          + Add Custom Pattern
        </button>
      </div>
    </div>
  );
};

export default KnowledgeBase;
