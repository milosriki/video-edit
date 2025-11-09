
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeAndRankVideos, generateAdCreatives } from './services/geminiService';
import { extractFramesFromVideo, generateVideoThumbnail } from './utils/video';
import { AdCreative, VideoFile, VideoAnalysisResult } from './types';
import { WandIcon, ClipboardIcon, CheckIcon, UploadIcon, FilmIcon, ScissorsIcon } from './components/icons';
import VideoPlayer from './components/VideoPlayer';
import VideoEditor from './components/VideoEditor';
import AnalysisResultCard from './components/AnalysisResultCard';
import AudioCutterDashboard from './components/AudioCutterDashboard';


enum Stage {
  Initial,
  VideosSelected,
  Analyzing,
  Ranked,
  Generating,
  AdsReady,
}

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
            className="p-2 rounded-md hover:bg-indigo-500 text-gray-300 hover:text-white transition-colors absolute top-2 right-2"
        >
            {copiedField === field ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
        </button>
    );

    return (
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700/50 flex flex-col">
            <div className='p-6 bg-gray-800'>
              <h4 className="text-lg font-bold text-indigo-400">{adCreative.variationTitle}</h4>
              <div className="relative bg-gray-900/50 p-4 rounded-md border border-gray-700 mt-4">
                  <label className="text-xs font-semibold text-gray-400">HEADLINE</label>
                  <p className="text-lg text-white font-semibold mt-1">{adCreative.headline}</p>
                  {renderCopyButton(adCreative.headline, `headline-${index}`)}
              </div>
              <div className="relative bg-gray-900/50 p-4 rounded-md border border-gray-700 mt-2">
                  <label className="text-xs font-semibold text-gray-400">BODY</label>
                  <p className="text-base text-gray-300 mt-1">{adCreative.body}</p>
                  {renderCopyButton(adCreative.body, `body-${index}`)}
              </div>
              <div className="relative bg-gray-900/50 p-4 rounded-md border border-gray-700 mt-2">
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
                <button onClick={onCreateVideo} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all">
                    <WandIcon className="w-5 h-5"/>
                    Create Video
                </button>
            </div>
        </div>
    );
};

export default function App() {
  const [stage, setStage] = useState<Stage>(Stage.Initial);
  const [selectedFiles, setSelectedFiles] = useState<VideoFile[]>([]);
  const [analysisResults, setAnalysisResults] = useState<VideoAnalysisResult[]>([]);
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([]);
  const [productInfo, setProductInfo] = useState<string>('A premium online personal training service for busy professionals, focusing on customized workout plans, nutrition coaching, and accountability to achieve significant fitness results.');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [topVideoUrl, setTopVideoUrl] = useState<string | null>(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCutterOpen, setIsCutterOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<AdCreative | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
        if (topVideoUrl) {
            URL.revokeObjectURL(topVideoUrl);
        }
    };
  }, [topVideoUrl]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setLoadingMessage('Processing thumbnails...');
    setError(null);

    try {
      const videoFilesPromises = Array.from(files)
        .filter((file: File) => file.type.startsWith('video/'))
        .map(async (file: File) => {
          try {
            const thumbnail = await generateVideoThumbnail(file);
            return { file, id: file.name, thumbnail };
          } catch (thumbError) {
            console.error(`Could not generate thumbnail for ${file.name}:`, thumbError);
            if (thumbError instanceof Error) {
               setError(`Failed thumbnail for ${file.name}: ${thumbError.message}`);
            }
            return null;
          }
        });
      
      const processedResults = await Promise.allSettled(videoFilesPromises);
      const successfulFiles = processedResults
        .filter((r): r is PromiseFulfilledResult<VideoFile> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value);
      
      const failedCount = processedResults.length - successfulFiles.length;
      if (failedCount > 0) {
        setError(`Could not process ${failedCount} video(s). They may be corrupted or in an unsupported format.`);
      }

      setSelectedFiles(prevFiles => {
         const existingIds = new Set(prevFiles.map(f => f.id));
         const uniqueNewFiles = successfulFiles.filter(f => !existingIds.has(f.id));
         return [...prevFiles, ...uniqueNewFiles];
      });

      if (successfulFiles.length > 0) {
        setStage(Stage.VideosSelected);
      } else if (processedResults.length > 0) {
        throw new Error("None of the selected videos could be processed.");
      }

    } catch (err) {
       if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while processing thumbnails.");
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };


  const handleAnalyzeAndRank = async () => {
    if (selectedFiles.length === 0) return;
    setIsLoading(true);
    setStage(Stage.Analyzing);
    setError(null);
    if (topVideoUrl) {
      URL.revokeObjectURL(topVideoUrl);
      setTopVideoUrl(null);
    }

    try {
      const videoFrameData = await Promise.all(
        selectedFiles.map(async (videoFile, index) => {
          setLoadingMessage(`Extracting frames from video ${index + 1}/${selectedFiles.length}...`);
          const frames = await extractFramesFromVideo(videoFile.file, 8);
          return { videoFile, frames };
        })
      );
      
      setLoadingMessage('AI is analyzing and ranking your videos...');
      const results = await analyzeAndRankVideos(videoFrameData);
      results.sort((a, b) => a.rank - b.rank);
      setAnalysisResults(results);
      
      if (results.length > 0) {
          setLoadingMessage('Loading top-ranked video...');
          const topVideoName = results[0].fileName;
          const topVideoFile = selectedFiles.find(f => f.file.name === topVideoName);
          if (topVideoFile) {
            const url = URL.createObjectURL(topVideoFile.file);
            setTopVideoUrl(url);
          }
      }

      setStage(Stage.Ranked);

    } catch (err) {
      if (err instanceof Error) {
         if (err.message.includes("API key is not configured")) {
           setError("The Gemini API key is not configured. Please contact the administrator.");
         } else {
           setError(err.message);
         }
      } else {
        setError('An unknown error occurred during analysis.');
      }
      setStage(Stage.VideosSelected);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateVariations = async () => {
    const topVideoResult = analysisResults[0];
    if (!topVideoResult || !productInfo) return;
    
    setIsLoading(true);
    setStage(Stage.Generating);
    setError(null);
    setLoadingMessage('AI is crafting your ad blueprints...');

    try {
        const variations = await generateAdCreatives(topVideoResult, productInfo);
        setAdCreatives(variations);
        setStage(Stage.AdsReady);
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
        setStage(Stage.Ranked);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };
  
  const handleReset = useCallback(() => {
    setSelectedFiles([]);
    setAnalysisResults([]);
    setAdCreatives([]);
    setError(null);
    if (topVideoUrl) {
      URL.revokeObjectURL(topVideoUrl);
      setTopVideoUrl(null);
    }
    setStage(Stage.Initial);
  }, [topVideoUrl]);

  const topRankedFile = analysisResults.length > 0
    ? selectedFiles.find(f => f.file.name === analysisResults[0].fileName)
    : null;

  const handleOpenEditor = (creative: AdCreative) => {
    setSelectedCreative(creative);
    setIsEditorOpen(true);
  };
  
  const toggleAnalysisExpansion = (fileName: string) => {
    setExpandedAnalysis(prev => (prev === fileName ? null : fileName));
  };

  return (
    <>
      {isEditorOpen && selectedCreative && topRankedFile && (
        <VideoEditor
          adCreative={selectedCreative}
          sourceVideo={topRankedFile.file}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
      {isCutterOpen && topRankedFile && (
        <AudioCutterDashboard
          sourceVideo={topRankedFile.file}
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
              Analyze, edit, and generate complete video ad blueprints with a powerful AI strategist.
            </p>
          </header>

          {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex justify-between items-center">
                  <span><strong>Error:</strong> {error}</span>
                  <button onClick={() => setError(null)} className="font-bold text-xl px-2">&times;</button>
              </div>
          )}

          <div className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm border border-gray-700/50">
              {isLoading && <Spinner text={loadingMessage} />}

              {!isLoading && (
                  <div className="space-y-8">
                      
                      <div>
                          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</span>
                            Select Videos {selectedFiles.length > 0 && `(${selectedFiles.length})`}
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
                              <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all text-lg">
                                <UploadIcon className="w-6 h-6" />
                                Select from Device
                              </button>
                          </div>
                          {selectedFiles.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
                                  {selectedFiles.map(file => (
                                      <div key={file.id} className="bg-gray-900/50 rounded-lg p-2 text-center text-sm">
                                          <img src={file.thumbnail} alt={file.file.name} className="w-full h-24 object-cover rounded-md mb-2"/>
                                          <p className="truncate text-gray-300">{file.file.name}</p>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>

                      
                      {stage >= Stage.VideosSelected && (
                          <div>
                              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</span>
                                AI Deep Analysis & Ranking
                              </h2>
                              <button onClick={handleAnalyzeAndRank} disabled={selectedFiles.length === 0} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-green-900/80 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all text-lg">
                                  <WandIcon className="w-6 h-6"/>
                                  Start AI Analysis
                              </button>
                          </div>
                      )}

                      
                      {stage >= Stage.Ranked && analysisResults.length > 0 && topRankedFile && (
                          <div>
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                              <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</span>
                              Workspace: "{topRankedFile.file.name}"
                            </h2>
                            <div className="grid lg:grid-cols-2 gap-8">
                                <div>
                                    {topVideoUrl && <VideoPlayer src={topVideoUrl} />}
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button onClick={() => setIsCutterOpen(true)} className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors">
                                            <div className="flex items-center gap-3">
                                                <ScissorsIcon className="w-8 h-8 text-indigo-400"/>
                                                <div>
                                                    <p className="font-bold text-white">Open Smart Cutter</p>
                                                    <p className="text-sm text-gray-400">Edit video by removing silence or using keywords.</p>
                                                </div>
                                            </div>
                                        </button>
                                        <div className="mt-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg sm:col-span-2">
                                            <p className="font-semibold text-lg mb-2">Generate Ad Blueprints</p>
                                            <textarea
                                                value={productInfo}
                                                onChange={(e) => setProductInfo(e.target.value)}
                                                placeholder="Tell the AI about your product/service..."
                                                className="w-full p-3 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition h-28"
                                            />
                                            <button onClick={handleGenerateVariations} disabled={!productInfo.trim()} className="mt-4 w-full sm:w-auto bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/80 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all text-lg">
                                                <WandIcon className="w-6 h-6"/>
                                                Generate Ad Blueprints
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold">AI Ranking & Analysis</h3>
                                    {analysisResults.map(result => (
                                        <AnalysisResultCard 
                                            key={result.fileName} 
                                            result={result} 
                                            thumbnail={selectedFiles.find(f => f.file.name === result.fileName)?.thumbnail || ''}
                                            isExpanded={expandedAnalysis === result.fileName}
                                            onToggleExpand={() => toggleAnalysisExpansion(result.fileName)}
                                        />
                                    ))}
                                </div>
                            </div>
                          </div>
                      )}
                      
                      {stage === Stage.AdsReady && adCreatives.length > 0 && (
                          <div>
                              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">4</span>
                                Your AI-Generated Ad Blueprints
                              </h2>
                              <div className="grid lg:grid-cols-2 gap-8">
                                  {adCreatives.map((ad, i) => (
                                      <AdCreativeCard 
                                        key={i} 
                                        adCreative={ad} 
                                        index={i} 
                                        onCreateVideo={() => handleOpenEditor(ad)}
                                      />
                                  ))}
                              </div>
                          </div>
                      )}

                      {stage > Stage.Initial && (
                          <div className="mt-8 text-center border-t border-gray-700 pt-6">
                              <button onClick={handleReset} className="text-gray-400 hover:text-white underline transition-colors">
                                  Start Over
                              </button>
                          </div>
                      )}
                  </div>
              )}
          </div>
        </main>
        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by Google Gemini & FFmpeg</p>
        </footer>
      </div>
    </>
  );
}