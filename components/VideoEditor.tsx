
import React, { useState, useRef, useEffect } from 'react';
import { AdCreative, AdPhase, EditScene } from '../types';
import { processVideoWithCreative } from '../services/videoProcessor';
import { DownloadIcon, FilmIcon, WandIcon, SparklesIcon, CheckIcon, ShieldIcon, RefreshIcon, SlidersIcon } from './icons';
import { formatErrorMessage } from '../utils/error';
import VideoPlayer from './VideoPlayer';

interface VideoEditorProps {
  adCreative: AdCreative;
  sourceVideos: File[]; 
  onClose: () => void;
}

const PhaseBadge: React.FC<{ phase: AdPhase }> = ({ phase }) => {
    const colors = {
        HOOK: 'bg-red-500/20 text-red-400 border-red-500/30',
        MECHANISM: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
        PROOF: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        ACTION: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${colors[phase]}`}>
            {phase}
        </span>
    );
};

const VideoEditor: React.FC<VideoEditorProps> = ({ adCreative: initialCreative, sourceVideos, onClose }) => {
  const [adCreative, setAdCreative] = useState<AdCreative>({
      ...initialCreative,
      editPlan: initialCreative.editPlan.map(s => ({ ...s, id: s.id || Math.random().toString(36).substr(2, 9) }))
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
    };
  }, [outputUrl]);

  const handleRenderVideo = async () => {
    setIsProcessing(true);
    setError(null);
    setLogs([]);
    setProgress(0);
    setProgressMessage('Initializing Master Render Pipeline...');

    try {
      const outputBlob = await processVideoWithCreative(
        sourceVideos,
        adCreative,
        (p) => {
          setProgress(p.progress * 100);
          setProgressMessage(p.message);
        },
        (log) => setLogs(prev => [...prev, log].slice(-100))
      );
      const url = URL.createObjectURL(outputBlob);
      setOutputUrl(url);
    } catch (err) {
       setError(formatErrorMessage(err));
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
    }
  };
  
  const handleDownload = () => {
    if (!outputUrl) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = `Conversion_Master_${adCreative.variationTitle.replace(/\s+/g, '_')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const removeScene = (id: string) => {
      setAdCreative(prev => ({
          ...prev,
          editPlan: prev.editPlan.filter(s => s.id !== id)
      }));
  };

  const moveScene = (index: number, direction: 'up' | 'down') => {
      const newPlan = [...adCreative.editPlan];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newPlan.length) return;
      [newPlan[index], newPlan[targetIndex]] = [newPlan[targetIndex], newPlan[index]];
      setAdCreative(prev => ({ ...prev, editPlan: newPlan }));
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[110] p-6 backdrop-blur-2xl animate-fade-in">
      <div className="bg-gray-900 rounded-[3rem] shadow-2xl w-full max-w-[95vw] h-[92vh] flex flex-col border border-white/5 overflow-hidden">
        <header className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                <WandIcon className="w-6 h-6 text-indigo-400"/>
            </div>
            <div>
                <h2 className="text-2xl font-black text-white italic tracking-tighter">Conversion Mastering Station</h2>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1">Direct-Response Ad Factory v3.2 PRO</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Est. Completion</span>
                <span className="text-sm font-mono text-white">~45 seconds</span>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-white text-4xl font-light transition-colors">&times;</button>
          </div>
        </header>

        <div className="flex-grow p-8 overflow-hidden grid md:grid-cols-12 gap-8">
          {/* Left Panel: Neural Instruction Stack */}
          <div className="md:col-span-4 flex flex-col gap-6 overflow-hidden">
             <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 flex flex-col h-full bg-black/40 overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">{adCreative.variationTitle}</h3>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Neural Sequence Architect</p>
                    </div>
                    <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                        <SparklesIcon className="w-3 h-3 text-indigo-400" />
                        <span className="text-[9px] font-black text-indigo-400 uppercase">ROI_LINKED</span>
                    </div>
                </div>

                <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    {adCreative.editPlan.map((scene, i) => (
                        <div key={scene.id} className="group relative bg-white/[0.02] hover:bg-white/[0.04] p-5 rounded-3xl border border-white/[0.05] transition-all border-l-4 border-l-indigo-500/20 hover:border-l-indigo-500">
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 z-20">
                                <button onClick={() => moveScene(i, 'up')} className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-indigo-500 transition-colors shadow-lg">↑</button>
                                <button onClick={() => moveScene(i, 'down')} className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-indigo-500 transition-colors shadow-lg">↓</button>
                                <button onClick={() => removeScene(scene.id)} className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-500 transition-colors shadow-lg mt-1">&times;</button>
                            </div>
                            
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                        {scene.timestamp}
                                    </span>
                                    {scene.phase && <PhaseBadge phase={scene.phase as AdPhase} />}
                                </div>
                                <span className="text-[8px] font-black text-gray-700 uppercase truncate max-w-[80px]">{scene.sourceFile}</span>
                            </div>
                            <p className="text-[11px] font-bold text-gray-300 leading-tight mb-3 italic">"{scene.visual}"</p>
                            
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FilmIcon className="w-3 h-3 text-gray-600" />
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">{scene.edit}</span>
                                </div>
                                {scene.overlayText && scene.overlayText !== 'N/A' && (
                                     <div className="px-2 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20 text-[8px] font-black text-indigo-400 uppercase">Text_Overlay</div>
                                )}
                            </div>
                        </div>
                    ))}
                    {adCreative.editPlan.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                            <RefreshIcon className="w-12 h-12 mb-4 animate-spin-slow" />
                            <p className="text-[10px] font-black uppercase">Awaiting Segments</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
                    {!outputUrl && !isProcessing && (
                        <button 
                            onClick={handleRenderVideo} 
                            disabled={adCreative.editPlan.length === 0}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-5 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-2xl shadow-indigo-500/40 border border-white/10 uppercase tracking-[0.2em] text-xs"
                        >
                            <WandIcon className="w-5 h-5" />
                            INITIALIZE AD MASTER
                        </button>
                    )}
                    {isProcessing && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">{progressMessage}</span>
                                <span className="text-[10px] font-mono text-gray-500 font-bold">{progress.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-white/5 shadow-inner">
                                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
             </div>
          </div>

          {/* Right Panel: Mastering Canvas & Performance Logic */}
          <div className="md:col-span-8 flex flex-col gap-8 overflow-hidden">
              <div className="glass-panel rounded-[3rem] p-4 bg-black/60 border-white/5 overflow-hidden flex flex-col aspect-video relative group shadow-2xl ring-1 ring-white/5">
                 {outputUrl ? (
                    <VideoPlayer src={outputUrl} />
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-8 bg-gradient-to-b from-transparent to-black/40">
                        <div className="relative">
                             <div className={`w-28 h-28 bg-white/5 rounded-full flex items-center justify-center border border-white/10 transition-transform duration-700 ${isProcessing ? 'scale-110' : ''}`}>
                                <FilmIcon className={`w-12 h-12 text-gray-700 transition-colors ${isProcessing ? 'text-indigo-400' : ''}`} />
                             </div>
                             {isProcessing && <div className="absolute -inset-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>}
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm font-black text-white uppercase tracking-[0.4em]">
                                {isProcessing ? 'PROCESSING_NEURAL_LAYERS' : 'AWAITING_MASTERING_SIGNAL'}
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <div className="flex items-center gap-1.5 opacity-40">
                                    <ShieldIcon className="w-3 h-3" />
                                    <span className="text-[8px] font-black uppercase">UAE_SECURE</span>
                                </div>
                                <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
                                <div className="flex items-center gap-1.5 opacity-40">
                                    <SlidersIcon className="w-3 h-3" />
                                    <span className="text-[8px] font-black uppercase">1080P_BITRATE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                 )}
                 
                 {/* Direct Response Logic Overlays */}
                 {!isProcessing && !outputUrl && (
                    <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                        <div className="glass-panel p-6 rounded-3xl border-indigo-500/20 max-w-xs space-y-4 shadow-2xl">
                             <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <SparklesIcon className="w-3.5 h-3.5" />
                                Conversion Framework: {adCreative.framework}
                             </h4>
                             <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic">"AI predicts high RAS engagement for this sequence due to the fast-cut hook and social proof density."</p>
                        </div>
                        <div className="bg-black/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex items-center gap-6 shadow-2xl">
                             <div className="text-center">
                                <span className="text-[9px] font-black text-gray-500 uppercase block mb-1">Attention</span>
                                <span className="text-xl font-black text-white italic">{(adCreative.__hookScore || 8) * 10}%</span>
                             </div>
                             <div className="w-px h-8 bg-white/5"></div>
                             <div className="text-center">
                                <span className="text-[9px] font-black text-gray-500 uppercase block mb-1">CTR Est.</span>
                                <span className="text-xl font-black text-indigo-400 italic">{adCreative.__roasPrediction?.toFixed(1) || '3.5'}x</span>
                             </div>
                        </div>
                    </div>
                 )}
              </div>

              <div className="flex-grow glass-panel rounded-[3rem] p-10 border-white/5 bg-gradient-to-br from-indigo-500/[0.03] to-transparent overflow-hidden flex flex-col shadow-2xl">
                 <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <ShieldIcon className="w-3.5 h-3.5" />
                        FFMPEG SYSTEM TELEMETRY
                    </h4>
                    {outputUrl && (
                         <div className="flex items-center gap-2 text-green-400 text-[10px] font-black uppercase tracking-widest bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            AD MASTER READY
                         </div>
                    )}
                 </div>

                 {outputUrl ? (
                    <div className="flex-grow flex flex-col items-center justify-center space-y-10 animate-fade-in">
                        <div className="text-center space-y-4">
                            <h5 className="text-4xl font-black text-white italic tracking-tighter">Direct Response Master Finalized</h5>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-[0.2em] max-w-lg mx-auto">Neural layers synthesized into H.264 High Profile container. Optimized for Meta Reels & TikTok delivery.</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 text-white font-black py-5 px-16 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-2xl shadow-green-500/40 border border-white/10 uppercase tracking-[0.2em] text-xs">
                                <DownloadIcon className="w-6 h-6"/>
                                EXPORT TO META ADS
                            </button>
                            <button onClick={() => setOutputUrl(null)} className="bg-white/5 hover:bg-white/10 text-white font-black py-5 px-12 rounded-2xl flex items-center justify-center gap-4 transition-all border border-white/10 uppercase tracking-[0.2em] text-xs">
                                <RefreshIcon className="w-5 h-5"/>
                                REMIX SEQUENCE
                            </button>
                        </div>
                    </div>
                 ) : (
                    <div className="flex-grow bg-black/60 rounded-[2.5rem] p-10 font-mono text-[11px] text-gray-500 overflow-y-auto custom-scrollbar border border-white/5 shadow-inner">
                        {logs.length > 0 ? (
                            logs.map((log, i) => (
                                <div key={i} className="mb-2 leading-relaxed flex gap-4">
                                    <span className="text-indigo-500/40 opacity-50">[{new Date().toLocaleTimeString()}]</span>
                                    <span className={log.includes('Rendering') ? 'text-indigo-300' : ''}>{log}</span>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex items-center justify-center italic opacity-30 text-center flex-col gap-6">
                                <RefreshIcon className="w-12 h-12 animate-spin-slow text-gray-600" />
                                <div className="space-y-2">
                                    <p className="text-xs font-black uppercase tracking-[0.4em]">Handshaking with Wasm Kernel...</p>
                                    <p className="text-[10px] font-bold">READY_FOR_SYNTHESIS_DIRECTIVE</p>
                                </div>
                            </div>
                        )}
                        <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })}></div>
                    </div>
                 )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
