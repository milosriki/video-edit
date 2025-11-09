import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeAndRankVideos, generateAdCreatives } from './services/geminiService';
import { extractFramesFromVideo, generateVideoThumbnail } from './utils/video';
import { AdCreative, VideoFile, VideoAnalysisResult, ProcessingStatus } from './types';
import { WandIcon, ClipboardIcon, CheckIcon, UploadIcon, FilmIcon, ScissorsIcon } from './components/icons';
import VideoPlayer from './components/VideoPlayer';
import VideoEditor from './components/VideoEditor';
import AnalysisResultCard from './components/AnalysisResultCard';
import AudioCutterDashboard from './components/AudioCutterDashboard';

// --- Reusable Components ---

const Spinner: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800/50 rounded-lg">
    <svg className="animate-spin h-10 w-10 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-lg font-semibold text-gray-300">{text}</p>
    <p className="text-sm text-gray-400">This may take a few moments...</p>
  </div>
);

const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`transition-all duration-700 ease-in-out ${className} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {children}
    </div>
  );
};

const AdCreativeCard: React.FC<{ adCreative: AdCreative; index: number; onCreateVideo: () => void; }> = ({ adCreative, index, onCreateVideo }) => {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };
    
    const renderCopyButton = (text: string, field: string) => (
        <button
            onClick={() => copyToClipboard(text, field)}
            aria-label={`Copy ${field}`}
            className="p-2 rounded-md hover:bg-indigo-500 text-gray-300 hover:text-white transition-colors absolute top-2 right-2 opacity-0 group-hover:opacity-100"
        >
            {copiedField === field ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
        </button>
    );

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700/50 flex flex-col transition-all duration-300 hover:shadow-xl hover:border-indigo-500/50 hover:scale-[1.02]">
            <div className='p-6 bg-gray-800'>
              <h4 className="text-lg font-bold text-indigo-400">{adCreative.variationTitle}</h4>
              <div className="relative bg-gray-900/50 p-4 rounded-md border border-gray-700 mt-4 group">
                  <label className="text-xs font-semibold text-gray-400">HEADLINE</label>
                  <p className="text-lg text-white font-semibold mt-1">{adCreative.headline}</p>
                  {renderCopyButton(adCreative.headline, `headline-${index}`)}
              </div>
              <div className="relative bg-gray-900/50 p-4 rounded-md border border-gray-700 mt-2 group">
                  <label className="text-xs font-semibold text-gray-400">BODY</label>
                  <p className="text-base text-gray-300 mt-1">{adCreative.body}</p>
                  {renderCopyButton(adCreative.body, `body-${index}`)}
              </div>
              <div className="relative bg-gray-900/50 p-4 rounded-md border border-gray-700 mt-2 group">
                  <label className="text-xs font-semibold text-gray-400">CALL TO ACTION</label>
                  <p className="text-lg text-indigo-300 font-bold mt-1 tracking-wider">{adCreative.cta}</p>
                  {renderCopyButton(adCreative.cta, `cta-${index}`)}
              </div>
            </div>

            <div className="bg-gray-900/50 p-6 border-t border-indigo-500/30 flex-grow">
                <h5 className="text-base font-bold text-gray-300 mb-4 flex items-center gap-2">
                    <FilmIcon className="w-5 h-5 text-indigo-400"/>
                    Editing Blueprint
                </h5>
                <div className="space-y-4 text-sm max-h-60 overflow-y-auto pr-2">
                    {adCreative.editPlan.map((scene, sceneIndex) => (
                        <div key={sceneIndex} className="flex gap-4">
                            <div className="font-mono text-indigo-400 whitespace-nowrap">{scene.timestamp}</div>
                            <div className="border-l-2 border-gray-700 pl-4">
                                <p><strong className="text-gray-400">Visual:</strong> {scene.visual}</p>
                                <p><strong className="text-gray-400">Edit:</strong> {scene.edit}</p>
                                {scene.overlayText !== 'N/A' && <p><strong className="text-gray-400">Text:</strong> "{scene.overlayText}"</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-4 bg-gray-800 border-t border-gray-700/50">
                <button onClick={onCreateVideo} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-105 transform hover:brightness-110">
                    <WandIcon className="w-5 h-5"/>
                    Create Video
                </button>
            </div>
        </div>
    );
};

// --- Main App Component (Parallel Processing Version) ---
export default function App() {
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([]);
  const [productInfo, setProductInfo] = useState<string>('A premium online personal training service for busy professionals, focusing on customized workout plans, nutrition coaching, and accountability to achieve significant fitness results.');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For global loading like ad generation
  const [loadingMessage, setLoadingMessage] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCutterOpen, setIsCutterOpen] = useState(false);
  
  // Payloads for Modals
  const [selectedCreative, setSelectedCreative] = useState<AdCreative | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    const newVideoFiles: VideoFile[] = [];

    // Create placeholder files
    for (const file of Array.from(files)) {
      if (file.type.startsWith('video/')) {
        newVideoFiles.push({
          file: file,
          id: file.name,
          thumbnail: '',
          status: 'pending',
          analysisResult: null
        });
      }
    }
    
    // Set placeholders immediately
    setVideoFiles(prev => [...prev, ...newVideoFiles]);

    // Process each new file
    for (const videoFile of newVideoFiles) {
      // 1. Update status to processing thumbnail
      setVideoFiles(prev => prev.map(f => f.id === videoFile.id ? { ...f, status: 'processing' } : f));
      
      try {
        // 2. Generate Thumbnail
        const thumbnail = await generateVideoThumbnail(videoFile.file);
        setVideoFiles(prev => prev.map(f => f.id === videoFile.id ? { ...f, thumbnail: thumbnail } : f));

        // 3. Extract Frames
        const frames = await extractFramesFromVideo(videoFile.file, 8);
        
        // 4. Get AI Analysis
        // We pass 'frames' as a one-item array to the existing 'analyzeAndRankVideos'
        // which returns an array of results. We expect one result back.
        const analysis = await analyzeAndRankVideos([{ videoFile, frames }]);
        
        // 5. Mark as Analyzed
        setVideoFiles(prev => prev.map(f => f.id === videoFile.id ? { 
          ...f, 
          status: 'analyzed',
          analysisResult: analysis[0] // Add the analysis result to the file
        } : f));

      } catch (err) {
        console.error(`Failed to process ${videoFile.id}:`, err);
        setVideoFiles(prev => prev.map(f => f.id === videoFile.id ? { ...f, status: 'error' } : f));
        if (err instanceof Error) {
          setError(`Failed to process ${videoFile.id}: ${err.message}`);
        } else {
          setError(`An unknown error occurred while processing ${videoFile.id}.`);
        }
      }
    }
    
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear input after processing
    }
  };

  const handleGenerateVariations = async (videoFile: VideoFile) => {
    if (!videoFile.analysisResult || !productInfo) return;
    
    setIsLoading(true);
    setError(null);
    setLoadingMessage('AI is crafting your ad blueprints...');

    try {
        const variations = await generateAdCreatives(videoFile.analysisResult, productInfo);
        setAdCreatives(variations);
        // Scroll to the blueprints section
        document.getElementById('ad-blueprints-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        if (err instanceof Error) {
         if (err.message.includes("API key is not configured")) {
           setError("The Gemini API key is not configured. Please contact the administrator.");
         } else {
           setError(err.message);
         }
      } else {
        setError('Failed to generate ad variations.');
      }
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };
  
  const handleReset = useCallback(() => {
    setVideoFiles([]);
    setAdCreatives([]);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleOpenEditor = (creative: AdCreative, videoFile: File) => {
    setSelectedCreative(creative);
    setSelectedVideoFile(videoFile);
    setIsEditorOpen(true);
  };

  const handleOpenCutter = (videoFile: File) => {
    setSelectedVideoFile(videoFile);
    setIsCutterOpen(true);
  };
  
  // Sort videos by status: processing, then analyzed (by rank), then pending, then error
  const sortedVideoFiles = [...videoFiles].sort((a, b) => {
    if (a.status === 'processing' && b.status !== 'processing') return -1;
    if (a.status !== 'processing' && b.status === 'processing') return 1;

    if (a.status === 'analyzed' && b.status !== 'analyzed') return -1;
    if (a.status !== 'analyzed' && b.status === 'analyzed') return 1;

    if (a.status === 'analyzed' && b.status === 'analyzed') {
      return (a.analysisResult?.rank || 99) - (b.analysisResult?.rank || 99);
    }
    
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;

    return 0; // Keep same order for errors or same status
  });

  return (
    <>
      {isEditorOpen && selectedCreative && selectedVideoFile && (
        <VideoEditor
          adCreative={selectedCreative}
          sourceVideo={selectedVideoFile}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
      {isCutterOpen && selectedVideoFile && (
        <AudioCutterDashboard
          sourceVideo={selectedVideoFile}
          onClose={() => setIsCutterOpen(false)}
        />
      )}
      <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <main className="w-full max-w-7xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              AI Video Command Center
            </h1>
            <p className="mt-3 text-lg text-gray-400 max-w-3xl mx-auto">
              A unified dashboard for AI-powered video analysis, smart editing, and ad creation.
            </p>
          </header>

          {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex justify-between items-center transition-all duration-300 ease-in-out">
                  <span><strong>Error:</strong> {error}</span>
                  <button onClick={() => setError(null)} className="font-bold text-xl px-2 hover:text-white transition-colors">&times;</button>
              </div>
          )}

          <div className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm border border-gray-700/50">
              <div className="space-y-8">
                  
                  {/* --- STEP 1: SELECT VIDEOS --- */}
                  <AnimatedSection>
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <span className={`bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-800`}>1</span>
                          Select Videos
                        </h2>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            accept="video/*"
                            className="hidden"
                        />
                        <div className="flex flex-wrap gap-4">
                            <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all text-lg transform hover:scale-105 hover:brightness-110">
                              <UploadIcon className="w-6 h-6" />
                              Select from Device
                            </button>
                        </div>
                    </div>
                  </AnimatedSection>

                  
                  {/* --- STEP 2: AI WORKSPACE --- */}
                  {videoFiles.length > 0 && (
                      <AnimatedSection>
                        <div>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                              <span className={`bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-800`}>2</span>
                              AI Workspace
                            </h2>
                            <div className="space-y-6">
                                {sortedVideoFiles.map(videoFile => (
                                    <AnalysisResultCard 
                                        key={videoFile.id} 
                                        videoFile={videoFile}
                                        onGenerateBlueprints={() => handleGenerateVariations(videoFile)}
                                        onOpenCutter={() => handleOpenCutter(videoFile.file)}
                                    />
                                ))}
                            </div>
                        </div>
                      </AnimatedSection>
                  )}
                  
                  {/* --- STEP 3: AD BLUEPRINTS --- */}
                  {isLoading && <Spinner text={loadingMessage} />}
                  
                  {!isLoading && adCreatives.length > 0 && (
                      <AnimatedSection className="pt-8 border-t border-gray-700" id="ad-blueprints-section">
                        <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                              <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-800">3</span>
                              Your AI-Generated Ad Blueprints
                            </h2>
                            <div className="mb-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                                <label htmlFor="productInfo" className="block text-sm font-medium text-gray-300 mb-2">Product Information (Edit to regenerate)</label>
                                <textarea
                                    id="productInfo"
                                    value={productInfo}
                                    onChange={(e) => setProductInfo(e.target.value)}
                                    placeholder="Tell the AI about your product/service..."
                                    className="w-full p-3 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition h-28"
                                />
                                <p className="text-xs text-gray-400 mt-2">Click "Generate Ad Blueprints" on any video card to update these results with new info.</p>
                            </div>
                            <div className="grid lg:grid-cols-2 gap-8">
                                {adCreatives.map((ad, i) => (
                                    <AdCreativeCard 
                                      key={i} 
                                      adCreative={ad} 
                                      index={i} 
                                      onCreateVideo={() => {
                                        // Find the video file this ad was generated from
                                        const sourceFile = videoFiles.find(f => f.analysisResult?.fileName === ad.sourceFileName)?.file;
                                        if (sourceFile) {
                                          handleOpenEditor(ad, sourceFile);
                                        } else {
                                          setError("Could not find the original source video for this ad creative.");
                                        }
                                      }}
                                    />
                                ))}
                            </div>
                        </div>
                      </AnimatedSection>
                  )}

                  {videoFiles.length > 0 && (
                      <div className="mt-8 text-center border-t border-gray-700 pt-6">
                          <button onClick={handleReset} className="text-gray-400 hover:text-white underline transition-colors">
                              Reset Workspace
                          </button>
                      </div>
                  )}
              </div>
          </div>
        </main>
        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by Google Gemini & FFmpeg</p>
        </footer>
      </div>
    </>
  );
}