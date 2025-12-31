
import React, { useState, useMemo } from 'react';
import { VideoFile } from '../types';
import { EyeIcon, FilmIcon, SoundWaveIcon, SparklesIcon, PlayIcon, CheckIcon, ScissorsIcon, SlidersIcon } from './icons';
import VideoPlayer from './VideoPlayer';

interface AnalysisResultCardProps {
  videoFile: VideoFile;
  onGenerateBlueprints: () => void;
  onOpenCutter: () => void;
  onOpenAdvancedEditor: () => void;
}

const TabButton: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  id: string; 
  controls: string; 
  children: React.ReactNode 
}> = ({ active, onClick, id, controls, children }) => (
    <button
        id={id}
        role="tab"
        aria-selected={active}
        aria-controls={controls}
        onClick={onClick}
        className={`px-5 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-2.5 relative border ${
            active 
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)]' 
            : 'text-gray-500 border-white/5 hover:bg-white/5 hover:text-gray-300'
        }`}
    >
        {children}
        {active && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,1)]"></span>
        )}
    </button>
);

const ToolButton: React.FC<{ onClick: () => void; children: React.ReactNode, className?: string, icon: React.ReactNode, disabled?: boolean }> = ({ onClick, children, className = '', icon, disabled = false }) => (
    <button onClick={onClick} disabled={disabled} className={`flex-1 font-black text-[10px] uppercase tracking-widest py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed border border-white/5 shadow-lg ${className}`}>
        {icon}
        {children}
    </button>
);

const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({ 
  videoFile, 
  onGenerateBlueprints, 
  onOpenCutter, 
  onOpenAdvancedEditor 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'hooks' | 'scenes' | 'audio'>('hooks');
  const [showPlayer, setShowPlayer] = useState(false);
  
  const { status, analysisResult, thumbnail, id, progress, loadingMessage, file } = videoFile;
  
  const videoUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  
  const isAnalyzed = status === 'analyzed' && analysisResult;
  const rank = analysisResult?.rank;
  const isTopRanked = isAnalyzed && rank === 1;

  return (
    <div className={`rounded-[2.5rem] border transition-all duration-500 glass-panel shadow-2xl overflow-hidden group/card ${isTopRanked ? 'bg-indigo-600/5 border-indigo-500/40 ring-1 ring-indigo-500/20' : 'border-white/5 hover:border-white/10'}`}>
        <div className="p-7">
            <div className="flex gap-7">
                {/* Thumbnail & Player Trigger */}
                <div className="flex-shrink-0">
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => videoUrl && setShowPlayer(!showPlayer)}
                    >
                        {thumbnail ? (
                          <img src={thumbnail} alt={`Thumbnail for ${id}`} className="w-28 h-28 object-cover rounded-3xl border border-white/10 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:brightness-50"/>
                        ) : (
                          <div className="w-28 h-28 bg-black/40 rounded-3xl border border-white/10 flex items-center justify-center">
                            <FilmIcon className="w-12 h-12 text-gray-700"/>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <PlayIcon className="w-10 h-10 text-white fill-current" />
                        </div>

                        {isAnalyzed && (
                            <div className="absolute -top-3 -right-3 w-11 h-11 rounded-full bg-indigo-600 flex flex-col items-center justify-center shadow-2xl z-10 border-4 border-[#020617]">
                                <span className="text-[8px] font-black leading-none opacity-60">RANK</span>
                                <span className="text-sm font-black text-white leading-none">{rank}</span>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Info & Status */}
                <div className="flex-grow min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-black text-xl text-white truncate" title={id}>{id}</h4>
                      {isTopRanked && <SparklesIcon className="w-4 h-4 text-yellow-400 animate-pulse" />}
                    </div>
                    {isAnalyzed ? (
                         <div className="flex flex-wrap items-center gap-2">
                             <div className="flex items-center gap-1.5 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                                <CheckIcon className="w-3 h-3 text-green-400" />
                                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">DR_READY</span>
                             </div>
                             <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{analysisResult.hooks.length} Hook Points</span>
                             {analysisResult.uaeCompliance && (
                               <>
                                 <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
                                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">UAE_SAFE</span>
                               </>
                             )}
                         </div>
                    ) : status === 'processing' ? (
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse flex items-center gap-2">
                                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                                  {loadingMessage || 'Analyzing Multimodal Layers...'}
                                </span>
                                <span className="text-[10px] font-mono text-gray-500 font-bold">{progress}%</span>
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-600">
                          <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest italic">Awaiting Command</span>
                        </div>
                    )}
                </div>
            </div>
            
            {showPlayer && videoUrl && (
              <div className="mt-8 animate-fade-in relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                <VideoPlayer src={videoUrl} />
                <button 
                  onClick={() => setShowPlayer(false)}
                  className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/80 transition-all z-20 border border-white/10"
                >
                  <span className="text-2xl font-light leading-none">&times;</span>
                </button>
              </div>
            )}
            
            {isAnalyzed && (
                <div className="mt-8 flex flex-wrap gap-3">
                    <ToolButton onClick={() => setIsExpanded(!isExpanded)} icon={<EyeIcon className="w-4 h-4"/>} className="bg-white/5 hover:bg-white/10 text-gray-400">
                        {isExpanded ? 'Minimize Intel' : 'Deconstruct Assets'}
                    </ToolButton>
                    <ToolButton onClick={onOpenCutter} icon={<ScissorsIcon className="w-4 h-4"/>} className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border-indigo-500/20">
                        Neural Cutter
                    </ToolButton>
                    <ToolButton onClick={onOpenAdvancedEditor} icon={<SlidersIcon className="w-4 h-4"/>} className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border-purple-500/20">
                        Neural Editor
                    </ToolButton>
                    {isTopRanked && (
                        <button 
                            onClick={onGenerateBlueprints} 
                            className="flex-grow bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] py-3.5 rounded-2xl shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            <SparklesIcon className="w-4 h-4" /> 
                            Architect Blueprints
                        </button>
                    )}
                </div>
            )}
        </div>

        {isAnalyzed && isExpanded && (
            <div className="px-7 pb-8 pt-2 border-t border-white/5 animate-fade-in bg-black/10">
                <div role="tablist" aria-label="Analysis Tabs" className="flex gap-4 mb-7 pt-5 border-t border-white/5 overflow-x-auto pb-2 scrollbar-hide">
                    <TabButton 
                        id="tab-hooks"
                        controls="panel-hooks"
                        active={activeTab === 'hooks'} 
                        onClick={() => setActiveTab('hooks')}
                    >
                        <SparklesIcon className="w-4 h-4" /> Hooks
                    </TabButton>
                    <TabButton 
                        id="tab-scenes"
                        controls="panel-scenes"
                        active={activeTab === 'scenes'} 
                        onClick={() => setActiveTab('scenes')}
                    >
                         <FilmIcon className="w-4 h-4" /> Scenes
                    </TabButton>
                    <TabButton 
                        id="tab-audio"
                        controls="panel-audio"
                        active={activeTab === 'audio'} 
                        onClick={() => setActiveTab('audio')}
                    >
                         <SoundWaveIcon className="w-4 h-4" /> Audio
                    </TabButton>
                </div>

                <div className="relative min-h-[180px]">
                    {activeTab === 'hooks' && (
                        <div id="panel-hooks" role="tabpanel" aria-labelledby="tab-hooks" className="space-y-3 animate-fade-in-up">
                            {analysisResult.hooks.map((hook, i) => (
                                <div key={i} className="flex gap-4 items-start bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all group/item">
                                    <div className="w-7 h-7 rounded-xl bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-400 flex-shrink-0 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-all shadow-inner">
                                      {i + 1}
                                    </div>
                                    <p className="text-[12px] text-gray-300 font-medium leading-relaxed italic">"{hook}"</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'scenes' && (
                        <div id="panel-scenes" role="tabpanel" aria-labelledby="tab-scenes" className="space-y-4 animate-fade-in-up max-h-64 overflow-y-auto pr-3 custom-scrollbar">
                            {analysisResult.sceneDescriptions.map((scene, i) => (
                                <div key={i} className="flex gap-5 group/scene items-start bg-black/20 p-3 rounded-xl border border-white/[0.03]">
                                    <span className="text-[10px] font-mono text-indigo-500 bg-indigo-500/5 px-2 py-1 rounded-lg mt-0.5 border border-indigo-500/10">{scene.timestamp}</span>
                                    <div className="flex-grow">
                                        <p className="text-[12px] text-gray-400 group-hover/scene:text-gray-200 transition-colors leading-relaxed font-medium">{scene.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'audio' && analysisResult.audioAnalysis && (
                        <div id="panel-audio" role="tabpanel" aria-labelledby="tab-audio" className="space-y-6 animate-fade-in-up">
                            <div className="p-5 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-3 opacity-60">Linguistic Summary</span>
                              <p className="text-[12px] text-gray-300 leading-relaxed font-medium italic">"{analysisResult.audioAnalysis.summary}"</p>
                            </div>
                            
                            <div className="space-y-3">
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block px-1">Conversion Keywords</span>
                              <div className="flex flex-wrap gap-2">
                                  {analysisResult.audioAnalysis.keyPhrases.map((phrase, i) => (
                                      <span key={i} className="px-4 py-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[10px] font-black text-indigo-300 uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all cursor-default">{phrase}</span>
                                  ))}
                              </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default AnalysisResultCard;
