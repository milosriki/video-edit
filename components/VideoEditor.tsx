
import React, { useState, useRef, useEffect } from 'react';
import { AdCreative } from '../types';
import { processVideoWithCreative } from '../services/videoProcessor';
import { DownloadIcon, FilmIcon, WandIcon } from './icons';
import { formatErrorMessage } from '../utils/error';
import VideoPlayer from './VideoPlayer';

interface VideoEditorProps {
  adCreative: AdCreative;
  sourceVideos: File[]; 
  onClose: () => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ adCreative, sourceVideos, onClose }) => {
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
    setProgressMessage('Initializing FFmpeg...');

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
    a.download = `AI_Ad_${adCreative.variationTitle.replace(/\s+/g, '_')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700/50 overflow-hidden">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
          <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
            <WandIcon className="w-6 h-6"/>
            AI Video Production
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl transition-colors">&times;</button>
        </header>

        <div className="flex-grow p-6 overflow-y-auto grid md:grid-cols-2 gap-6">
          {/* Left Panel: Edit Plan & Controls */}
          <div className="flex flex-col gap-4">
             <div>
                <h3 className="text-lg font-black text-white">{adCreative.variationTitle}</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Blueprint: {adCreative.primarySourceFileName}</p>
            </div>
            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 flex-grow">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FilmIcon className="w-4 h-4"/>
                    Edit Instruction Stack
                </h4>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {adCreative.editPlan.map((scene, sceneIndex) => (
                        <div key={sceneIndex} className="flex gap-3">
                            <div className="font-mono text-[10px] text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded h-fit">
                              {scene.timestamp}
                            </div>
                            <div className="flex-grow">
                                <p className="text-[11px] font-black text-gray-300 uppercase tracking-tighter">{scene.visual}</p>
                                <p className="text-[10px] text-gray-500 italic mt-0.5">{scene.edit}</p>
                                {scene.overlayText && scene.overlayText !== 'N/A' && (
                                  <p className="text-[9px] text-indigo-400 font-black mt-1 uppercase">Overlay: {scene.overlayText}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {!isProcessing && !outputUrl && (
              <button onClick={handleRenderVideo} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/30">
                  <WandIcon className="w-5 h-5" />
                  INITIALIZE RENDER
              </button>
            )}
             {isProcessing && (
                <div className="text-center p-6 bg-black/40 rounded-2xl border border-indigo-500/20">
                    <p className="text-sm font-black text-indigo-400 uppercase tracking-widest animate-pulse">{progressMessage || 'Synthesizing...'}</p>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-4 overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                     <p className="text-[9px] text-gray-600 mt-3 font-medium uppercase tracking-tight">Client-side rendering active. Do not close tab.</p>
                </div>
             )}
          </div>

          {/* Right Panel: Preview & Logs */}
          <div className="bg-black/60 rounded-2xl p-6 flex flex-col justify-center items-center border border-white/5 min-h-[400px]">
              {error && (
                <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-400 text-center text-sm font-bold">
                  {error}
                </div>
              )}
              
              {outputUrl && !error && (
                <div className="w-full space-y-6">
                    <VideoPlayer src={outputUrl} />
                    <button onClick={handleDownload} className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-500/30">
                        <DownloadIcon className="w-5 h-5"/>
                        DOWNLOAD MASTER MP4
                    </button>
                </div>
              )}

              {!outputUrl && !error && !isProcessing && (
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                      <FilmIcon className="w-8 h-8 text-gray-600" />
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Awaiting Render Command</p>
                </div>
              )}
             
             {isProcessing && (
                <div className="w-full h-full min-h-[200px] bg-black/80 rounded-xl p-4 overflow-y-auto font-mono text-[10px] text-gray-600 custom-scrollbar border border-white/5">
                   {logs.length > 0 ? logs.map((log, i) => <p key={i} className="whitespace-pre-wrap leading-tight mb-1">{log}</p>) : <p className="animate-pulse">Awaiting FFmpeg logs...</p>}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
