import React, { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import { extractFramesFromVideo, generateVideoThumbnail } from '../utils/video';
import { AdCreative, CampaignStrategy, VideoFile, CampaignBrief, Avatar } from '../types';
import { WandIcon, FilmIcon, SparklesIcon, VideoIcon, GoogleDriveIcon, CheckIcon, UploadIcon } from './icons';
import VideoEditor from './VideoEditor';
import AdvancedEditor from './AdvancedEditor';
import { formatErrorMessage } from '../utils/error';
import { extractAudio } from '../services/videoProcessor';
import { transcribeAudio } from '../services/geminiService';
import AudioCutterDashboard from './AudioCutterDashboard';
import { googleDriveService, MockDriveFile } from '../services/googleDriveService';
import AnalysisResultCard from './AnalysisResultCard';

const AdCreativeCard: React.FC<{
  adCreative: AdCreative;
  onCreateVideo: () => void;
  isTop: boolean;
  videoFiles: VideoFile[];
}> = ({ adCreative, onCreateVideo, isTop, videoFiles }) => {
  return (
    <div className={`bg-gray-800 rounded-lg overflow-hidden border border-gray-700/50 flex flex-col transition-all duration-300 hover:shadow-xl hover:border-indigo-500/50 hover:scale-[1.02] ${isTop ? 'border-2 border-green-500' : ''}`}>
      {isTop && (
        <div className="bg-green-500 text-black text-xs font-bold uppercase tracking-wider text-center py-1">
          Top Performer
        </div>
      )}
      <div className='p-6 bg-gray-800'>
        <h4 className="text-lg font-bold text-indigo-400">{adCreative.variationTitle}</h4>
        
        {typeof adCreative.__roiScore === 'number' && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <div className="bg-green-900/50 text-green-300 font-bold px-2 py-1 rounded-full">ROI: {adCreative.__roiScore}/100</div>
            {typeof adCreative.__hookScore === 'number' && (
              <div className="bg-blue-900/50 text-blue-300 font-semibold px-2 py-1 rounded-full">Hook: {adCreative.__hookScore}/10</div>
            )}
            {typeof adCreative.__ctaScore === 'number' && (
              <div className="bg-purple-900/50 text-purple-300 font-semibold px-2 py-1 rounded-full">CTA: {adCreative.__ctaScore}/10</div>
            )}
          </div>
        )}

        <div className="relative bg-gray-900/50 p-4 rounded-md border border-gray-700 mt-4 group">
          <label className="text-xs font-semibold text-gray-400">HEADLINE</label>
          <p className="text-lg text-white font-semibold mt-1">{adCreative.headline}</p>
        </div>
        <div className="relative bg-gray-900/50 p-4 rounded-md border border-gray-700 mt-2 group">
          <label className="text-xs font-semibold text-gray-400">BODY</label>
          <p className="text-base text-gray-300 mt-1 whitespace-pre-line">{adCreative.body}</p>
        </div>
      </div>
      <div className="bg-gray-900/50 p-6 border-t border-indigo-500/30 flex-grow">
        <h5 className="text-base font-bold text-gray-300 mb-4 flex items-center gap-2">
          <FilmIcon className="w-5 h-5 text-indigo-400"/>
          Remixing Blueprint
        </h5>
        <div className="space-y-4 text-sm max-h-60 overflow-y-auto pr-2">
          {adCreative.editPlan.map((scene, sceneIndex) => {
             const sourceVideo = videoFiles.find(vf => vf.id === scene.sourceFile);
             return (
                <div key={sceneIndex} className="flex gap-4">
                  {sourceVideo?.thumbnail ? (
                      <img src={sourceVideo.thumbnail} alt={scene.sourceFile} className="w-16 h-16 object-cover rounded-md flex-shrink-0"/>
                  ) : (
                      <div className="w-16 h-16 bg-gray-700 rounded-md flex-shrink-0"></div>
                  )}
                  <div className="border-l-2 border-gray-700 pl-4 text-xs">
                     <p><strong className="text-gray-400">Time:</strong> <span className="font-mono text-indigo-400">{scene.timestamp}</span></p>
                     <p><strong className="text-gray-400">Source:</strong> {scene.sourceFile}</p>
                     <p><strong className="text-gray-400">Visual:</strong> {scene.visual}</p>
                    {scene.overlayText && scene.overlayText.toLowerCase() !== 'n/a' && <p><strong className="text-gray-400">Text:</strong> "{scene.overlayText}"</p>}
                  </div>
                </div>
             );
          })}
        </div>
      </div>
      <div className="p-4 bg-gray-800 border-t border-gray-700/50">
        <button onClick={onCreateVideo} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-105 transform hover:brightness-110">
          <WandIcon className="w-5 h-5"/>
          Create Remixed Video
        </button>
      </div>
    </div>
  );
};

const CampaignBriefForm: React.FC<{ 
    brief: CampaignBrief, 
    setBrief: (b: CampaignBrief) => void,
    avatars: Avatar[],
    selectedAvatar: string,
    setSelectedAvatar: (key: string) => void,
}> = ({ brief, setBrief, avatars, selectedAvatar, setSelectedAvatar }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setBrief({ ...brief, [name]: value });
    };

    return (
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div>
          <label className="font-semibold text-gray-400">Product/Service Name</label>
          <input name="productName" value={brief.productName} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-900/70 border border-gray-600 rounded-md" />
        </div>
        <div>
          <label className="font-semibold text-gray-400">Offer</label>
          <input name="offer" value={brief.offer} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-900/70 border border-gray-600 rounded-md" />
        </div>
         <div>
          <label className="font-semibold text-gray-400">Target Market</label>
          <input name="targetMarket" value={brief.targetMarket} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-900/70 border border-gray-600 rounded-md" />
        </div>
        <div>
          <label className="font-semibold text-gray-400">Creative Angle</label>
          <input name="angle" value={brief.angle} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-900/70 border border-gray-600 rounded-md" />
        </div>
        
        <div>
          <label className="font-semibold text-gray-400">Tone of Voice</label>
          <select name="tone" value={brief.tone} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-900/70 border border-gray-600 rounded-md">
            <option value="direct">Direct</option>
            <option value="empathetic">Empathetic</option>
            <option value="authoritative">Authoritative</option>
            <option value="playful">Playful</option>
            <option value="inspirational">Inspirational</option>
          </select>
        </div>
        <div>
          <label className="font-semibold text-gray-400">Platform</label>
          <select name="platform" value={brief.platform} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-900/70 border border-gray-600 rounded-md">
            <option value="reels">Reels (Instagram)</option>
            <option value="shorts">Shorts (YouTube)</option>
            <option value="tiktok">TikTok</option>
            <option value="feed">Feed (Facebook)</option>
            <option value="stories">Stories (Instagram)</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="font-semibold text-gray-400">Select Target Avatar</label>
          <select 
              name="avatar" 
              value={selectedAvatar} 
              onChange={(e) => setSelectedAvatar(e.target.value)} 
              className="w-full mt-1 p-2 bg-gray-900/70 border border-gray-600 rounded-md"
          >
              <option value="" disabled>-- Select an Avatar --</option>
              {avatars.map(avatar => (
                  <option key={avatar.key} value={avatar.key}>{avatar.name}</option>
              ))}
          </select>
        </div>
      </div>
    );
};

const FileUploadZone: React.FC<{
  onFilesSelected: (files: File[]) => void;
  onConnectDrive: () => void;
  isConnecting: boolean;
  isDisabled: boolean;
}> = ({ onFilesSelected, onConnectDrive, isConnecting, isDisabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div 
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`bg-gray-900/50 p-6 rounded-lg border-2 border-dashed ${isDragging ? 'border-indigo-500' : 'border-gray-700/50'} text-center transition-colors`}
    >
      <UploadIcon className="w-12 h-12 mx-auto text-gray-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">Drag & Drop Videos Here</h3>
      <p className="text-gray-400 mb-4">Select up to 5 video files</p>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="video/*" className="hidden" />
      <button onClick={() => fileInputRef.current?.click()} disabled={isDisabled} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg mb-2">
        Or Select Files
      </button>
      <p className="text-gray-500 text-sm my-2">or</p>
      <button onClick={onConnectDrive} disabled={isConnecting || isDisabled} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:bg-gray-600 mx-auto">
        <GoogleDriveIcon className="w-5 h-5" /> {isConnecting ? 'Connecting...' : 'Connect Google Drive'}
      </button>
    </div>
  );
};

const AdWorkflow: React.FC = () => {
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [campaignStrategy, setCampaignStrategy] = useState<CampaignStrategy | null>(null);
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<AdCreative | null>(null);
  const [isCutterOpen, setIsCutterOpen] = useState(false);
  const [isAdvancedEditorOpen, setIsAdvancedEditorOpen] = useState(false);
  const [videoForEditing, setVideoForEditing] = useState<File | null>(null);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState<MockDriveFile[]>([]);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState<Record<string, MockDriveFile>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  
  const [campaignBrief, setCampaignBrief] = useState<CampaignBrief>({
    productName: "PTD 12-Week Superhuman Program",
    offer: "Free 30-min Consultation",
    targetMarket: "Men 35-55 in Dubai",
    angle: "No-gym fat loss for busy executives",
    cta: 'Apply Now for a FREE Consultation',
    tone: 'direct',
    goals: ['leads', 'bookings'],
    platform: 'reels',
  });

  useEffect(() => {
    const loadAvatars = async () => {
        try {
            const fetchedAvatars = await apiClient.fetchAvatars();
            setAvatars(fetchedAvatars);
            if (fetchedAvatars.length > 0 && !selectedAvatar) {
                setSelectedAvatar(fetchedAvatars[0].key);
            }
        } catch (err) {
            setError(formatErrorMessage(err));
        }
    };
    loadAvatars();
    
    // Pre-initialize Google Drive Service to ensure scripts are loaded
    // This prevents popup blockers from blocking the sign-in window later
    googleDriveService.init().catch(err => console.warn("Background init of Google Drive failed:", err));
  }, [selectedAvatar]);

  const handleConnectDrive = async () => {
      setIsConnecting(true);
      setError(null);
      try {
          await googleDriveService.signIn();
          const files = await googleDriveService.listFiles();
          setDriveFiles(files);
          setIsDrivePickerOpen(true);
      } catch (err) {
          setError(formatErrorMessage(err));
      } finally {
          setIsConnecting(false);
      }
  };

  const handleDriveFileToggle = (file: MockDriveFile) => {
      setSelectedDriveFiles(prev => {
          const newSelection = { ...prev };
          if (newSelection[file.id]) {
              delete newSelection[file.id];
          } else if (Object.keys(newSelection).length < 5) {
              newSelection[file.id] = file;
          }
          return newSelection;
      });
  };
  
  const updateFileState = (id: string, updates: Partial<VideoFile>) => {
      setVideoFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const processAndAnalyzeFiles = async (files: File[]) => {
      handleReset();
      setIsProcessing(true);

      const newVideoFiles: VideoFile[] = files.slice(0, 5).map(file => ({ file, id: file.name, thumbnail: '', status: 'pending' }));
      setVideoFiles(newVideoFiles);

      const processingPromises = newVideoFiles.map(async (videoFile) => {
          try {
              updateFileState(videoFile.id, { status: 'processing', progress: 10, loadingMessage: 'Generating thumbnail...' });
              const thumbnail = await generateVideoThumbnail(videoFile.file);
              updateFileState(videoFile.id, { thumbnail, progress: 30, loadingMessage: 'Extracting audio...' });

              const audioBlob = await extractAudio(videoFile.file, () => {}).catch(err => {
                  console.warn(`Could not extract audio for ${videoFile.id}:`, err);
                  return null;
              });
              
              updateFileState(videoFile.id, { progress: 50, loadingMessage: 'Transcribing speech...' });
              let transcription: string | undefined = undefined;
              if (audioBlob && audioBlob.size > 1000) {
                  const words = await transcribeAudio(audioBlob);
                  transcription = words.map(w => w.word).join(' ');
              }
              
              updateFileState(videoFile.id, { progress: 70, loadingMessage: 'Extracting key frames...' });
              const frames = await extractFramesFromVideo(videoFile.file, 8);
              updateFileState(videoFile.id, { progress: 90, loadingMessage: 'Ready for AI analysis...' });
              
              return { videoFile: { id: videoFile.id }, frames, transcription };
          } catch (err) {
              const errorMessage = formatErrorMessage(err);
              updateFileState(videoFile.id, { status: 'error', error: errorMessage, progress: 0 });
              return null;
          }
      });

      const allVideoData = (await Promise.all(processingPromises)).filter((d): d is NonNullable<typeof d> => d !== null);
      
      if (allVideoData.length > 0) {
          try {
              setVideoFiles(prev => prev.map(f => f.status === 'processing' ? { ...f, progress: 95, loadingMessage: 'AI is analyzing strategy...' } : f));
              const strategy = await apiClient.analyzeVideos(allVideoData as any);
              setCampaignStrategy(strategy);
              strategy.videoAnalyses.forEach(result => {
                  updateFileState(result.fileName, { status: 'analyzed', analysisResult: result, progress: 100, loadingMessage: 'Complete' });
              });
              // Mark any unprocessed files as errors if the API didn't return them
              setVideoFiles(prev => prev.map(f => (f.status === 'processing' && !strategy.videoAnalyses.some(va => va.fileName === f.id)) ? { ...f, status: 'error', error: 'AI analysis did not return results for this file.' } : f));
          } catch (err) {
              const errorMessage = formatErrorMessage(err);
              setError(`Campaign analysis failed: ${errorMessage}`);
              setVideoFiles(prev => prev.map(f => ({ ...f, status: 'error', error: errorMessage })));
          }
      }
      setIsProcessing(false);
  };
  
  const handleSelectFromDrive = async () => {
      const filesToDownload = Object.values(selectedDriveFiles) as MockDriveFile[];
      if (filesToDownload.length === 0) return;
      setIsDrivePickerOpen(false);
      setIsProcessing(true);
      
      // We can't show per-file progress for downloads, so we'll show a temp state
      const tempFiles = filesToDownload.map(f => ({ file: new File([], f.name), id: f.name, thumbnail: '', status: 'pending', loadingMessage: 'Downloading...' } as VideoFile));
      setVideoFiles(tempFiles);

      try {
          const downloadedFiles = await Promise.all(filesToDownload.map(df => googleDriveService.downloadFile(df)));
          await processAndAnalyzeFiles(downloadedFiles);
      } catch (err) {
          setError(formatErrorMessage(err));
          setIsProcessing(false);
      } finally {
          setSelectedDriveFiles({});
      }
  };

  const handleGenerateVariations = async () => {
    if (!campaignStrategy || !selectedAvatar) return;
    setIsProcessing(true);
    setError(null);
    setAdCreatives([]);
  
    try {
      const variations = await apiClient.generateCreatives(campaignBrief, selectedAvatar, campaignStrategy);
      const scores = await apiClient.rankCreatives(campaignBrief, selectedAvatar, variations);
      
      const annotated = variations.map((c, idx) => {
        const s = scores.find(x => x.index === idx);
        return { 
          ...c, 
          __roiScore: s?.roiScore ?? null, 
          __hookScore: s?.hookScore ?? null, 
          __ctaScore: s?.ctaScore ?? null, 
          __reasons: s?.reasons ?? '' 
        };
      });
  
      annotated.sort((a, b) => (b.__roiScore ?? 0) - (a.__roiScore ?? 0));
      setAdCreatives(annotated);
      document.getElementById('ad-blueprints-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setError(formatErrorMessage(err as Error));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = useCallback(() => {
    setVideoFiles([]);
    setAdCreatives([]);
    setCampaignStrategy(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  const handleOpenEditor = (creative: AdCreative) => {
    setSelectedCreative(creative);
    setIsEditorOpen(true);
  };
  
  const handleOpenCutter = (videoFile: File) => {
    setVideoForEditing(videoFile);
    setIsCutterOpen(true);
  }
  
   const handleOpenAdvancedEditor = (videoFile: File) => {
    setVideoForEditing(videoFile);
    setIsAdvancedEditorOpen(true);
  }

  return (
    <>
      {isEditorOpen && selectedCreative && (
        <VideoEditor adCreative={selectedCreative} sourceVideos={videoFiles.map(vf => vf.file)} onClose={() => setIsEditorOpen(false)} />
      )}
      {isCutterOpen && videoForEditing && (
        <AudioCutterDashboard sourceVideo={videoForEditing} onClose={() => setIsCutterOpen(false)}/>
      )}
      {isAdvancedEditorOpen && videoForEditing && (
        <AdvancedEditor sourceVideo={videoForEditing} onClose={() => setIsAdvancedEditorOpen(false)}/>
      )}

      {isDrivePickerOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700/50">
                  <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                      <h2 className="text-xl font-bold">Select Videos from Drive</h2>
                      <button onClick={() => setIsDrivePickerOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                  </header>
                  <div className="p-4 overflow-y-auto space-y-2">
                      {driveFiles.map(file => (
                          <div key={file.id} onClick={() => handleDriveFileToggle(file)} className={`flex items-center gap-4 p-2 rounded-lg cursor-pointer transition-colors ${selectedDriveFiles[file.id] ? 'bg-indigo-600/30' : 'hover:bg-gray-700/50'}`}>
                              <img src={file.thumbnailLink} alt={file.name} className="w-20 h-12 object-cover rounded"/>
                              <div className="flex-grow">
                                  <span className="font-semibold">{file.name}</span>
                              </div>
                              {selectedDriveFiles[file.id] && <CheckIcon className="w-6 h-6 text-indigo-400 flex-shrink-0"/>}
                          </div>
                      ))}
                  </div>
                  <footer className="p-4 border-t border-gray-700 flex gap-4">
                      <button onClick={handleSelectFromDrive} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">
                          Select {Object.keys(selectedDriveFiles).length} Files
                      </button>
                      <button onClick={() => {
                          // Smart Scan Simulation: Select first 3 files automatically
                          const newSelection: Record<string, MockDriveFile> = {};
                          driveFiles.slice(0, 3).forEach(f => newSelection[f.id] = f);
                          setSelectedDriveFiles(newSelection);
                          // Then trigger download automatically after a short delay to show selection
                          setTimeout(handleSelectFromDrive, 500);
                      }} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                          <SparklesIcon className="w-5 h-5"/> Smart Scan & Analyze
                      </button>
                  </footer>
              </div>
          </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex justify-between items-center">
          <span><strong>Error:</strong> {error}</span>
          <button onClick={() => setError(null)} className="font-bold text-xl px-2 hover:text-white transition-colors">&times;</button>
        </div>
      )}

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</span>
            Provide Campaign Context
          </h2>
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700/50">
             <CampaignBriefForm 
                brief={campaignBrief} 
                setBrief={setCampaignBrief}
                avatars={avatars}
                selectedAvatar={selectedAvatar}
                setSelectedAvatar={setSelectedAvatar}
              />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</span>
            Select Video Asset Pool
          </h2>
          {videoFiles.length === 0 ? (
            <FileUploadZone
              onFilesSelected={processAndAnalyzeFiles}
              onConnectDrive={handleConnectDrive}
              isConnecting={isConnecting}
              isDisabled={isProcessing}
            />
          ) : (
             <div className="space-y-4">
               {videoFiles.map(vf => (
                   <AnalysisResultCard 
                        key={vf.id} 
                        videoFile={vf} 
                        onGenerateBlueprints={handleGenerateVariations}
                        onOpenCutter={() => handleOpenCutter(vf.file)}
                        onOpenAdvancedEditor={() => handleOpenAdvancedEditor(vf.file)}
                    />
               ))}
            </div>
          )}
        </div>
        
        {campaignStrategy && (
            <div className="bg-gray-900/50 p-6 rounded-lg border border-indigo-500/50 animate-fade-in">
              <h3 className="text-lg font-bold text-indigo-400 mb-4">Winning Ad Strategy</h3>
              <div className="space-y-4">
                  <p><strong className="text-gray-400">Strategy Summary:</strong> {campaignStrategy.summary}</p>
                  <p><strong className="text-gray-400">Key Angles:</strong> {campaignStrategy.keyAngles.join(', ') || 'None'}</p>
                  <p><strong className="text-gray-400">Risks to Avoid:</strong> {campaignStrategy.risksToAvoid.join(', ') || 'None'}</p>
                  
                  <button disabled={isProcessing || !selectedAvatar} onClick={handleGenerateVariations} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all text-lg mt-4 disabled:bg-gray-600 disabled:cursor-not-allowed">
                      <SparklesIcon className="w-6 h-6"/> Generate Ad Blueprints
                  </button>
              </div>
            </div>
        )}

        {adCreatives.length > 0 && (
          <div className="pt-8 border-t border-gray-700 animate-fade-in" id="ad-blueprints-section">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</span>
              Your AI-Generated Ad Blueprints
            </h2>
            <div className="grid lg:grid-cols-2 gap-8">
              {adCreatives.map((ad, i) => (
                <AdCreativeCard
                  key={i}
                  adCreative={ad}
                  isTop={i < 3}
                  onCreateVideo={() => handleOpenEditor(ad)}
                  videoFiles={videoFiles}
                />
              ))}
            </div>
          </div>
        )}

        {videoFiles.length > 0 && (
          <div className="mt-8 text-center border-t border-gray-700 pt-6">
            <button onClick={handleReset} className="text-gray-400 hover:text-white underline transition-colors">
              Reset Workspace
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default AdWorkflow;