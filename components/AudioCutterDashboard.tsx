import React, { useState, useRef, useEffect } from 'react';
import { extractAudio, calculateSilenceSegments, processVideoBySegments, calculateKeywordSegments } from '../services/videoProcessor';
import { transcribeAudio } from '../services/geminiService';
import { TranscribedWord } from '../types';
import { DownloadIcon, ScissorsIcon, SoundWaveIcon } from './icons';
import { formatErrorMessage } from '../utils/error';

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
  const videoRef = useRef<HTMLVideoElement>(null);

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
        <div className="text-center p-8 flex flex-col justify-center items-center h-full">
          <svg className="animate-spin h-8 w-8 text-indigo-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="text-lg font-semibold">{loadingMessage}</p>
        </div>
      );
    }

    if (!transcription) {
      return (
        <div className="text-center p-8 flex flex-col justify-center items-center h-full">
          <h3 className="text-lg font-semibold mb-4">Start by transcribing your video's audio.</h3>
          <p className="text-sm text-gray-400 mb-6">This allows the AI to analyze spoken words and silence for smart editing.</p>
          <button onClick={handleTranscribe} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all text-lg mx-auto transform hover:scale-105">
            <SoundWaveIcon className="w-6 h-6" />
            Transcribe Audio
          </button>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-6 p-6">
        <div className="flex flex-col gap-4">
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h4 className="font-bold mb-3">Transcription Ready</h4>
            <p className="text-xs text-gray-400 max-h-24 overflow-y-auto pr-2">
              {transcription.map(w => w.word).join(' ')}
            </p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
            <h4 className="font-bold mb-3">Editing Mode</h4>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setCutMode('silence')} className={`flex-1 p-2 rounded text-sm font-semibold transition-colors ${cutMode === 'silence' ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>Remove Silence</button>
              <button onClick={() => setCutMode('keywords')} className={`flex-1 p-2 rounded text-sm font-semibold transition-colors ${cutMode === 'keywords' ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>Keep by Keywords</button>
            </div>
            {cutMode === 'silence' && (
              <div>
                <label htmlFor="silence-threshold" className="block text-sm font-medium text-gray-300">Silence Threshold (seconds)</label>
                <input id="silence-threshold" type="number" step="0.1" min="0.1" value={silenceThreshold} onChange={e => setSilenceThreshold(parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-600 rounded p-2 mt-1 text-white"/>
              </div>
            )}
            {cutMode === 'keywords' && (
              <div className="space-y-2">
                <div>
                  <label htmlFor="start-word" className="block text-sm font-medium text-gray-300">Start Word (contains)</label>
                  <input id="start-word" type="text" value={startWord} onChange={e => setStartWord(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 mt-1 text-white" placeholder="e.g., 'Welcome'"/>
                </div>
                <div>
                  <label htmlFor="end-word" className="block text-sm font-medium text-gray-300">End Word (contains)</label>
                  <input id="end-word" type="text" value={endWord} onChange={e => setEndWord(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 mt-1 text-white" placeholder="e.g., 'Thanks'"/>
                </div>
              </div>
            )}
          </div>
          <button onClick={handleProcessVideo} disabled={isProcessing || (cutMode === 'keywords' && (!startWord || !endWord))} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all text-lg transform hover:scale-105">
            <ScissorsIcon className="w-6 h-6" />
            Process Video
          </button>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-4 flex flex-col justify-center items-center min-h-[300px]">
          {isProcessing && (
            <div className="text-center p-4">
              <p className="font-semibold text-indigo-400">{loadingMessage || 'Processing...'}</p>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                <div className="bg-indigo-500 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
          {error && <p className="text-red-400 text-center p-4 bg-red-900/30 rounded-lg">{error}</p>}
          {outputUrl && !error && (
            <div className="w-full">
              <video ref={videoRef} src={outputUrl} controls className="w-full rounded-md aspect-video mb-4"></video>
              <button onClick={handleDownload} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all">
                <DownloadIcon className="w-5 h-5"/>
                Download Edited Video
              </button>
            </div>
          )}
          {!outputUrl && !error && !isProcessing && (
            <div className="text-center text-gray-400">
              <ScissorsIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p>Configure your settings and click "Process Video" to generate the edited version.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-700/50">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
            <ScissorsIcon className="w-6 h-6"/>
            Smart Cutter Dashboard
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </header>
        <div className="flex-grow overflow-y-auto">
          {error && <div className="p-4 bg-red-900/50 text-red-300 text-center" role="alert">{error}</div>}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AudioCutterDashboard;