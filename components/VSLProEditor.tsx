import React, { useState, useRef, useEffect } from 'react';
import { AdvancedEdit } from '../types';
import { processVideoWithAdvancedEdits } from '../services/videoProcessor';
import { DownloadIcon, UploadIcon, FilmIcon, SparklesIcon, ScissorsIcon, SlidersIcon } from './icons';
import { formatErrorMessage } from '../utils/error';
import VideoPlayer from './VideoPlayer';

type VSLSection = 'hook' | 'problem' | 'solution' | 'testimonial' | 'cta' | 'custom';

interface VSLMarker {
  id: string;
  type: VSLSection;
  startTime: string;
  endTime: string;
  label: string;
}

const sectionColors: Record<VSLSection, string> = {
  hook: 'bg-red-500',
  problem: 'bg-orange-500',
  solution: 'bg-green-500',
  testimonial: 'bg-blue-500',
  cta: 'bg-purple-500',
  custom: 'bg-gray-500',
};

const sectionLabels: Record<VSLSection, string> = {
  hook: '🎣 Hook',
  problem: '😰 Problem',
  solution: '✨ Solution',
  testimonial: '👤 Testimonial',
  cta: '🚀 CTA',
  custom: '📌 Custom',
};

const VSLProEditor: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [edits, setEdits] = useState<AdvancedEdit[]>([]);
  const [vslMarkers, setVslMarkers] = useState<VSLMarker[]>([]);
  const [activeEditPanel, setActiveEditPanel] = useState<'quick' | 'advanced' | 'markers'>('quick');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [videoUrl, outputUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      setOutputUrl(null);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setError(null);
      setEdits([]);
      setVslMarkers([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      setOutputUrl(null);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setError(null);
      setEdits([]);
      setVslMarkers([]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const addQuickEdit = (type: 'trim' | 'text' | 'speed' | 'filter' | 'fade' | 'crop') => {
    const id = Date.now().toString();
    let newEdit: AdvancedEdit;
    
    switch (type) {
      case 'trim':
        newEdit = { id, type: 'trim', start: '0.00', end: '30.00' };
        setEdits(prev => [newEdit, ...prev.filter(e => e.type !== 'trim')]);
        return;
      case 'text':
        newEdit = { id, type: 'text', text: 'Your Text Here', start: '0.00', end: '5.00', position: 'bottom', fontSize: 48 };
        break;
      case 'speed':
        newEdit = { id, type: 'speed', factor: 1.0 };
        break;
      case 'filter':
        newEdit = { id, type: 'filter', name: 'grayscale' };
        break;
      case 'fade':
        newEdit = { id, type: 'fade', typeIn: true, typeOut: true, duration: 1.0 };
        break;
      case 'crop':
        newEdit = { id, type: 'crop', ratio: '9:16' };
        break;
      default:
        return;
    }
    setEdits(prev => [...prev, newEdit]);
  };

  const addVSLMarker = (type: VSLSection) => {
    const id = Date.now().toString();
    const newMarker: VSLMarker = {
      id,
      type,
      startTime: '0.00',
      endTime: '5.00',
      label: sectionLabels[type],
    };
    setVslMarkers(prev => [...prev, newMarker]);
  };

  const updateMarker = (id: string, updates: Partial<VSLMarker>) => {
    setVslMarkers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeMarker = (id: string) => {
    setVslMarkers(prev => prev.filter(m => m.id !== id));
  };

  const updateEdit = (id: string, newValues: Partial<AdvancedEdit>) => {
    setEdits(prev => prev.map(e => e.id === id ? { ...e, ...newValues } : e));
  };

  const removeEdit = (id: string) => {
    setEdits(prev => prev.filter(e => e.id !== id));
  };

  const handleRenderVideo = async () => {
    if (!videoFile) {
      setError('Please upload a video first.');
      return;
    }

    const trimEdit = edits.find(e => e.type === 'trim');
    if (trimEdit) {
      const start = parseFloat((trimEdit as Extract<AdvancedEdit, { type: 'trim' }>).start);
      const end = parseFloat((trimEdit as Extract<AdvancedEdit, { type: 'trim' }>).end);
      if (isNaN(start) || isNaN(end) || start < 0 || end <= 0) {
        setError("Trim 'start' and 'end' times must be valid, positive numbers.");
        return;
      }
      if (start >= end) {
        setError("Trim 'start' time must be less than 'end' time.");
        return;
      }
    }

    setIsProcessing(true);
    setError(null);
    setLogs([]);
    setProgress(0);
    setProgressMessage('Initializing...');
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputUrl(null);

    try {
      const outputBlob = await processVideoWithAdvancedEdits(
        videoFile,
        edits,
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
    if (!outputUrl || !videoFile) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = `VSL_Pro_${videoFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderEditControl = (edit: AdvancedEdit) => {
    switch (edit.type) {
      case 'trim':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400">Start (s)</label>
              <input type="text" value={edit.start} onChange={e => updateEdit(edit.id, { start: e.target.value })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-400">End (s)</label>
              <input type="text" value={edit.end} onChange={e => updateEdit(edit.id, { end: e.target.value })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full" />
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="space-y-2">
            <input type="text" value={edit.text} onChange={e => updateEdit(edit.id, { text: e.target.value })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full" placeholder="Text" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" value={edit.start} onChange={e => updateEdit(edit.id, { start: e.target.value })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm" placeholder="Start (s)" />
              <input type="text" value={edit.end} onChange={e => updateEdit(edit.id, { end: e.target.value })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm" placeholder="End (s)" />
            </div>
            <select value={edit.position} onChange={e => updateEdit(edit.id, { position: e.target.value as 'top' | 'center' | 'bottom' })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full">
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        );
      case 'speed':
        return (
          <div className="flex items-center gap-2">
            <input 
              type="range" 
              min="0.25" 
              max="4" 
              step="0.25" 
              value={edit.factor} 
              onChange={e => updateEdit(edit.id, { factor: parseFloat(e.target.value) })} 
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              aria-label="Speed factor"
              aria-valuemin={0.25}
              aria-valuemax={4}
              aria-valuenow={edit.factor}
            />
            <span className="font-mono text-sm w-12">{edit.factor.toFixed(2)}x</span>
          </div>
        );
      case 'filter':
        return (
          <select value={edit.name} onChange={e => updateEdit(edit.id, { name: e.target.value as 'grayscale' | 'sepia' | 'negate' | 'vignette' })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full">
            <option value="grayscale">Grayscale</option>
            <option value="sepia">Sepia</option>
            <option value="negate">Negate</option>
            <option value="vignette">Vignette</option>
          </select>
        );
      case 'fade':
        return (
          <div className="space-y-2">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input 
                  type="checkbox" 
                  checked={edit.typeIn} 
                  onChange={e => updateEdit(edit.id, { typeIn: e.target.checked })} 
                  className="rounded bg-gray-700 border-gray-600 text-indigo-600"
                  aria-label="Enable fade in effect"
                />
                Fade In
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input 
                  type="checkbox" 
                  checked={edit.typeOut} 
                  onChange={e => updateEdit(edit.id, { typeOut: e.target.checked })} 
                  className="rounded bg-gray-700 border-gray-600 text-indigo-600"
                  aria-label="Enable fade out effect"
                />
                Fade Out
              </label>
            </div>
            <div>
              <label className="text-xs text-gray-400 flex justify-between"><span>Duration</span><span>{edit.duration.toFixed(1)}s</span></label>
              <input type="range" min="0.5" max="5" step="0.5" value={edit.duration} onChange={e => updateEdit(edit.id, { duration: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" aria-label="Fade duration" />
            </div>
          </div>
        );
      case 'crop':
        return (
          <select value={edit.ratio} onChange={e => updateEdit(edit.id, { ratio: e.target.value as '16:9' | '9:16' | '1:1' | '4:5' })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full">
            <option value="16:9">16:9 (Landscape - YouTube)</option>
            <option value="9:16">9:16 (Vertical - Reels/TikTok)</option>
            <option value="1:1">1:1 (Square - Feed)</option>
            <option value="4:5">4:5 (Portrait)</option>
          </select>
        );
      default:
        return null;
    }
  };

  if (!videoFile) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">VSL Pro Editor</h2>
          <p className="text-gray-400">Professional Video Sales Letter editing - direct and simple</p>
        </div>
        
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="bg-gray-900/50 p-12 rounded-lg border-2 border-dashed border-gray-700 hover:border-indigo-500 transition-colors text-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <FilmIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Drop your VSL here</h3>
          <p className="text-gray-400 mb-4">or click to browse</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/*"
            className="hidden"
          />
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 mx-auto transition-all">
            <UploadIcon className="w-5 h-5" />
            Select Video
          </button>
        </div>

        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-indigo-400" />
            What you can do with VSL Pro Editor
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <ScissorsIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Trim & Cut</p>
                <p className="text-gray-400">Remove intros, outros, or unwanted sections</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <SlidersIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Speed Control</p>
                <p className="text-gray-400">Speed up or slow down sections</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">📝</span>
              <div>
                <p className="font-semibold">Text Overlays</p>
                <p className="text-gray-400">Add captions, CTAs, and headlines</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">🎨</span>
              <div>
                <p className="font-semibold">Filters & Effects</p>
                <p className="text-gray-400">Apply professional color filters</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">📐</span>
              <div>
                <p className="font-semibold">Crop for Platforms</p>
                <p className="text-gray-400">Resize for Reels, TikTok, YouTube</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">🎬</span>
              <div>
                <p className="font-semibold">Fade In/Out</p>
                <p className="text-gray-400">Professional transitions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FilmIcon className="w-6 h-6 text-indigo-400" />
            VSL Pro Editor
          </h2>
          <p className="text-sm text-gray-400 mt-1">Editing: {videoFile.name}</p>
        </div>
        <button
          onClick={() => {
            setVideoFile(null);
            if (videoUrl) URL.revokeObjectURL(videoUrl);
            if (outputUrl) URL.revokeObjectURL(outputUrl);
            setVideoUrl(null);
            setOutputUrl(null);
            setEdits([]);
            setVslMarkers([]);
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← Back to Upload
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xl hover:text-white">&times;</button>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Panel - Editing Tools */}
        <div className="lg:col-span-4 space-y-4">
          {/* Tab Buttons */}
          <div className="flex gap-2 p-1 bg-gray-900/50 rounded-lg border border-gray-700">
            <button
              onClick={() => setActiveEditPanel('quick')}
              className={`flex-1 p-2 rounded-md font-semibold text-sm ${activeEditPanel === 'quick' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
            >
              Quick Edits
            </button>
            <button
              onClick={() => setActiveEditPanel('markers')}
              className={`flex-1 p-2 rounded-md font-semibold text-sm ${activeEditPanel === 'markers' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
            >
              VSL Markers
            </button>
          </div>

          {/* Quick Edits Panel */}
          {activeEditPanel === 'quick' && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-300">Add Edit Operations</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => addQuickEdit('trim')} className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm font-medium flex items-center gap-2 justify-center">
                  <ScissorsIcon className="w-4 h-4" /> Trim
                </button>
                <button onClick={() => addQuickEdit('text')} className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm font-medium">📝 Text</button>
                <button onClick={() => addQuickEdit('speed')} className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm font-medium">⚡ Speed</button>
                <button onClick={() => addQuickEdit('filter')} className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm font-medium">🎨 Filter</button>
                <button onClick={() => addQuickEdit('fade')} className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm font-medium">🎬 Fade</button>
                <button onClick={() => addQuickEdit('crop')} className="bg-gray-700 hover:bg-gray-600 p-2 rounded text-sm font-medium">📐 Crop</button>
              </div>

              {/* Active Edits */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {edits.length === 0 && (
                  <p className="text-center text-gray-500 py-4 text-sm">Click an edit type above to get started</p>
                )}
                {edits.map(edit => (
                  <div key={edit.id} className="bg-gray-900/50 p-3 rounded border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-indigo-400 capitalize text-sm">{edit.type}</span>
                      <button onClick={() => removeEdit(edit.id)} className="text-red-400 hover:text-red-300 text-lg">&times;</button>
                    </div>
                    {renderEditControl(edit)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VSL Markers Panel */}
          {activeEditPanel === 'markers' && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-4">
              <h3 className="font-semibold text-gray-300">VSL Section Markers</h3>
              <p className="text-xs text-gray-400">Mark different sections of your VSL for organization and future editing.</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(sectionLabels) as VSLSection[]).map(section => (
                  <button
                    key={section}
                    onClick={() => addVSLMarker(section)}
                    className={`${sectionColors[section]} bg-opacity-30 hover:bg-opacity-50 p-2 rounded text-sm font-medium text-white`}
                  >
                    {sectionLabels[section]}
                  </button>
                ))}
              </div>

              {/* Active Markers */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {vslMarkers.length === 0 && (
                  <p className="text-center text-gray-500 py-4 text-sm">Add markers to organize your VSL sections</p>
                )}
                {vslMarkers.map(marker => (
                  <div key={marker.id} className={`${sectionColors[marker.type]} bg-opacity-20 p-3 rounded border border-gray-700`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm">{marker.label}</span>
                      <button onClick={() => removeMarker(marker.id)} className="text-red-400 hover:text-red-300">&times;</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={marker.startTime}
                        onChange={e => updateMarker(marker.id, { startTime: e.target.value })}
                        className="bg-gray-900 border border-gray-600 rounded p-1 text-xs"
                        placeholder="Start (s)"
                      />
                      <input
                        type="text"
                        value={marker.endTime}
                        onChange={e => updateMarker(marker.id, { endTime: e.target.value })}
                        className="bg-gray-900 border border-gray-600 rounded p-1 text-xs"
                        placeholder="End (s)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render Button */}
          <button
            onClick={handleRenderVideo}
            disabled={isProcessing || edits.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all text-lg"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Render Video
              </>
            )}
          </button>
        </div>

        {/* Right Panel - Video Preview */}
        <div className="lg:col-span-8 space-y-4">
          {/* Source Video */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h4 className="font-semibold text-gray-300 mb-3">Source Video</h4>
            {videoUrl && <VideoPlayer src={videoUrl} />}
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <p className="font-semibold text-indigo-400 mb-2">{progressMessage}</p>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-indigo-500 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Processing can take several minutes for longer videos.</p>
              {logs.length > 0 && (
                <div className="mt-4 max-h-32 overflow-y-auto bg-black rounded p-2">
                  {logs.slice(-10).map((log, i) => (
                    <p key={i} className="text-xs text-gray-500 font-mono">{log}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Output Video */}
          {outputUrl && !isProcessing && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-green-500/50">
              <h4 className="font-semibold text-green-400 mb-3">✅ Rendered Output</h4>
              <video src={outputUrl} controls className="w-full rounded-md aspect-video mb-4"></video>
              <button
                onClick={handleDownload}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <DownloadIcon className="w-5 h-5" />
                Download Edited VSL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VSLProEditor;
