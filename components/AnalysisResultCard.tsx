import React, { useState } from 'react';
import { VideoAnalysisResult } from '../types';
import { EyeIcon, SmileIcon, TagIcon } from './icons';

interface AnalysisResultCardProps {
  result: VideoAnalysisResult;
  thumbnail: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
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


const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({ result, thumbnail, isExpanded, onToggleExpand }) => {
  const [activeTab, setActiveTab] = useState<'scenes' | 'elements' | 'tone'>('scenes');

  const isTopRanked = result.rank === 1;

  return (
    <div className={`rounded-lg border-2 transition-all duration-300 ${isTopRanked ? 'bg-green-900/30 border-green-500' : 'bg-gray-900/50 border-gray-700'}`}>
        <div className="p-4">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-center">
                    <div className="text-3xl font-bold">#{result.rank}</div>
                    {thumbnail && <img src={thumbnail} alt={result.fileName} className="w-24 h-24 object-cover rounded-md mt-2"/>}
                </div>
                <div className="flex-grow">
                    <h4 className="font-bold text-lg">{result.fileName}</h4>
                    <p className="text-sm text-gray-400 mt-1"><strong className="text-gray-200">Summary:</strong> {result.summary}</p>
                    <p className="text-sm text-gray-400 mt-1"><strong className="text-gray-200">Justification:</strong> {result.justification}</p>
                    <button onClick={onToggleExpand} className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold mt-2">
                        {isExpanded ? 'Hide' : 'View'} Deep Analysis
                    </button>
                </div>
            </div>
        </div>

        {isExpanded && (
            <div className="bg-gray-900/40 p-4 border-t-2 border-dashed border-gray-700">
                <div className="flex space-x-2 border-b border-gray-700 mb-4">
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