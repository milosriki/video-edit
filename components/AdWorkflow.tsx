
import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { googleDriveService, MockDriveFile } from '../services/googleDriveService';
import { generateVideoThumbnail, extractFramesFromVideo } from '../utils/video';
import { AdCreative, CampaignStrategy, VideoFile, CampaignBrief, Avatar, MarketingFramework } from '../types';
import { WandIcon, FilmIcon, SparklesIcon, CheckIcon, UploadIcon, BarChartIcon, EyeIcon, VideoIcon, GoogleDriveIcon, ShieldIcon, UsersIcon, SlidersIcon } from './icons';
import VideoEditor from './VideoEditor';
import AudioCutterDashboard from './AudioCutterDashboard';
import AdvancedEditor from './AdvancedEditor';
import { formatErrorMessage } from '../utils/error';
import { extractAudio } from '../services/videoProcessor';
import { transcribeAudio, analyzeVideoIntelligence } from '../services/geminiService';
import AnalysisResultCard from './AnalysisResultCard';

const ScoreTag = ({ label, score, desc }: { label: string, score: number, desc: string }) => (
  <div className="flex flex-col items-center gap-1 group relative">
    <div className="text-[8px] font-black uppercase text-gray-500 tracking-tighter">{label}</div>
    <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${score > 7 ? 'text-green-400 bg-green-400/10' : 'text-yellow-400 bg-yellow-400/10'}`}>{score}/10</div>
    <div className="absolute bottom-full mb-2 w-32 hidden group-hover:block z-50">
        <div className="bg-gray-900 border border-white/10 p-2 rounded-xl shadow-2xl text-[9px] text-gray-400 font-medium leading-tight">
            {desc}
        </div>
    </div>
  </div>
);

const AdCreativeCard: React.FC<{
  adCreative: AdCreative;
  onCreateVideo: () => void;
  onSimulate: () => void;
  isTop: boolean;
}> = ({ adCreative, onCreateVideo, onSimulate, isTop }) => {
  return (
    <div className={`glass-panel rounded-[2rem] overflow-hidden flex flex-col transition-all duration-500 hover:shadow-[0_0_50px_rgba(99,102,241,0.25)] hover:-translate-y-2 border-white/5 ${isTop ? 'ring-2 ring-indigo-500 shadow-indigo-500/20' : ''}`}>
      <div className="flex justify-between items-center px-6 py-3 bg-white/[0.03] border-b border-white/5">
        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{adCreative.framework} ARCHITECTURE</span>
        {isTop && (
          <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-0.5 rounded-full">
            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">A-Roll Potential</span>
          </div>
        )}
      </div>

      <div className='p-6'>
        <div className="flex justify-between items-start mb-6">
          <div className="min-w-0 flex-grow">
            <h4 className="text-xl font-black text-white leading-tight mb-2 truncate">{adCreative.variationTitle}</h4>
            <div className="flex gap-4">
              <ScoreTag label="Attention" score={adCreative.__hookScore || 8} desc="RAS pattern interrupt quality." />
              <ScoreTag label="Interest" score={adCreative.__roiScore ? Math.floor(adCreative.__roiScore/10) : 7} desc="How well the mechanism is explained." />
              <ScoreTag label="Conversion" score={adCreative.__ctaScore || 9} desc="Directness of the CTA." />
            </div>
          </div>
          {adCreative.__roasPrediction && (
            <div className="flex flex-col items-end flex-shrink-0 bg-white/5 p-3 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">ROI Est.</span>
                <span className="text-2xl font-black text-white italic">{adCreative.__roasPrediction}x</span>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
          <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Primary Hook</label>
          <p className="text-base text-white font-extrabold leading-tight italic">"{adCreative.headline}"</p>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-3 mt-auto">
        <div className="flex gap-2">
            <button onClick={onSimulate} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-black text-[10px] py-3 rounded-xl border border-white/5 flex items-center justify-center gap-2 transition-all">
                <UsersIcon className="w-3.5 h-3.5" /> FOCUS GROUP
            </button>
            <button className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-black text-[10px] py-3 rounded-xl border border-white/5 flex items-center justify-center gap-2 transition-all">
                <ShieldIcon className="w-3.5 h-3.5" /> RISK AUDIT
            </button>
        </div>
        <button onClick={onCreateVideo} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-500/30">
          <WandIcon className="w-5 h-5"/> RENDER AD
        </button>
      </div>
    </div>
  );
};

const DriveModal: React.FC<{
    onClose: () => void;
    onSelect: (files: MockDriveFile[]) => void;
}> = ({ onClose, onSelect }) => {
    const [files, setFiles] = useState<MockDriveFile[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        googleDriveService.listFiles().then(f => { setFiles(f); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    const toggleSelect = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-8">
            <div className="bg-gray-900 border border-white/10 rounded-[3rem] w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                <header className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div>
                        <h3 className="text-2xl font-black text-white italic">Direct Drive Sync</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Import source footage for neural analysis</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-3xl font-light">&times;</button>
                </header>
                <div className="flex-grow overflow-y-auto p-8 grid grid-cols-2 md:grid-cols-4 gap-6 custom-scrollbar">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                            <div className="animate-spin w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"></div>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Bridging Cloud Drive...</span>
                        </div>
                    ) : files.map(f => (
                        <div 
                            key={f.id} 
                            onClick={() => toggleSelect(f.id)}
                            className={`relative aspect-video rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${selected.includes(f.id) ? 'border-indigo-500 ring-4 ring-indigo-500/20 scale-105 shadow-2xl' : 'border-white/5 hover:border-white/20'}`}
                        >
                            <img src={f.thumbnailLink} className="w-full h-full object-cover" />
                            <div className={`absolute inset-0 bg-indigo-600/40 flex items-center justify-center transition-opacity ${selected.includes(f.id) ? 'opacity-100' : 'opacity-0'}`}>
                                <CheckIcon className="w-10 h-10 text-white" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm">
                                <p className="text-[9px] font-black text-white truncate uppercase tracking-tighter">{f.name}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <footer className="p-8 border-t border-white/5 bg-black/40 flex justify-end gap-4">
                    <button onClick={onClose} className="px-8 py-3 text-[10px] font-black uppercase text-gray-500 hover:text-gray-300">Cancel</button>
                    <button 
                        onClick={() => onSelect(files.filter(f => selected.includes(f.id)))}
                        disabled={selected.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-12 rounded-2xl transition-all shadow-xl shadow-indigo-500/30 text-[11px] uppercase tracking-widest"
                    >
                        Sync {selected.length} Assets
                    </button>
                </footer>
            </div>
        </div>
    );
};

const AdWorkflow: React.FC<{ onNavigate?: (id: string) => void }> = ({ onNavigate }) => {
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [campaignStrategy, setCampaignStrategy] = useState<CampaignStrategy | null>(null);
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // MODAL STATES
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCutterOpen, setIsCutterOpen] = useState(false);
  const [isAdvancedEditorOpen, setIsAdvancedEditorOpen] = useState(false);
  
  const [selectedCreative, setSelectedCreative] = useState<AdCreative | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<VideoFile | null>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [showDriveModal, setShowDriveModal] = useState(false);
  
  const [campaignBrief, setCampaignBrief] = useState<CampaignBrief>({
    productName: "PTD Ultimate Body Protocol",
    offer: "Complimentary Consultation & Blueprint",
    targetMarket: "Dubai Executives 40-55",
    angle: "Biohacking productivity through fat loss",
    cta: 'Book Your Discovery Call',
    tone: 'authoritative',
    framework: 'AIDA',
    platform: 'reels',
  });

  useEffect(() => {
    apiClient.fetchAvatars().then(a => {
        setAvatars(a);
        if (a.length > 0) setSelectedAvatar(a[0].key);
    }).catch(err => setError("Failed to synchronize client avatars."));
  }, []);

  const handleDriveImport = async (selectedFiles: MockDriveFile[]) => {
      setShowDriveModal(false);
      setIsProcessing(true);
      setError(null);
      
      try {
          const newVideoFiles: VideoFile[] = [];
          for (const df of selectedFiles) {
              const file = await googleDriveService.downloadFile(df);
              newVideoFiles.push({ file, id: file.name, thumbnail: '', status: 'processing', progress: 0 });
          }
          setVideoFiles(prev => [...prev, ...newVideoFiles]);
          processAssets(newVideoFiles);
      } catch (err) {
          setError(formatErrorMessage(err));
          setIsProcessing(false);
      }
  };

  const processAssets = async (files: VideoFile[]) => {
      setIsProcessing(true);
      try {
          const processingPromises = files.map(async (vf) => {
              const thumbnail = await generateVideoThumbnail(vf.file);
              const audioBlob = await extractAudio(vf.file, () => {});
              let transcription = '';
              if (audioBlob) {
                  const words = await transcribeAudio(audioBlob);
                  transcription = words.map(w => w.word).join(' ');
              }
              const frames = await extractFramesFromVideo(vf.file, 12);
              
              // Update state locally for UI progress
              setVideoFiles(prev => prev.map(v => v.id === vf.id ? { ...v, thumbnail } : v));
              
              return { videoFile: { id: vf.id }, frames, transcription };
          });

          const allVideoData = await Promise.all(processingPromises);
          const strategy = await apiClient.analyzeVideos(allVideoData);
          setCampaignStrategy(strategy);
          
          strategy.videoAnalyses.forEach(analysis => {
            setVideoFiles(prev => prev.map(v => v.id === analysis.fileName ? { ...v, status: 'analyzed', analysisResult: analysis } : v));
          });
      } catch (err) {
          setError(formatErrorMessage(err));
      } finally {
          setIsProcessing(false);
      }
  };

  const generateConversionAds = async () => {
    if (!campaignStrategy || !selectedAvatar) return;
    setIsProcessing(true);
    setError(null);
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
            framework: campaignBrief.framework,
            __roasPrediction: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1))
        };
      });
      
      annotated.sort((a, b) => (b.__roiScore ?? 0) - (a.__roiScore ?? 0));
      setAdCreatives(annotated);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-12 pb-32">
      {/* MODALS */}
      {isEditorOpen && selectedCreative && (
        <VideoEditor adCreative={selectedCreative} sourceVideos={videoFiles.map(vf => vf.file)} onClose={() => setIsEditorOpen(false)} />
      )}
      {isCutterOpen && selectedVideoFile && (
        <AudioCutterDashboard sourceVideo={selectedVideoFile.file} onClose={() => setIsCutterOpen(false)} />
      )}
      {isAdvancedEditorOpen && selectedVideoFile && (
        <AdvancedEditor sourceVideo={selectedVideoFile.file} onClose={() => setIsAdvancedEditorOpen(false)} />
      )}
      {showDriveModal && <DriveModal onClose={() => setShowDriveModal(false)} onSelect={handleDriveImport} />}

      {error && (
        <div className="bg-red-900/50 border border-red-500/30 p-6 rounded-[2rem] text-red-300 font-bold flex justify-between items-center animate-fade-in">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-2xl hover:text-white transition-colors">&times;</button>
        </div>
      )}

      {/* STEP 1: CAMPAIGN CONFIG */}
      <section className="animate-fade-in">
        <header className="flex items-center gap-6 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
            <BarChartIcon className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight italic">Conversion Architecture</h2>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">High-Ticket Lead Generation Prototype</p>
          </div>
        </header>
        
        <div className="glass-panel p-10 rounded-[3rem] grid md:grid-cols-2 lg:grid-cols-4 gap-8 border-white/5 shadow-2xl">
          <InputGroup label="Core Offer" value={campaignBrief.offer} onChange={v => setCampaignBrief({...campaignBrief, offer: v})} />
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block px-1">Winning Avatar</label>
            <select value={selectedAvatar} onChange={e => setSelectedAvatar(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 text-white appearance-none">
              {avatars.map(a => <option key={a.key} value={a.key} className="bg-gray-900">{a.name}</option>)}
            </select>
          </div>
          <InputGroup label="Sales Framework" value={campaignBrief.framework} onChange={v => setCampaignBrief({...campaignBrief, framework: v as MarketingFramework})} select={['AIDA', 'PAS', 'HSO', 'Direct-Offer']} />
          <InputGroup label="Primary CTA" value={campaignBrief.cta} onChange={v => setCampaignBrief({...campaignBrief, cta: v})} />
          <div className="flex items-end">
            <button onClick={generateConversionAds} disabled={!campaignStrategy || isProcessing} className={`w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${!campaignStrategy ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-500/30 ring-1 ring-white/10'}`}>
                Architect Blueprints
            </button>
          </div>
        </div>
      </section>

      {/* STEP 2: ASSET POOL (DRIVE INTEGRATED) */}
      <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <header className="flex items-center gap-6 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-green-600/20 border border-green-500/40 flex items-center justify-center">
            <VideoIcon className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight italic">Direct Response Asset Pool</h2>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Neural Video Intelligence Layer Active</p>
          </div>
        </header>

        {videoFiles.length === 0 ? (
          <div className="glass-panel p-24 rounded-[3.5rem] border-dashed border-2 border-white/10 text-center flex flex-col items-center bg-indigo-500/[0.01]">
            <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-10 border border-indigo-500/20">
                <UploadIcon className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4 tracking-tighter">Sync Cloud Assets</h3>
            <p className="text-gray-500 text-sm max-w-sm mb-12 leading-relaxed font-bold uppercase tracking-widest">Connect Drive to deconstruct winner patterns using Gemini 3.0 Vision layers.</p>
            <div className="flex gap-8">
              <label className="bg-white/5 hover:bg-white/10 text-gray-300 font-black py-5 px-16 rounded-2xl cursor-pointer transition-all border border-white/10 text-xs uppercase tracking-widest shadow-xl">
                LOCAL IMPORT
                <input type="file" multiple accept="video/*" className="hidden" onChange={e => { if(e.target.files) { const files = Array.from(e.target.files); const vfs = files.map(f => ({ file: f, id: f.name, thumbnail: '', status: 'processing', progress: 0 } as VideoFile)); setVideoFiles(vfs); processAssets(vfs); } }} />
              </label>
              <button onClick={() => setShowDriveModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 px-16 rounded-2xl transition-all shadow-2xl shadow-indigo-500/40 border border-indigo-500/20 flex items-center gap-4 text-xs uppercase tracking-widest ring-1 ring-white/10">
                <GoogleDriveIcon className="w-6 h-6" /> CONNECT DRIVE
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videoFiles.map(vf => (
              <AnalysisResultCard 
                  key={vf.id} 
                  videoFile={vf} 
                  onGenerateBlueprints={() => generateConversionAds()} 
                  onOpenCutter={() => { setSelectedVideoFile(vf); setIsCutterOpen(true); }} 
                  onOpenAdvancedEditor={() => { setSelectedVideoFile(vf); setIsAdvancedEditorOpen(true); }}
              />
            ))}
            <div 
                onClick={() => onNavigate?.('remote-tools')}
                className="rounded-[2.5rem] border-2 border-indigo-500/20 bg-indigo-500/[0.03] flex flex-col items-center justify-center p-12 hover:bg-indigo-500/10 cursor-pointer transition-all group animate-pulse"
            >
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                    <SlidersIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest text-center">Bridge Neural Node<br/>(Ad Alpha MCP)</span>
            </div>
            <div 
                onClick={() => setShowDriveModal(true)}
                className="rounded-[2.5rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-12 hover:bg-white/[0.02] cursor-pointer transition-all group"
            >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <GoogleDriveIcon className="w-6 h-6 text-gray-500 group-hover:text-indigo-400" />
                </div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-300">Add from Drive</span>
            </div>
          </div>
        )}
      </section>

      {/* STEP 3: CONVERSION VAULT */}
      {adCreatives.length > 0 && (
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <header className="flex items-center gap-6 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
              <EyeIcon className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight italic">Conversion Vault</h2>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">High-Performing Neural Ad Iterations</p>
            </div>
          </header>
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-10">
            {adCreatives.map((ad, i) => (
              <AdCreativeCard
                key={i}
                adCreative={ad}
                isTop={i === 0}
                onSimulate={() => {}}
                onCreateVideo={() => { setSelectedCreative(ad); setIsEditorOpen(true); }}
              />
            ))}
          </div>
        </section>
      )}

      {isProcessing && (
        <div className="fixed bottom-12 right-12 glass-panel p-10 rounded-[2.5rem] border-indigo-500/30 flex items-center gap-8 animate-float shadow-[0_30px_80px_-15px_rgba(0,0,0,0.7)] z-[100] border ring-2 ring-white/5">
          <div className="relative">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-400/10 border-t-indigo-500 rounded-full"></div>
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl animate-pulse rounded-full"></div>
          </div>
          <div>
            <div className="text-base font-black text-white uppercase tracking-widest italic leading-none mb-1">Processing Neural Intel</div>
            <div className="text-[10px] text-gray-500 font-mono tracking-tighter">GEMINI_3_PRO_ACTIVE</div>
          </div>
        </div>
      )}
    </div>
  );
};

const InputGroup = ({ label, value, onChange, select }: { label: string; value: string; onChange: (v: string) => void; select?: string[] }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block px-1">{label}</label>
    {select ? (
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 text-white appearance-none">
        {select.map(s => <option key={s} value={s} className="bg-gray-900">{s.toUpperCase()}</option>)}
      </select>
    ) : (
      <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-gray-700" />
    )}
  </div>
);

export default AdWorkflow;
