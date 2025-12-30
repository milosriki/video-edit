
import React, { useState, useRef, useEffect } from 'react';
import { extractAudio, calculateSilenceSegments, processVideoBySegments, calculateKeywordSegments } from '../services/videoProcessor';
import { transcribeAudio } from '../services/geminiService';
import { TranscribedWord } from '../types';
import { DownloadIcon, ScissorsIcon, SoundWaveIcon } from './icons';
import { formatErrorMessage } from '../utils/error';
import VideoPlayer from './VideoPlayer';

interface AudioCutterDashboardProps {
  sourceVideo: File;
  onClose: () => void;
}

type CutMode = 'silence' | 'keywords';

const AudioCutterDashboard: React.FC<AudioCutterDashboardProps> = ({ sourceVideo, onClose }) => {
  const [transcription, setTranscription] = useState<TranscribedWord[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cutMode, setCutMode] = useState<CutMode>('silence');
  const [silenceThreshold, setSilenceThreshold] = useState(1.0);
  const [startWord, setStartWord] = useState('');
  const [endWord, setEndWord] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [outputUrl]);

  const handleTranscribe = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage('Extracting audio from video...');
    try {
      const audioBlob = await extractAudio(sourceVideo, (log) => console.log(log));
      setLoadingMessage('Transcribing audio with AI...');
      const words = await transcribeAudio(audioBlob);
      setTranscription(words);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  }

  const handleProcessVideo = async () => {
    if (!transcription) return;
    setIsProcessing(true);
    setError(null);
    if(outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputUrl(null);
    setProgress(0);
    setLoadingMessage('Calculating edit segments...');
    try {
      let segments: {start: number, end: number}[];
      if (cutMode === 'silence') {
        const videoDuration = await getVideoDuration(sourceVideo);
        segments = calculateSilenceSegments(transcription, silenceThreshold, videoDuration);
      } else {
        segments = calculateKeywordSegments(transcription, startWord, endWord);
      }
      if (segments.length === 0) {
        throw new Error(cutMode === 'silence' ? 'No silent segments found to remove based on the threshold.' : 'No segments found matching the specified keywords.');
      }

      const outputBlob = await processVideoBySegments(
        sourceVideo,
        segments,
        (p) => {
          setProgress(p.progress * 100);
          setLoadingMessage(p.message);
        },
        (log) => console.log(log)
      );
      setOutputUrl(URL.createObjectURL(outputBlob));
    } catch(err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputUrl) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = `SmartCut_${sourceVideo.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-12 flex flex-col justify-center items-center h-full space-y-6">
          <div className="relative">
            <div className="animate-spin h-12 w-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full mx-auto"></div>
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl animate-pulse rounded-full"></div>
          </div>
          <p className="text-lg font-black text-white tracking-tight uppercase tracking-widest">{loadingMessage}</p>
        </div>
      );
    }

    if (!transcription) {
      return (
        <div className="text-center p-12 flex flex-col justify-center items-center h-full max-w-lg mx-auto">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 border border-indigo-500/20">
            <SoundWaveIcon className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Vocal Extraction Required</h3>
          <p className="text-gray-500 text-sm mb-10 leading-relaxed font-bold uppercase tracking-widest">The AI needs to map the transcription timestamps to identify neurological hook points and silent gaps.</p>
          <button onClick={handleTranscribe} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-10 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-indigo-500/30">
            <SoundWaveIcon className="w-5 h-5" />
            INITIALIZE TRANSCRIPTION
          </button>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-8 p-8">
        <div className="flex flex-col gap-6">
          <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Acoustic Inventory</h4>
            <div className="text-[11px] text-gray-400 max-h-32 overflow-y-auto pr-2 custom-scrollbar italic leading-relaxed">
              {transcription.map(w => w.word).join(' ')}
            </div>
          </div>
          
          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-6">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Editing Mode</h4>
            <div className="flex gap-3">
              <button 
                onClick={() => setCutMode('silence')} 
                className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${cutMode === 'silence' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-white/5 text-gray-500 border-white/5 hover:text-gray-300'}`}
              >
                Auto-Trim Silence
              </button>
              <button 
                onClick={() => setCutMode('keywords')} 
                className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${cutMode === 'keywords' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-white/5 text-gray-500 border-white/5 hover:text-gray-300'}`}
              >
                Keyword Snippet
              </button>
            </div>
            
            {cutMode === 'silence' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block px-1">Silence Gap (seconds)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="0.1" 
                  value={silenceThreshold} 
                  onChange={e => setSilenceThreshold(parseFloat(e.target.value))} 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white"
                />
              </div>
            )}
            
            {cutMode === 'keywords' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block px-1">Start Keyword</label>
                  <input 
                    type="text" 
                    value={startWord} 
                    onChange={e => setStartWord(e.target.value)} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white" 
                    placeholder="e.g., 'Welcome'"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block px-1">End Keyword</label>
                  <input 
                    type="text" 
                    value={endWord} 
                    onChange={e => setEndWord(e.target.value)} 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white" 
                    placeholder="e.g., 'Thanks'"
                  />
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleProcessVideo} 
            disabled={isProcessing || (cutMode === 'keywords' && (!startWord || !endWord))} 
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-500/30"
          >
            <ScissorsIcon className="w-5 h-5" />
            EXECUTE SMART CUT
          </button>
        </div>
        
        <div className="bg-black/60 rounded-2xl p-8 flex flex-col justify-center items-center border border-white/5 min-h-[400px]">
          {isProcessing && (
            <div className="text-center w-full space-y-4">
              <p className="text-sm font-black text-indigo-400 uppercase tracking-widest animate-pulse">{loadingMessage || 'Processing...'}</p>
              <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-400 text-center text-sm font-bold">
              {error}
            </div>
          )}
          
          {outputUrl && !error && (
            <div className="w-full space-y-6">
              <VideoPlayer src={outputUrl} />
              <button onClick={handleDownload} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all">
                <DownloadIcon className="w-5 h-5"/>
                DOWNLOAD SMART CLIP
              </button>
            </div>
          )}
          
          {!outputUrl && !error && !isProcessing && (
            <div className="text-center space-y-4 opacity-30">
              <ScissorsIcon className="w-20 h-20 text-gray-400 mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Segment Logic</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-700/50 overflow-hidden">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
          <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
            <ScissorsIcon className="w-6 h-6"/>
            Smart Cutter Dashboard
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl transition-colors">&times;</button>
        </header>
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AudioCutterDashboard;
