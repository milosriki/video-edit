import React, { useState } from 'react';
import { VideoFile } from '../types';
import { EyeIcon, SmileIcon, TagIcon, WandIcon, ScissorsIcon, FilmIcon, SoundWaveIcon, SlidersIcon } from './icons';

interface AnalysisResultCardProps {
  videoFile: VideoFile;
  onGenerateBlueprints: () => void;
  onOpenCutter: () => void;
  onOpenAdvancedEditor: () => void;
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

const ToolButton: React.FC<{ onClick: () => void; children: React.ReactNode, className?: string, icon: React.ReactNode, disabled?: boolean }> = ({ onClick, children, className = '', icon, disabled = false }) => (
    <button onClick={onClick} disabled={disabled} className={`flex-1 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
        {icon}
        {children}
    </button>
);


const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({ videoFile, onGenerateBlueprints, onOpenCutter, onOpenAdvancedEditor }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'scenes' | 'elements' | 'tone' | 'audio'>('scenes');
  
  const { status, analysisResult, thumbnail, id, error, progress, loadingMessage } = videoFile;
  
  const isAnalyzed = status === 'analyzed' && analysisResult;
  const rank = analysisResult?.rank;
  const isTopRanked = isAnalyzed && rank === 1;
  const hasAudioAnalysis = isAnalyzed && analysisResult.audioAnalysis && (analysisResult.audioAnalysis.summary || (analysisResult.audioAnalysis.keyPhrases && analysisResult.audioAnalysis.keyPhrases.length > 0));


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
    <div className={`rounded-lg border-2 transition-all duration-300 ${isTopRanked ? 'bg-green-900/30 border-green-500' : 'bg-gray-900/50 border-gray-700'}`}>
        <div className="p-4">
            <div className="flex items-start gap-4">
                {/* Thumbnail & Rank */}
                <div className="flex-shrink-0 text-center w-24">
                    {isAnalyzed && typeof rank === 'number' ? (
                      <div className="text-3xl font-bold">#{rank}</div>
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
                <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-lg max-w-xs truncate" title={id}>{id}</h4>
                      {renderStatusPill()}
                    </div>
                    
                    {isAnalyzed && analysisResult && (
                      <>
                        <p className="text-sm text-gray-400 mt-1"><strong className="text-gray-200">Summary:</strong> {analysisResult.summary}</p>
                        <p className="text-sm text-gray-400 mt-1"><strong className="text-gray-200">Justification:</strong> {analysisResult.justification}</p>
                        <button onClick={() => setIsExpanded(prev => !prev)} className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold mt-2">
                            {isExpanded ? 'Hide' : 'View'} Deep Analysis
                        </button>
                      </>
                    )}
                    {status === 'processing' && (
                        <div className="mt-2">
                            <p className="text-sm font-semibold text-yellow-300">{loadingMessage || 'Processing...'}</p>
                            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                <div className="bg-yellow-500 h-1.5 rounded-full transition-all" style={{ width: `${progress || 0}%` }}></div>
                            </div>
                        </div>
                    )}
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
                  <ToolButton onClick={onGenerateBlueprints} icon={<WandIcon className="w-5 h-5"/>} className="bg-purple-600 hover:bg-purple-700 text-white">
                      Generate Blueprints
                  </ToolButton>
                  <ToolButton onClick={onOpenCutter} icon={<ScissorsIcon className="w-5 h-5"/>} className="bg-gray-700 hover:bg-gray-600 text-white">
                      Smart Cutter
                  </ToolButton>
                   <ToolButton onClick={onOpenAdvancedEditor} icon={<SlidersIcon className="w-5 h-5"/>} className="bg-gray-700 hover:bg-gray-600 text-white">
                      Manual Editor
                  </ToolButton>
              </div>
            )}
        </div>

        {/* Expanded Deep Analysis Panel */}
        {isAnalyzed && isExpanded && analysisResult && (
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
                    {hasAudioAnalysis && (
                        <TabButton active={activeTab === 'audio'} onClick={() => setActiveTab('audio')}>
                            <div className="flex items-center gap-2"><SoundWaveIcon className="w-4 h-4" /> Audio Insights</div>
                        </TabButton>
                    )}
                </div>

                <div className="text-sm max-h-48 overflow-y-auto pr-2">
                    {activeTab === 'scenes' && (
                        <div className="space-y-3">
                            {analysisResult.sceneDescriptions?.map((scene, i: number) => (
                                <div key={i} className="flex gap-3">
                                    <div className="font-mono text-indigo-400 whitespace-nowrap">{scene.timestamp}</div>
                                    <p className="text-gray-300">{scene.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'elements' && (
                        <div className="flex flex-wrap gap-2">
                            {analysisResult.keyObjects?.map((obj: string, i: number) => <span key={i} className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full">{obj}</span>)}
                        </div>
                    )}
                    {activeTab === 'tone' && (
                         <div className="flex flex-wrap gap-2">
                            {analysisResult.emotionalTone?.map((tone: string, i: number) => <span key={i} className="bg-purple-800 text-purple-200 px-2 py-1 rounded-full">{tone}</span>)}
                        </div>
                    )}
                    {activeTab === 'audio' && hasAudioAnalysis && analysisResult.audioAnalysis && (
                        <div className="space-y-4">
                            <div>
                                <h5 className="font-semibold text-gray-400 mb-1">Speech Summary</h5>
                                <p className="text-gray-300">{analysisResult.audioAnalysis.summary}</p>
                            </div>
                            {analysisResult.audioAnalysis.keyPhrases?.length > 0 && <div>
                                <h5 className="font-semibold text-gray-400 mb-2">Key Phrases</h5>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResult.audioAnalysis.keyPhrases?.map((phrase, i) => <span key={i} className="bg-blue-800 text-blue-200 px-2 py-1 rounded-full">{phrase}</span>)}
                                </div>
                            </div>}
                             {analysisResult.audioAnalysis.callsToAction?.length > 0 && <div>
                                <h5 className="font-semibold text-gray-400 mb-2">Calls to Action</h5>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResult.audioAnalysis.callsToAction?.map((cta, i) => <span key={i} className="bg-green-800 text-green-200 px-2 py-1 rounded-full">{cta}</span>)}
                                </div>
                            </div>}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default AnalysisResultCard;