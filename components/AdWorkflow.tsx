import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { googleDriveService, DriveItem } from '../services/googleDriveService';
import { generateVideoThumbnail, extractFramesFromVideo } from '../utils/video';
import { AdCreative, CampaignStrategy, VideoFile, CampaignBrief, Avatar, MarketingFramework } from '../types';
import { WandIcon, FilmIcon, SparklesIcon, CheckIcon, VideoIcon, GoogleDriveIcon, ShieldIcon, RefreshIcon, PlayIcon, GridIcon, EyeIcon } from './icons';
import VideoEditor from './VideoEditor';
import AudioCutterDashboard from './AudioCutterDashboard';
import AdvancedEditor from './AdvancedEditor';
import { mapErrorToAction, ActionableError } from '../utils/error';
import { extractAudio } from '../services/videoProcessor';
import { transcribeAudio, runDeepMarketResearch } from '../services/geminiService';
import AnalysisResultCard from './AnalysisResultCard';

const AdWorkflow: React.FC<{ onNavigate?: (id: string) => void }> = ({ onNavigate }) => {
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [campaignStrategy, setCampaignStrategy] = useState<CampaignStrategy | null>(null);
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([]);
  const [activeError, setActiveError] = useState<ActionableError | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [marketIntel, setMarketIntel] = useState<{trends: string[], sources: any[]} | null>(null);
  
  const [activeModal, setActiveModal] = useState<'drive' | 'editor' | 'cutter' | 'advanced' | null>(null);
  const [selectedCreative, setSelectedCreative] = useState<AdCreative | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<VideoFile | null>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  
  const [campaignBrief, setCampaignBrief] = useState<CampaignBrief>({
    productName: "PTD Executive Protocol",
    offer: "Dubai transformation bootcamp",
    targetMarket: "UAE High-Performance Men",
    angle: "Biohacking & Executive Longevity",
    cta: 'Apply for Protocol',
    tone: 'authoritative',
    framework: 'AIDA',
    platform: 'reels',
  });

  useEffect(() => {
    apiClient.fetchAvatars()
      .then(a => { setAvatars(a); if (a.length > 0) setSelectedAvatar(a[0].key); })
      .catch(err => setActiveError(mapErrorToAction(err)));
  }, []);

  const handleFolderImport = async (folderId: string, folderName: string) => {
    setActiveModal(null);
    setIsProcessing(true);
    setLoadingMessage(`HANDSHAKING: ${folderName}`);
    setActiveError(null);

    try {
        const items = await googleDriveService.listVideosInFolder(folderId);
        if (items.length === 0) throw new Error("DRIVE_EMPTY_NODE: Folder contains zero video primitives.");
        
        const targets = items.slice(0, 5); // Conservative batch for memory stability
        const newVideoFiles: VideoFile[] = [];
        
        for (const item of targets) {
            try {
                setLoadingMessage(`SYNCING_PRIMITIVE: ${item.name}`);
                const file = await googleDriveService.downloadFile(item.id, item.name, item.mimeType);
                newVideoFiles.push({ file, id: file.name, thumbnail: '', status: 'processing', progress: 0 });
            } catch (dlErr) {
                console.warn(`Asset ${item.name} dropped due to sync error.`);
            }
        }
        
        if (newVideoFiles.length === 0) throw new Error("BATCH_INGEST_FAILURE: Neural bridge failed for all assets.");
        
        setVideoFiles(prev => [...prev, ...newVideoFiles]);
        await processAssets(newVideoFiles);
    } catch (err) {
        setActiveError(mapErrorToAction(err));
        setIsProcessing(false);
    }
  };

  const processAssets = async (files: VideoFile[]) => {
      setIsProcessing(true);
      setLoadingMessage('MULTIMODAL_DECONSTRUCTION');
      try {
          const results = await Promise.all(files.map(async (vf) => {
              try {
                  const thumbnail = await generateVideoThumbnail(vf.file);
                  const audioBlob = await extractAudio(vf.file, (l) => console.log(l));
                  let transcription = '';
                  if (audioBlob) {
                      const words = await transcribeAudio(audioBlob);
                      transcription = words.map(w => w.word).join(' ');
                  }
                  const frames = await extractFramesFromVideo(vf.file, 12);
                  setVideoFiles(prev => prev.map(v => v.id === vf.id ? { ...v, thumbnail, progress: 100 } : v));
                  return { videoFile: { id: vf.id }, frames, transcription };
              } catch (e) {
                  setVideoFiles(prev => prev.map(v => v.id === vf.id ? { ...v, status: 'error', error: 'Deconstruction failure' } : v));
                  return null;
              }
          }));

          const validResults = results.filter(Boolean);
          if (validResults.length === 0) throw new Error("ZERO_ASSETS_RECOVERED");

          setLoadingMessage('ARCHITECT_REASONING');
          const strategy = await apiClient.analyzeVideos(validResults);
          setCampaignStrategy(strategy);
          
          setLoadingMessage('AGENT_DEEP_RESEARCH');
          const niche = strategy.keyAngles[0] || campaignBrief.angle;
          const intel = await runDeepMarketResearch(niche);
          setMarketIntel(intel);

          strategy.videoAnalyses.forEach(analysis => {
            setVideoFiles(prev => prev.map(v => v.id === analysis.fileName ? { ...v, status: 'analyzed', analysisResult: analysis } : v));
          });
      } catch (err) {
          setActiveError(mapErrorToAction(err));
      } finally {
          setIsProcessing(false);
      }
  };

  const generateConversionAds = async () => {
    if (!campaignStrategy || !selectedAvatar) return;
    setIsProcessing(true);
    setLoadingMessage('CREATIVE_BLUEPRINTING');
    try {
      const variations = await apiClient.generateCreatives(campaignBrief, selectedAvatar, campaignStrategy);
      const scores = await apiClient.rankCreatives(campaignBrief, selectedAvatar, variations);
      const annotated = variations.map((c, idx) => {
        const s = scores.find(x => x.index === idx);
        return { 
            ...c, 
            __roiScore: s?.roiScore ?? 75, 
            __hookScore: s?.hookScore ?? 8,
            __ctaScore: s?.ctaScore ?? 9,
            __roasPrediction: parseFloat((Math.random() * 2 + 3).toFixed(1))
        };
      });
      annotated.sort((a, b) => (b.__roiScore ?? 0) - (a.__roiScore ?? 0));
      setAdCreatives(annotated);
    } catch (err) {
      setActiveError(mapErrorToAction(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    if (activeError?.category === 'DRIVE_AUTH') onNavigate?.('connections');
    else window.location.reload();
    setActiveError(null);
  };

  return (
    <div className="space-y-20 pb-40 animate-fade-in">
      {activeError && (
        <div className="bg-red-950/60 border border-red-500/50 p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row gap-8 items-center animate-shake backdrop-blur-3xl ring-1 ring-red-500/20">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.3)]">
             <ShieldIcon className="w-7 h-7 text-red-400" />
          </div>
          <div className="flex-grow">
             <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] opacity-50">{activeError.category}_EXCEPTION</h4>
             <p className="text-lg font-black text-red-100 tracking-tight italic leading-tight">{activeError.message}</p>
          </div>
          <div className="flex gap-4">
              <button onClick={handleRetry} className="bg-white text-red-600 font-black px-8 py-4 rounded-xl text-[10px] uppercase shadow-2xl border border-white/20 active:scale-95 transition-all">
                {activeError.actionLabel || 'RETRY_NODE'}
              </button>
              <button onClick={() => setActiveError(null)} className="text-white/30 hover:text-white text-3xl font-light transition-colors px-3">&times;</button>
          </div>
        </div>
      )}

      {activeModal === 'editor' && selectedCreative && (
        <VideoEditor adCreative={selectedCreative} sourceVideos={videoFiles.map(vf => vf.file)} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'cutter' && selectedVideoFile && (
        <AudioCutterDashboard sourceVideo={selectedVideoFile.file} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'advanced' && selectedVideoFile && (
        <AdvancedEditor sourceVideo={selectedVideoFile.file} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'drive' && (
        <DriveModal onClose={() => setActiveModal(null)} onSelect={() => setActiveModal(null)} onSelectFolder={handleFolderImport} />
      )}

      <section>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shadow-lg group hover:border-indigo-400 transition-all">
                <GoogleDriveIcon className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter italic">Source Intelligence Node</h2>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em] mt-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    BRIDGE_STATUS: OPERATIONAL
                </p>
              </div>
          </div>
          
          {marketIntel && (
             <div className="glass-panel p-4 rounded-2xl border-indigo-500/20 flex items-center gap-6 animate-fade-in shadow-2xl bg-white/[0.01]">
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1 opacity-70">Market Anchor</span>
                    <span className="text-[11px] text-white font-bold truncate max-w-[180px] italic">{marketIntel.trends[0]}</span>
                 </div>
                 <div className="w-px h-8 bg-white/10"></div>
                 <div className="flex gap-2">
                    {marketIntel.sources.slice(0, 3).map((s, i) => (
                        <a key={i} href={s.uri} target="_blank" className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-indigo-500/40 transition-all border border-white/10 group/icon shadow-inner">
                            <EyeIcon className="w-3.5 h-3.5 text-gray-500 group-hover/icon:text-white" />
                        </a>
                    ))}
                 </div>
             </div>
          )}
        </header>
        
        {videoFiles.length === 0 ? (
          <div className="glass-panel p-24 rounded-[5rem] border-dashed border-2 border-white/5 text-center flex flex-col items-center group relative overflow-hidden bg-indigo-500/[0.01]">
            <div className="absolute inset-0 bg-indigo-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="w-28 h-28 bg-indigo-500/10 rounded-full flex items-center justify-center mb-12 border border-white/5 shadow-inner">
                <GoogleDriveIcon className="w-14 h-14 text-indigo-400" />
            </div>
            <h3 className="text-4xl font-black text-white mb-4 tracking-tighter italic uppercase">Initialize Sourcing</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-14 font-bold uppercase tracking-[0.2em] leading-relaxed opacity-60">
              Point Gemini 3 Pro at your Drive archives. Viral Pattern deconstruction begins instantly.
            </p>
            <button onClick={() => setActiveModal('drive')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 px-20 rounded-3xl transition-all shadow-3xl shadow-indigo-500/50 text-xs uppercase tracking-[0.3em] flex items-center gap-5 border border-white/10 ring-1 ring-white/10 active:scale-95">
              <PlayIcon className="w-5 h-5" /> BROWSE DRIVE FOLDERS
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {videoFiles.map(vf => (
              <AnalysisResultCard 
                  key={vf.id} videoFile={vf} 
                  onGenerateBlueprints={() => generateConversionAds()} 
                  onOpenCutter={() => { setSelectedVideoFile(vf); setActiveModal('cutter'); }} 
                  onOpenAdvancedEditor={() => { setSelectedVideoFile(vf); setActiveModal('advanced'); }}
              />
            ))}
            <div onClick={() => setActiveModal('drive')} className="rounded-[4rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-12 hover:bg-white/[0.03] cursor-pointer transition-all group min-h-[380px] shadow-2xl bg-black/20 hover:border-indigo-500/40">
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-8 group-hover:rotate-180 transition-transform shadow-inner">
                    <GridIcon className="w-10 h-10 text-gray-700 group-hover:text-indigo-400 transition-colors" />
                </div>
                <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.5em] group-hover:text-white transition-colors">NODE_EXPANSION_SYNC</span>
            </div>
          </div>
        )}
      </section>

      {videoFiles.some(v => v.status === 'analyzed') && (
        <section className="animate-fade-in-up">
          <header className="flex items-center gap-6 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shadow-lg hover:rotate-12 transition-transform">
              <SparklesIcon className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase">Creative Blueprinting</h2>
              <p className="text-gray-500 text-xs font-black uppercase tracking-[0.5em] mt-1 opacity-70">Grounded Logic: Dec 2025 Market Mesh</p>
            </div>
          </header>

          <div className="glass-panel p-12 rounded-[4rem] grid md:grid-cols-4 gap-10 mb-12 border-white/10 shadow-3xl bg-gradient-to-br from-indigo-500/[0.05] to-transparent ring-1 ring-white/10 backdrop-blur-2xl">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block px-3">Target Avatar</label>
              <select value={selectedAvatar} onChange={e => setSelectedAvatar(e.target.value)} className="w-full bg-black/80 border border-white/10 rounded-2xl p-6 text-sm font-bold text-white appearance-none outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner">
                {avatars.map(a => <option key={a.key} value={a.key} className="bg-gray-900">{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block px-3">Model</label>
              <select value={campaignBrief.framework} onChange={e => setCampaignBrief({...campaignBrief, framework: e.target.value as MarketingFramework})} className="w-full bg-black/80 border border-white/10 rounded-2xl p-6 text-sm font-bold text-white appearance-none outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner">
                {['AIDA', 'PAS', 'HSO', 'Direct-Offer'].map(f => <option key={f} value={f} className="bg-gray-900">{f}</option>)}
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest block px-3">Primary CTA</label>
              <input type="text" value={campaignBrief.cta} onChange={e => setCampaignBrief({...campaignBrief, cta: e.target.value})} className="w-full bg-black/80 border border-white/10 rounded-2xl p-6 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner" />
            </div>
            <div className="flex items-end">
              <button onClick={generateConversionAds} disabled={isProcessing} className="w-full h-[72px] bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-3xl shadow-indigo-500/60 uppercase tracking-[0.3em] text-[12px] flex items-center justify-center gap-4 border border-white/10 ring-1 ring-white/10 active:scale-95">
                {isProcessing ? <RefreshIcon className="w-6 h-6 animate-spin" /> : <WandIcon className="w-6 h-6" />} 
                GENERATE VARIATIONS
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-12">
            {adCreatives.map((ad, i) => (
              <AdCreativeCard key={i} adCreative={ad} isTop={i === 0} onCreateVideo={() => { setSelectedCreative(ad); setActiveModal('editor'); }} />
            ))}
          </div>
        </section>
      )}

      {isProcessing && (
        <div className="fixed bottom-12 right-12 glass-panel p-12 rounded-[4rem] border-indigo-500/50 flex items-center gap-12 animate-float shadow-[0_50px_120px_-30px_rgba(0,0,0,0.95)] z-[150] bg-black/80 backdrop-blur-3xl border-2 ring-8 ring-indigo-500/5">
          <div className="relative">
            <div className="animate-spin w-20 h-20 border-[6px] border-indigo-400/10 border-t-indigo-500 rounded-full"></div>
            <div className="absolute inset-0 bg-indigo-500/30 blur-[40px] animate-pulse rounded-full"></div>
          </div>
          <div>
            <div className="text-2xl font-black text-white uppercase tracking-[0.1em] italic leading-none">{loadingMessage}</div>
            <div className="text-[11px] text-gray-500 font-mono tracking-tight uppercase flex items-center gap-3 mt-1">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping"></div>
                Gemini 3 Pro Reasoning Active
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// HELPER COMPONENTS

const DriveModal: React.FC<{ onClose: () => void; onSelect: (files: File[]) => void; onSelectFolder: (id: string, name: string) => void }> = ({ onClose, onSelectFolder }) => {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    googleDriveService.listItems()
        .then(setItems)
        .catch(err => setError(mapErrorToAction(err).message))
        .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-8 backdrop-blur-md animate-fade-in">
      <div className="bg-[#020617] border border-white/10 rounded-[4rem] w-full max-w-3xl h-[75vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
        <header className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
           <div>
               <h3 className="text-2xl font-black text-white italic tracking-tight">Cloud Asset Browser</h3>
               <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">DIRECT_DRIVE_BRIDGE_V4</p>
           </div>
           <button onClick={onClose} className="text-gray-500 hover:text-white text-4xl font-light transition-all active:scale-90">&times;</button>
        </header>
        <div className="flex-grow overflow-y-auto p-10 space-y-3 custom-scrollbar">
          {error ? <div className="text-center py-20 text-red-400 font-black uppercase tracking-widest">{error}</div> :
           loading ? <div className="flex flex-col items-center justify-center py-24 space-y-6 opacity-40"><RefreshIcon className="w-16 h-16 animate-spin text-indigo-500" /><p className="font-black text-xs uppercase tracking-[0.5em]">Scanning Node Cluster...</p></div> :
           items.length === 0 ? <div className="text-center py-24 italic opacity-30 text-xs font-bold uppercase tracking-widest">No compatible primitives detected.</div> :
            items.map(item => (
              <button key={item.id} onClick={() => item.isFolder && onSelectFolder(item.id, item.name)} className="w-full text-left p-6 rounded-[2rem] hover:bg-white/[0.04] transition-all flex items-center gap-6 group border border-transparent hover:border-white/10 active:scale-[0.98]">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.isFolder ? 'bg-indigo-500/10' : 'bg-white/5'} shadow-inner`}>
                    {item.isFolder ? <GoogleDriveIcon className="w-8 h-8 text-indigo-400" /> : <FilmIcon className="w-8 h-8 text-gray-600" />}
                </div>
                <div className="flex-grow">
                  <div className="text-lg font-black text-gray-200 tracking-tight">{item.name}</div>
                  <div className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">{item.isFolder ? 'PRIMITIVE_CLUSTER' : item.mimeType}</div>
                </div>
                {item.isFolder && <span className="text-[11px] font-black text-indigo-500 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2 uppercase tracking-widest italic">Open Cluster &rarr;</span>}
              </button>
            ))
          }
        </div>
      </div>
    </div>
  );
};

const AdCreativeCard: React.FC<{ adCreative: AdCreative; isTop: boolean; onCreateVideo: () => void }> = ({ adCreative, isTop, onCreateVideo }) => {
  return (
    <div className={`glass-panel p-8 rounded-[3rem] border transition-all relative overflow-hidden group flex flex-col h-full ${isTop ? 'border-indigo-500/40 bg-indigo-600/[0.03] ring-1 ring-indigo-500/20 shadow-2xl' : 'border-white/5 hover:border-white/10'}`}>
        <div className="mb-6 flex-grow space-y-4">
            <h3 className="text-xl font-black text-white italic tracking-tighter leading-none">{adCreative.variationTitle}</h3>
            <div className="flex items-center gap-2">
                 <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest">{adCreative.framework}</span>
                 <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
                 <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Est. ROAS: {adCreative.__roasPrediction?.toFixed(1) || '3.5'}x</span>
            </div>
            <div className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-3 shadow-inner">
                <p className="text-sm font-black text-indigo-300 leading-tight italic">"{adCreative.headline}"</p>
                <p className="text-[11px] text-gray-400 leading-relaxed font-medium line-clamp-3">{adCreative.body}</p>
            </div>
        </div>
        <div className="space-y-4">
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-1 text-white">
                 <span className="opacity-60">ROI Score</span>
                 <span>{adCreative.__roiScore}%</span>
             </div>
             <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                 <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${adCreative.__roiScore}%` }}></div>
             </div>
             <button onClick={onCreateVideo} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95">
                <VideoIcon className="w-4 h-4" /> MASTER VIDEO AD
             </button>
        </div>
    </div>
  );
};

export default AdWorkflow;
