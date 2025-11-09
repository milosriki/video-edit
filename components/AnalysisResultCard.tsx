import React, { useState } from 'react';
import { VideoFile } from '../types';
import { EyeIcon, SmileIcon, TagIcon, WandIcon, ScissorsIcon, FilmIcon } from './icons';

interface AnalysisResultCardProps {
  videoFile: VideoFile;
  onGenerateBlueprints: () => void;
  onOpenCutter: () => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'
        }`}
    >
        {children}
    </button>
);

const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({ videoFile, onGenerateBlueprints, onOpenCutter }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'scenes' | 'elements' | 'tone'>('scenes');
  
  const { status, analysisResult, thumbnail, id, error } = videoFile;
  const result = analysisResult;
  
  const isAnalyzed = status === 'analyzed' && result;
  const isTopRanked = isAnalyzed && result.rank === 1;

  const renderStatusPill = () => {
    switch (status) {
      case 'processing':
        return <span className="text-xs font-medium text-yellow-300 bg-yellow-900/50 px-2 py-1 rounded-full">Processing...</span>;
      case 'analyzed':
        return <span className="text-xs font-medium text-green-300 bg-green-900/50 px-2 py-1 rounded-full">Analyzed</span>;
      case 'error':
        return <span className="text-xs font-medium text-red-300 bg-red-900/50 px-2 py-1 rounded-full">Error</span>;
      case 'pending':
        return <span className="text-xs font-medium text-gray-300 bg-gray-700/50 px-2 py-1 rounded-full">Queued</span>;
    }
  };

  return (
    <div className={`rounded-lg border-2 transition-all duration-300 ${isTopRanked ? 'bg-green-900/30 border-green-500' : 'bg-gray-900/50 border-gray-700'} ${!isAnalyzed && status !== 'error' && 'opacity-60'}`}>
        <div className="p-4">
            <div className="flex items-start gap-4">
                {/* Thumbnail & Rank */}
                <div className="flex-shrink-0 text-center w-24">
                    {isAnalyzed ? (
                      <div className="text-3xl font-bold">#{result.rank}</div>
                    ) : (
                      <div className="text-3xl font-bold text-gray-600">--</div>
                    )}
                    {thumbnail ? (
                      <img src={thumbnail} alt={id} className="w-24 h-24 object-cover rounded-md mt-2"/>
                    ) : (
                      <div className="w-24 h-24 bg-gray-800 rounded-md mt-2 flex items-center justify-center">
                        <FilmIcon className="w-10 h-10 text-gray-600"/>
                      </div>
                    )}
                </div>
                
                {/* Info & Status */}
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-lg max-w-xs truncate" title={id}>{id}</h4>
                      {renderStatusPill()}
                    </div>
                    
                    {isAnalyzed && (
                      <>
                        <p className="text-sm text-gray-400 mt-1"><strong className="text-gray-200">Summary:</strong> {result.summary}</p>
                        <p className="text-sm text-gray-400 mt-1"><strong className="text-gray-200">Justification:</strong> {result.justification}</p>
                        <button onClick={() => setIsExpanded(prev => !prev)} className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold mt-2">
                            {isExpanded ? 'Hide' : 'View'} Deep Analysis
                        </button>
                      </>
                    )}
                    {status === 'processing' && <p className="text-sm text-yellow-300 mt-2">AI is analyzing this video...</p>}
                    {status === 'error' && (
                        <div className="mt-2 bg-red-900/40 border-l-4 border-red-600 text-red-300 p-3 rounded-r-md">
                            <p className="font-semibold text-sm">Processing Failed</p>
                            <p className="text-xs mt-1">{error}</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Action Buttons */}
            {isAnalyzed && (
              <div className="mt-4 pt-4 border-t border-gray-700/50 flex flex-col sm:flex-row gap-3">
                  <button onClick={onGenerateBlueprints} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105">
                      <WandIcon className="w-5 h-5"/>
                      Generate Ad Blueprints
                  </button>
                  <button onClick={onOpenCutter} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105">
                      <ScissorsIcon className="w-5 h-5"/>
                      Open Smart Cutter
                  </button>
              </div>
            )}
        </div>

        {/* Expanded Deep Analysis Panel */}
        {isAnalyzed && isExpanded && (
            <div className="bg-gray-900/40 p-4 border-t-2 border-dashed border-gray-700 animate-fade-in">
                <div className="flex space-x-2 border-b border-gray-700 mb-4 overflow-x-auto pb-2">
                    <TabButton active={activeTab === 'scenes'} onClick={() => setActiveTab('scenes')}>
                        <div className="flex items-center gap-2"><EyeIcon className="w-4 h-4" /> Scene Breakdown</div>
                    </TabButton>
                    <TabButton active={activeTab === 'elements'} onClick={() => setActiveTab('elements')}>
                         <div className="flex items-center gap-2"><TagIcon className="w-4 h-4" /> Key Elements</div>
                    </TabButton>
                    <TabButton active={activeTab === 'tone'} onClick={() => setActiveTab('tone')}>
                         <div className="flex items-center gap-2"><SmileIcon className="w-4 h-4" /> Emotional Tone</div>
                    </TabButton>
                </div>

                <div className="text-sm max-h-48 overflow-y-auto pr-2">
                    {activeTab === 'scenes' && (
                        <div className="space-y-3">
                            {result.sceneDescriptions.map((scene, i) => (
                                <div key={i} className="flex gap-3">
                                    <div className="font-mono text-indigo-400 whitespace-nowrap">{scene.timestamp}</div>
                                    <p className="text-gray-300">{scene.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'elements' && (
                        <div className="flex flex-wrap gap-2">
                            {result.keyObjects.map((obj, i) => <span key={i} className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full">{obj}</span>)}
                        </div>
                    )}
                    {activeTab === 'tone' && (
                         <div className="flex flex-wrap gap-2">
                            {result.emotionalTone.map((tone, i) => <span key={i} className="bg-purple-800 text-purple-200 px-2 py-1 rounded-full">{tone}</span>)}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default AnalysisResultCard;
