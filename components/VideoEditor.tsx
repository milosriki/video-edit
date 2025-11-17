

import React, { useState, useRef, useEffect } from 'react';
import { AdCreative } from '../types';
import { processVideoWithCreative } from '../services/videoProcessor';
import { DownloadIcon, FilmIcon, WandIcon } from './icons';
import { formatErrorMessage } from '../utils/error';

interface VideoEditorProps {
  adCreative: AdCreative;
  sourceVideos: File[]; // MODIFIED: Now accepts multiple source videos for remixing
  onClose: () => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ adCreative, sourceVideos, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Revoke the object URL when the component unmounts
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
        sourceVideos, // MODIFIED: Pass all source videos
        adCreative,
        (p) => {
          setProgress(p.progress * 100);
          setProgressMessage(p.message);
        },
        (log) => setLogs(prev => [...prev, log].slice(-100)) // Keep last 100 logs
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
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700/50">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
            <WandIcon className="w-6 h-6"/>
            AI Video Creation Dashboard
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </header>

        <div className="flex-grow p-6 overflow-y-auto grid md:grid-cols-2 gap-6">
          {/* Left Panel: Edit Plan & Controls */}
          <div className="flex flex-col gap-4">
             <div>
                <h3 className="text-lg font-semibold">{adCreative.variationTitle}</h3>
                <p className="text-sm text-gray-400">Blueprint for: "{adCreative.primarySourceFileName}"</p>
            </div>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 flex-grow">
                <h4 className="text-base font-bold text-gray-300 mb-3 flex items-center gap-2">
                    <FilmIcon className="w-5 h-5 text-indigo-400"/>
                    Remixing Blueprint
                </h4>
                <div className="space-y-3 text-xs max-h-60 overflow-y-auto pr-2">
                    {adCreative.editPlan.map((scene, sceneIndex) => (
                        <div key={sceneIndex} className="flex gap-3">
                            <div className="font-mono text-indigo-400 whitespace-nowrap pt-px">{scene.timestamp}</div>
                            <div className="border-l-2 border-gray-700 pl-3">
                                <p><strong className="text-gray-400">Source:</strong> {scene.sourceFile}</p>
                                <p><strong className="text-gray-400">Visual:</strong> {scene.visual}</p>
                                <p><strong className="text-gray-400">Edit:</strong> {scene.edit}</p>
                                {scene.overlayText !== 'N/A' && <p><strong className="text-gray-400">Text:</strong> "{scene.overlayText}"</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {!isProcessing && !outputUrl && (
              <button onClick={handleRenderVideo} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all text-lg">
                  Render Video
              </button>
            )}
             {isProcessing && (
                <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                    <p className="font-semibold text-indigo-400">{progressMessage || 'Processing...'}</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                        <div className="bg-indigo-500 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                     <p className="text-xs text-gray-500 mt-2">Video processing happens entirely in your browser. This can take several minutes for longer videos.</p>
                </div>
             )}
          </div>

          {/* Right Panel: Preview & Logs */}
          <div className="bg-gray-900/50 rounded-lg p-4 flex flex-col justify-center items-center">
              {error && <p className="text-red-400 text-center p-4 bg-red-900/30 rounded-lg">{error}</p>}
              
              {outputUrl && !error && (
                <div className="w-full">
                    <video ref={videoRef} src={outputUrl} controls className="w-full rounded-md aspect-video mb-4"></video>
                    <button onClick={handleDownload} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all">
                        <DownloadIcon className="w-5 h-5"/>
                        Download Video
                    </button>
                </div>
              )}

              {!outputUrl && !error && !isProcessing && (
                <div className="text-center text-gray-400">
                    <p>Click "Render Video" to start the AI-powered editing process.</p>
                </div>
              )}
             
             {isProcessing && (
                <div className="w-full h-48 bg-black rounded-md p-2 mt-4 overflow-y-scroll font-mono text-xs text-gray-500">
                   {logs.length > 0 ? logs.map((log, i) => <p key={i} className="whitespace-pre-wrap leading-tight">{log}</p>) : <p>Waiting for FFmpeg logs...</p>}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;