import React, { useState, useRef, useEffect } from 'react';
import { AdvancedEdit } from '../types';
import { processVideoWithAdvancedEdits } from '../services/videoProcessor';
import { DownloadIcon, SlidersIcon } from './icons';
import { formatErrorMessage } from '../utils/error';
import VideoPlayer from './VideoPlayer';

interface AdvancedEditorProps {
  sourceVideo: File;
  onClose: () => void;
}

const AdvancedEditor: React.FC<AdvancedEditorProps> = ({ sourceVideo, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [edits, setEdits] = useState<AdvancedEdit[]>([]);
  const sourceVideoUrl = useRef(URL.createObjectURL(sourceVideo));

  useEffect(() => {
    return () => {
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      URL.revokeObjectURL(sourceVideoUrl.current);
    };
  }, [outputUrl]);

  // FIX: Refactored to use uniquely named, typed variables in each case 
  // to help TypeScript resolve the discriminated union type for the setEdits updater.
  const addEdit = (type: AdvancedEdit['type']) => {
    // FIX: Explicitly typing the return value of the callback to `AdvancedEdit[]`
    // resolves a complex type inference issue with the discriminated union.
    setEdits((prev): AdvancedEdit[] => {
        const id = Date.now().toString();
        switch (type) {
            case 'trim': {
                const newTrimEdit: AdvancedEdit = { id, type: 'trim', start: '0.00', end: '5.00' };
                return [newTrimEdit, ...prev.filter((e) => e.type !== 'trim')];
            }
            case 'text': {
                const newTextEdit: AdvancedEdit = { id, type: 'text', text: 'Hello World', start: '0.00', end: '3.00', position: 'center', fontSize: 48 };
                return [...prev, newTextEdit];
            }
            case 'image': {
                const placeholderFile = new File([], 'placeholder.png', { type: 'image/png' });
                const newImageEdit: AdvancedEdit = { id, type: 'image', file: placeholderFile, position: 'top_right', scale: 0.2, opacity: 1.0 };
                return [...prev, newImageEdit];
            }
            case 'speed': {
                const newSpeedEdit: AdvancedEdit = { id, type: 'speed', factor: 2.0 };
                return [...prev, newSpeedEdit];
            }
            case 'filter': {
                const newFilterEdit: AdvancedEdit = { id, type: 'filter', name: 'grayscale' };
                return [...prev, newFilterEdit];
            }
            case 'color': {
                const newColorEdit: AdvancedEdit = { id, type: 'color', brightness: 0, contrast: 1, saturation: 1 };
                return [...prev, newColorEdit];
            }
            case 'volume': {
                const newVolumeEdit: AdvancedEdit = { id, type: 'volume', level: 1.0 };
                return [...prev, newVolumeEdit];
            }
            case 'fade': {
                const newFadeEdit: AdvancedEdit = { id, type: 'fade', typeIn: true, typeOut: true, duration: 1.0 };
                return [...prev, newFadeEdit];
            }
            case 'crop': {
                const newCropEdit: AdvancedEdit = { id, type: 'crop', ratio: '9:16' };
                return [...prev, newCropEdit];
            }
            case 'subtitles': {
                const newSubtitlesEdit: AdvancedEdit = { id, type: 'subtitles', text: 'Sample Subtitle Text' };
                return [...prev, newSubtitlesEdit];
            }
            case 'mute': {
                 const newMuteEdit: AdvancedEdit = { id, type: 'mute' };
                 return [...prev, newMuteEdit];
            }
            default:
                return prev;
        }
    });
  };

  const updateEdit = (id: string, newValues: Partial<AdvancedEdit>) => {
    setEdits(prev => prev.map(e => e.id === id ? { ...e, ...newValues } : e));
  };
  
  const removeEdit = (id: string) => {
    setEdits(prev => prev.filter(e => e.id !== id));
  };

  const handleRenderVideo = async () => {
    setError(null);

    const trimEdit = edits.find(e => e.type === 'trim');
    if (trimEdit && trimEdit.type === 'trim') {
        const start = parseFloat(trimEdit.start);
        const end = parseFloat(trimEdit.end);
        if (isNaN(start) || isNaN(end) || start < 0 || end <= 0) {
            setError("Trim 'start' and 'end' times must be valid, positive numbers.");
            return;
        }
        if (start >= end) {
            setError("Trim 'start' time must be less than 'end' time.");
            return;
        }
    }
    
    const imageEdits = edits.filter(e => e.type === 'image') as Extract<AdvancedEdit, { type: 'image' }>[];
    if (imageEdits.some(edit => edit.file.size === 0)) {
        setError("Please select an image file for all 'Image Overlay' edits before rendering.");
        return;
    }

    setIsProcessing(true);
    setLogs([]);
    setProgress(0);
    setProgressMessage('Initializing...');
    if(outputUrl) URL.revokeObjectURL(outputUrl);
    setOutputUrl(null);

    try {
      const outputBlob = await processVideoWithAdvancedEdits(
        sourceVideo,
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
    if (!outputUrl) return;
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = `Advanced_Edit_${sourceVideo.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const [aiPrompt, setAiPrompt] = useState('');

  const handleAICommand = () => {
      const prompt = aiPrompt.toLowerCase();
      if (prompt.includes('faster') || prompt.includes('speed up')) {
          addEdit('speed');
          // We'd ideally update the specific instance, but for now we just add the tool
      } else if (prompt.includes('slow') || prompt.includes('slo-mo')) {
          addEdit('speed'); // User can adjust to < 1
      } else if (prompt.includes('mute') || prompt.includes('silent')) {
          addEdit('mute');
      } else if (prompt.includes('black and white') || prompt.includes('grayscale')) {
          addEdit('filter');
      } else if (prompt.includes('vertical') || prompt.includes('reel') || prompt.includes('tiktok')) {
          addEdit('crop');
      } else if (prompt.includes('caption') || prompt.includes('subtitle')) {
          addEdit('subtitles');
      } else {
          alert("I didn't understand that command yet. Try 'make it faster', 'vertical', or 'add captions'.");
      }
      setAiPrompt('');
  };

  const renderEditControl = (edit: AdvancedEdit) => {
    switch (edit.type) {
      case 'trim': return (
        <div className="grid grid-cols-2 gap-2">
            <input type="text" value={edit.start} onChange={e => updateEdit(edit.id, { start: e.target.value })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full" placeholder="Start (s)"/>
            <input type="text" value={edit.end} onChange={e => updateEdit(edit.id, { end: e.target.value })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full" placeholder="End (s)"/>
        </div>
      );
      case 'text': return (
        <div className="space-y-2">
            <input type="text" value={edit.text} onChange={e => updateEdit(edit.id, { text: e.target.value })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full" placeholder="Overlay Text"/>
            <div className="grid grid-cols-2 gap-2">
                 <input type="text" value={edit.start} onChange={e => updateEdit(edit.id, { start: e.target.value })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm" placeholder="Start (s)"/>
                 <input type="text" value={edit.end} onChange={e => updateEdit(edit.id, { end: e.target.value })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm" placeholder="End (s)"/>
            </div>
            <select value={edit.position} onChange={e => updateEdit(edit.id, { position: e.target.value as 'top' | 'center' | 'bottom' })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full">
                <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option>
            </select>
        </div>
      );
      case 'image': return (
         <div className="space-y-2">
            <input type="file" accept="image/*" onChange={e => e.target.files && updateEdit(edit.id, { file: e.target.files[0] })} className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"/>
            <select value={edit.position} onChange={e => updateEdit(edit.id, { position: e.target.value as 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full">
                <option value="top_left">Top Left</option><option value="top_right">Top Right</option><option value="bottom_left">Bottom Left</option><option value="bottom_right">Bottom Right</option>
            </select>
             <label className="text-xs text-gray-400">Scale: {edit.scale.toFixed(2)}</label>
            <input type="range" min="0.05" max="1" step="0.05" value={edit.scale} onChange={e => updateEdit(edit.id, { scale: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"/>
            <label className="text-xs text-gray-400">Opacity: {edit.opacity.toFixed(2)}</label>
            <input type="range" min="0.1" max="1" step="0.05" value={edit.opacity} onChange={e => updateEdit(edit.id, { opacity: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"/>
        </div>
      );
      case 'speed': return (
        <div className="flex items-center gap-2">
            <input type="range" min="0.25" max="4" step="0.25" value={edit.factor} onChange={e => updateEdit(edit.id, { factor: parseFloat(e.target.value) })} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"/>
            <span className="font-mono text-sm">{edit.factor.toFixed(2)}x</span>
        </div>
      );
      case 'filter': return (
        <select value={edit.name} onChange={e => updateEdit(edit.id, { name: e.target.value as 'grayscale' | 'sepia' | 'negate' | 'vignette' })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full">
            <option value="grayscale">Grayscale</option><option value="sepia">Sepia</option><option value="negate">Negate</option><option value="vignette">Vignette</option>
        </select>
      );
      case 'color': return (
        <div className="space-y-2">
            <div>
                <label className="text-xs text-gray-400 flex justify-between"><span>Brightness</span><span>{edit.brightness.toFixed(2)}</span></label>
                <input type="range" min="-1" max="1" step="0.1" value={edit.brightness} onChange={e => updateEdit(edit.id, { brightness: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"/>
            </div>
            <div>
                <label className="text-xs text-gray-400 flex justify-between"><span>Contrast</span><span>{edit.contrast.toFixed(2)}</span></label>
                <input type="range" min="-2" max="2" step="0.1" value={edit.contrast} onChange={e => updateEdit(edit.id, { contrast: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"/>
            </div>
            <div>
                <label className="text-xs text-gray-400 flex justify-between"><span>Saturation</span><span>{edit.saturation.toFixed(2)}</span></label>
                <input type="range" min="0" max="3" step="0.1" value={edit.saturation} onChange={e => updateEdit(edit.id, { saturation: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"/>
            </div>
        </div>
      );
      case 'volume': return (
        <div className="space-y-2">
            <label className="text-xs text-gray-400 flex justify-between"><span>Volume Level</span><span>{(edit.level * 100).toFixed(0)}%</span></label>
            <input type="range" min="0" max="2" step="0.1" value={edit.level} onChange={e => updateEdit(edit.id, { level: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"/>
        </div>
      );
      case 'fade': return (
        <div className="space-y-2">
            <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={edit.typeIn} onChange={e => updateEdit(edit.id, { typeIn: e.target.checked })} className="rounded bg-gray-700 border-gray-600 text-indigo-600"/>
                    Fade In
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input type="checkbox" checked={edit.typeOut} onChange={e => updateEdit(edit.id, { typeOut: e.target.checked })} className="rounded bg-gray-700 border-gray-600 text-indigo-600"/>
                    Fade Out
                </label>
            </div>
            <div>
                <label className="text-xs text-gray-400 flex justify-between"><span>Duration (s)</span><span>{edit.duration.toFixed(1)}s</span></label>
                <input type="range" min="0.5" max="5" step="0.5" value={edit.duration} onChange={e => updateEdit(edit.id, { duration: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"/>
            </div>
        </div>
      );
      case 'crop': return (
        <div className="space-y-2">
            <label className="text-xs text-gray-400">Aspect Ratio</label>
            <select value={edit.ratio} onChange={e => updateEdit(edit.id, { ratio: e.target.value as '16:9' | '9:16' | '1:1' | '4:5' })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full">
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Vertical/Reels)</option>
                <option value="1:1">1:1 (Square/Feed)</option>
                <option value="4:5">4:5 (Portrait)</option>
            </select>
        </div>
      );
      case 'subtitles': return (
        <div className="space-y-2">
            <label className="text-xs text-gray-400">Subtitle Text (Simulated)</label>
            <textarea value={edit.text} onChange={e => updateEdit(edit.id, { text: e.target.value })} className="bg-gray-900 border border-gray-600 rounded p-1 text-sm w-full h-20" placeholder="Enter text to burn as subtitles..."/>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-gray-700/50">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-indigo-400 flex items-center gap-2"><SlidersIcon className="w-6 h-6"/>Advanced Video Editor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </header>

        <div className="flex-grow p-6 overflow-hidden grid md:grid-cols-12 gap-6">
          <div className="md:col-span-4 flex flex-col gap-4 overflow-y-auto">
             {/* AI Assistant Input */}
             <div className="bg-indigo-900/30 p-3 rounded-lg border border-indigo-500/30">
                <label className="text-xs font-bold text-indigo-300 mb-1 block">AI Assistant (Beta)</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={aiPrompt} 
                        onChange={e => setAiPrompt(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleAICommand()}
                        placeholder="e.g., 'Make it vertical', 'Add captions'..." 
                        className="bg-gray-900 border border-gray-600 rounded p-2 text-sm w-full text-white placeholder-gray-500"
                    />
                    <button onClick={handleAICommand} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 rounded text-sm">Go</button>
                </div>
             </div>

             <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 flex-grow">
                <h4 className="text-base font-bold text-gray-300 mb-3">Editing Pipeline</h4>
                <div className="space-y-2 text-xs">
                    {edits.length === 0 && <p className="text-center text-gray-500 py-4">Add an edit to get started.</p>}
                    {edits.map(edit => (
                        <div key={edit.id} className="bg-gray-800 p-2 rounded border border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-indigo-400 capitalize">{edit.type}</span>
                                <button onClick={() => removeEdit(edit.id)} className="text-red-400 hover:text-red-300 font-bold text-lg">&times;</button>
                            </div>
                            {renderEditControl(edit)}
                        </div>
                    ))}
                </div>
            </div>
            <div className="relative">
                <select defaultValue="" onChange={e => e.target.value && addEdit(e.target.value as AdvancedEdit['type'])} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg appearance-none text-center cursor-pointer">
                    <option value="" disabled>Add Edit Operation...</option>
                    <option value="trim">Trim</option><option value="text">Text Overlay</option><option value="image">Image Overlay</option>
                    <option value="speed">Speed Change</option><option value="filter">Filter</option>
                    <option value="color">Color Correction</option><option value="volume">Volume Control</option>
                    <option value="fade">Fade In/Out</option><option value="crop">Crop / Resize</option>
                    <option value="subtitles">Add Subtitles</option>
                    <option value="mute">Mute Audio</option>
                </select>
            </div>
            <button onClick={handleRenderVideo} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all text-lg">
                  Render Video
            </button>
          </div>

          <div className="md:col-span-8 bg-gray-900/50 rounded-lg p-4 flex flex-col justify-between items-center">
              <div className="w-full">
                <h4 className="font-bold text-gray-300 mb-2">Source Preview</h4>
                <VideoPlayer src={sourceVideoUrl.current} />
              </div>

              <div className="w-full mt-4">
                 {isProcessing ? (
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                        <p className="font-semibold text-indigo-400">{progressMessage}</p>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2"><div className="bg-indigo-500 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div></div>
                         <p className="text-xs text-gray-500 mt-2">Processing can take several minutes for large videos or complex edits.</p>
                    </div>
                 ) : error ? (
                    <p className="text-red-400 text-center p-4 bg-red-900/30 rounded-lg">{error}</p>
                 ) : outputUrl ? (
                    <div className="w-full">
                        <h4 className="font-bold text-gray-300 my-2">Rendered Output</h4>
                        <video src={outputUrl} controls className="w-full rounded-md aspect-video mb-4"></video>
                        <button onClick={handleDownload} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"><DownloadIcon className="w-5 h-5"/>Download</button>
                    </div>
                 ) : (
                    <div className="text-center text-gray-500 p-4">Rendered video will appear here.</div>
                 )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedEditor;