
import React, { useState, useRef, useEffect } from 'react';
import { AdvancedEdit } from '../types';
import { processVideoWithAdvancedEdits } from '../services/videoProcessor';
import { DownloadIcon, SlidersIcon, WandIcon } from './icons';
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

  const addEdit = (type: AdvancedEdit['type']) => {
    setEdits((prev) => {
      const id = Date.now().toString();
      let newEdit: AdvancedEdit | null = null;

      // Handle individual edit types to ensure correct property initialization
      switch (type) {
        case 'trim':
          newEdit = { id, type: 'trim', start: '0.00', end: '5.00' };
          // Trim is unique (one per video), so we filter existing ones out
          return [newEdit, ...prev.filter((e) => e.type !== 'trim')];
        case 'text':
          newEdit = { id, type: 'text', text: 'Direct Response Hook', start: '0.00', end: '3.00', position: 'center', fontSize: 48 };
          break;
        case 'image':
          const placeholderFile = new File([], 'placeholder.png', { type: 'image/png' });
          newEdit = { id, type: 'image', file: placeholderFile, position: 'top_right', scale: 0.2, opacity: 1.0 };
          break;
        case 'speed':
          newEdit = { id, type: 'speed', factor: 2.0 };
          break;
        case 'filter':
          newEdit = { id, type: 'filter', name: 'grayscale' };
          break;
        case 'mute':
          newEdit = { id, type: 'mute' };
          break;
      }
      
      return newEdit ? [...prev, newEdit] : prev;
    });
  };

  const updateEdit = (id: string, newValues: Partial<AdvancedEdit>) => {
    // Discriminated union update handling
    setEdits(prev => prev.map(e => e.id === id ? ({ ...e, ...newValues } as any) : e));
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
            setError("Invalid trim parameters.");
            return;
        }
        if (start >= end) {
            setError("Start time must precede end time.");
            return;
        }
    }
    
    const imageEdits = edits.filter(e => e.type === 'image') as Extract<AdvancedEdit, { type: 'image' }>[];
    if (imageEdits.some(edit => edit.file.size === 0)) {
        setError("Missing image file in overlay pipeline.");
        return;
    }

    setIsProcessing(true);
    setLogs([]);
    setProgress(0);
    setProgressMessage('Initializing Neural Render...');
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
      setOutputUrl(URL.createObjectURL(outputBlob));
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
    a.download = `Neural_Edit_${sourceVideo.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const renderEditControl = (edit: AdvancedEdit) => {
    switch (edit.type) {
      case 'trim': return (
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-gray-500">In-Point</label>
                <input type="text" value={edit.start} onChange={e => updateEdit(edit.id, { start: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] w-full text-white font-mono" placeholder="0.00"/>
            </div>
            <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-gray-500">Out-Point</label>
                <input type="text" value={edit.end} onChange={e => updateEdit(edit.id, { end: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[11px] w-full text-white font-mono" placeholder="5.00"/>
            </div>
        </div>
      );
      case 'text': return (
        <div className="space-y-3">
            <input type="text" value={edit.text} onChange={e => updateEdit(edit.id, { text: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs w-full text-white font-bold" placeholder="Overlay Copy"/>
            <div className="grid grid-cols-2 gap-3">
                 <input type="text" value={edit.start} onChange={e => updateEdit(edit.id, { start: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] text-white font-mono" placeholder="Start"/>
                 <input type="text" value={edit.end} onChange={e => updateEdit(edit.id, { end: e.target.value })} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] text-white font-mono" placeholder="End"/>
            </div>
            <select value={edit.position} onChange={e => updateEdit(edit.id, { position: e.target.value as any })} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] w-full text-white font-black uppercase">
                <option value="top">Top Third</option><option value="center">Center</option><option value="bottom">Bottom Third</option>
            </select>
        </div>
      );
      case 'image': return (
         <div className="space-y-3">
            <input type="file" accept="image/*" onChange={e => e.target.files && updateEdit(edit.id, { file: e.target.files[0] })} className="text-[9px] file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"/>
            <select value={edit.position} onChange={e => updateEdit(edit.id, { position: e.target.value as any })} className="bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] w-full text-white font-black uppercase">
                <option value="top_left">Top Left</option><option value="top_right">Top Right</option><option value="bottom_left">Bottom Left</option><option value="bottom_right">Bottom Right</option>
            </select>
            <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-black uppercase text-gray-500">
                    <span>Scale</span>
                    <span>{edit.scale.toFixed(2)}x</span>
                </div>
                <input type="range" min="0.05" max="1" step="0.05" value={edit.scale} onChange={e => updateEdit(edit.id, { scale: parseFloat(e.target.value) })} className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"/>
            </div>
        </div>
      );
      case 'speed': return (
        <div className="flex items-center gap-4">
            <input type="range" min="0.25" max="4" step="0.25" value={edit.factor} onChange={e => updateEdit(edit.id, { factor: parseFloat(e.target.value) })} className="flex-grow h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"/>
            <span className="font-mono text-xs font-black text-indigo-400 min-w-[30px]">{edit.factor.toFixed(2)}x</span>
        </div>
      );
      case 'filter': return (
        <select value={edit.name} onChange={e => updateEdit(edit.id, { name: e.target.value as any })} className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-[10px] w-full text-white font-black uppercase tracking-widest">
            <option value="grayscale">Grayscale</option><option value="sepia">Sepia Tone</option><option value="negate">Negate</option><option value="vignette">Focus Vignette</option>
        </select>
      );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-8 backdrop-blur-xl animate-fade-in">
      <div className="bg-gray-900 rounded-[3rem] shadow-2xl w-full max-w-7xl h-[85vh] flex flex-col border border-white/5 overflow-hidden">
        <header className="px-10 py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div>
            <h2 className="text-2xl font-black text-white italic tracking-tighter flex items-center gap-3">
                <SlidersIcon className="w-7 h-7 text-indigo-400"/>
                Neural Pipeline Editor
            </h2>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1">Direct-Response Mastering Station</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-4xl font-light transition-colors">&times;</button>
        </header>

        <div className="flex-grow p-10 overflow-hidden grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4 flex flex-col gap-6 overflow-y-auto pr-4 custom-scrollbar">
             <div className="glass-panel p-6 rounded-[2rem] border-white/5 flex-grow flex flex-col">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <WandIcon className="w-4 h-4" />
                    INSTRUCTION STACK
                </h4>
                <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                    {edits.length === 0 && (
                        <div className="h-40 flex flex-col items-center justify-center text-center opacity-20">
                            <SlidersIcon className="w-10 h-10 mb-2" />
                            <p className="text-[9px] font-black uppercase">No Active Nodes</p>
                        </div>
                    )}
                    {edits.map(edit => (
                        <div key={edit.id} className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-4 animate-fade-in-up">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{edit.type}</span>
                                <button onClick={() => removeEdit(edit.id)} className="text-gray-600 hover:text-red-400 transition-colors">&times;</button>
                            </div>
                            {renderEditControl(edit)}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="space-y-3">
                <select defaultValue="" onChange={e => { if(e.target.value) { addEdit(e.target.value as any); e.target.value = ""; } }} className="w-full bg-white/5 border border-white/10 hover:border-indigo-500/40 text-gray-300 font-black py-4 px-6 rounded-2xl text-[10px] uppercase tracking-widest cursor-pointer transition-all outline-none">
                    <option value="" disabled>+ APPEND NEURAL NODE</option>
                    <option value="trim">Spatial Trim (Temporal)</option>
                    <option value="text">Psychological Text Layer</option>
                    <option value="image">Asset Overlay (Branding)</option>
                    <option value="speed">Pattern Interrupt Speed</option>
                    <option value="filter">Atmospheric Filter</option>
                    <option value="mute">Acoustic Suppression</option>
                </select>
                <button 
                    onClick={handleRenderVideo} 
                    disabled={isProcessing} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-xl shadow-indigo-500/40 border border-white/10 uppercase tracking-[0.2em] text-xs"
                >
                    {isProcessing ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : <WandIcon className="w-5 h-5" />}
                    EXECUTE RENDER
                </button>
            </div>
          </div>

          <div className="md:col-span-8 flex flex-col gap-8">
              <div className="glass-panel rounded-[2.5rem] p-4 bg-black/40 border-white/5 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center px-6 py-3 border-b border-white/5 mb-4">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Mastering Canvas</span>
                    <span className="text-[9px] font-mono text-gray-700 uppercase">Input: {sourceVideo.name}</span>
                </div>
                <div className="flex-grow flex items-center justify-center bg-black/20 rounded-2xl overflow-hidden">
                    <VideoPlayer src={sourceVideoUrl.current} />
                </div>
              </div>

              <div className="flex-grow glass-panel rounded-[2.5rem] p-8 border-white/5 bg-gradient-to-br from-indigo-500/[0.03] to-transparent overflow-y-auto custom-scrollbar">
                 {isProcessing ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                        <div className="relative">
                            <div className="animate-spin w-14 h-14 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"></div>
                            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl animate-pulse"></div>
                        </div>
                        <div>
                            <p className="text-lg font-black text-white italic tracking-tighter">{progressMessage}</p>
                            <div className="w-64 bg-gray-800 rounded-full h-1.5 mt-4 overflow-hidden mx-auto border border-white/5">
                                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                         <div className="max-w-md bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-[9px] text-gray-600 text-left max-h-32 overflow-y-auto">
                            {logs.map((log, i) => <div key={i}>{log}</div>)}
                         </div>
                    </div>
                 ) : error ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
                            <span className="text-2xl text-red-500 font-black">!</span>
                        </div>
                        <p className="text-red-400 font-bold max-w-sm">{error}</p>
                        <button onClick={handleRenderVideo} className="text-[10px] font-black text-white bg-white/10 px-6 py-2 rounded-xl hover:bg-white/20 uppercase">Retry Protocol</button>
                    </div>
                 ) : outputUrl ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-8 animate-fade-in">
                        <div className="w-full max-w-xl rounded-2xl overflow-hidden border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                            <video src={outputUrl} controls className="w-full aspect-video"></video>
                        </div>
                        <button onClick={handleDownload} className="bg-green-600 hover:bg-green-700 text-white font-black py-5 px-16 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-xl shadow-green-500/40 border border-white/10 uppercase tracking-[0.2em] text-xs">
                            <DownloadIcon className="w-6 h-6"/>
                            EXPORT CONVERSION MASTER
                        </button>
                    </div>
                 ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                        <WandIcon className="w-16 h-16 text-gray-500" />
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.3em]">Awaiting Render Sequence</p>
                            <p className="text-[10px] text-gray-600 font-bold uppercase mt-2">Add nodes to start mastering</p>
                        </div>
                    </div>
                 )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedEditor;
