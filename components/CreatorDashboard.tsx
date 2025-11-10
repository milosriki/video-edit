
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeAndRankVideos, generateAdCreatives } from '../services/geminiService';
import { extractFramesFromVideo, generateVideoThumbnail } from '../utils/video';
import { AdCreative, VideoFile } from '../types';
import { WandIcon, ClipboardIcon, CheckIcon, UploadIcon, FilmIcon, ScissorsIcon, ShareIcon } from './icons';
import VideoEditor from './VideoEditor';
import AnalysisResultCard from './AnalysisResultCard';
import AudioCutterDashboard from './AudioCutterDashboard';
import { formatErrorMessage } from '../utils/error';
import { CreativeToOptimize } from '../App';

// Simple spinner used during async steps
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

// Fade-in section helper
const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className = '', id }) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div id={id} className={`transition-all duration-700 ease-in-out ${className} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  );
};

// Card to show a generated ad blueprint + copy helpers
const AdCreativeCard: React.FC<{ adCreative: AdCreative; index: number; onCreateVideo: () => void; }> = ({ adCreative, index, onCreateVideo }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyToClipboard = (text: string, field: string) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(ta);
  };

  const handleExportForFacebook = () => {
    // In a real implementation, you would:
    // 1. Check if the video has been rendered for this creative.
    // 2. If not, you might prompt the user to render it first.
    // 3. If it is rendered, get the video blob.
    // 4. Create a text file with the ad copy.
    // 5. Use a library like JSZip to create a zip file with the video and text file.
    // 6. Trigger a download of the zip file.
    
    const copyContent = `
Headline:
${adCreative.headline}

---

Body:
${adCreative.body}

---

Call to Action:
${adCreative.cta}
    `;
    
    alert(`Exporting Package for "${adCreative.variationTitle}"\n\nThis would download a .zip file containing:\n1. The rendered video file (e.g., ad_video.mp4)\n2. A text file with the following copy:\n\n${copyContent}`);
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
          <p className="text-base text-gray-300 mt-1 whitespace-pre-line">{adCreative.body}</p>
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
                {scene.overlayText && scene.overlayText.toLowerCase() !== 'n/a' && <p><strong className="text-gray-400">Text:</strong> "{scene.overlayText}"</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 bg-gray-800 border-t border-gray-700/50 flex items-center gap-3">
        <button onClick={onCreateVideo} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-105 transform hover:brightness-110">
          <WandIcon className="w-5 h-5"/>
          Create Video
        </button>
        <button onClick={handleExportForFacebook} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all">
          <ShareIcon className="w-5 h-5"/>
          Export for Facebook
        </button>
      </div>
    </div>
  );
};

interface CreatorDashboardProps {
    creativeToOptimize: CreativeToOptimize | null;
    onOptimizationComplete: () => void;
}

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({ creativeToOptimize, onOptimizationComplete }) => {
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [adCreatives, setAdCreatives] = useState<AdCreative[]>([]);
  const [productInfo, setProductInfo] = useState<string>('A premium online personal training service for busy professionals, focusing on customized workout plans, nutrition coaching, and accountability to achieve significant fitness results.');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCutterOpen, setIsCutterOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<AdCreative | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  useEffect(() => {
    if (creativeToOptimize) {
        const { adCreative, sourceVideoFile } = creativeToOptimize;
        // Check if the video is already in the workspace, if not, add it.
        const existingFile = videoFiles.find(vf => vf.id === sourceVideoFile.name);
        if (!existingFile) {
            const newVideoFile: VideoFile = {
                file: sourceVideoFile,
                id: sourceVideoFile.name,
                thumbnail: '', // We can generate this if needed, but for now skip for speed
                status: 'pending' // Or 'analyzed' if we assume it was
            };
            setVideoFiles(prev => [...prev, newVideoFile]);
        }
        
        handleOpenEditor(adCreative, sourceVideoFile);
        onOptimizationComplete(); // Clear the optimization job
    }
  }, [creativeToOptimize, onOptimizationComplete, videoFiles]);

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setError(null);

    const newVideoFiles: VideoFile[] = [];
    for (const file of Array.from(files)) {
      if (file.type.startsWith('video/') && !videoFiles.some(vf => vf.id === file.name)) {
        newVideoFiles.push({ file, id: file.name, thumbnail: '', status: 'pending' });
      }
    }

    if (newVideoFiles.length === 0) {
        return;
    }

    setVideoFiles(prev => [...prev, ...newVideoFiles]);

    try {
        const frameDataPromises = newVideoFiles.map(async (videoFile) => {
            // Generate thumbnail first for quick UI update
            const thumbnail = await generateVideoThumbnail(videoFile.file);
            setVideoFiles(prev => prev.map(f => f.id === videoFile.id ? { ...f, thumbnail, status: 'processing' } : f));
            
            // Then extract frames
            const frames = await extractFramesFromVideo(videoFile.file, 8);
            return { videoFile: { ...videoFile, thumbnail }, frames };
        });

        const videoFrameData = await Promise.all(frameDataPromises);
        
        setLoadingMessage('AI is analyzing videos...');
        setIsLoading(true);
        
        const analysisResults = await analyzeAndRankVideos(videoFrameData);
        
        setVideoFiles(prev => {
            return prev.map(currentFile => {
                const result = analysisResults.find(res => res.fileName === currentFile.id);
                // Only update files that were part of this batch
                if (newVideoFiles.some(nvf => nvf.id === currentFile.id)) {
                    if (result) {
                        return { ...currentFile, status: 'analyzed', analysisResult: result };
                    }
                    return { ...currentFile, status: 'error', error: 'AI analysis did not return a result for this video.' };
                }
                return currentFile;
            });
        });

    } catch (err) {
        const errorMessage = formatErrorMessage(err);
        setError(errorMessage);
        setVideoFiles(prev => prev.map(f => newVideoFiles.some(nvf => nvf.id === f.id) ? { ...f, status: 'error', error: errorMessage } : f));
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [videoFiles]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    processFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleGenerateVariations = async (videoFile: VideoFile) => {
    if (!videoFile.analysisResult || !productInfo) return;
    setIsLoading(true);
    setError(null);
    setLoadingMessage('AI is crafting your ad blueprints...');
    try {
      const variations = await generateAdCreatives(videoFile.analysisResult, productInfo);
      const variationsWithSource = variations.map(v => ({ ...v, sourceFileName: videoFile.id }));
      setAdCreatives(variationsWithSource);
      document.getElementById('ad-blueprints-section')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
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

  const sortedVideoFiles = [...videoFiles].sort((a, b) => {
    const statusOrder = { processing: 1, analyzed: 2, pending: 3, error: 4 } as const;
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    if (a.status === 'analyzed' && b.status === 'analyzed') {
      return (a.analysisResult?.rank || 99) - (b.analysisResult?.rank || 99);
    }
    return 0;
  });

  return (
    <>
      {isEditorOpen && selectedCreative && selectedVideoFile && (
        <VideoEditor adCreative={selectedCreative} sourceVideo={selectedVideoFile} onClose={() => setIsEditorOpen(false)} />
      )}
      {isCutterOpen && selectedVideoFile && (
        <AudioCutterDashboard sourceVideo={selectedVideoFile} onClose={() => setIsCutterOpen(false)} />
      )}
      {error && (
        <AnimatedSection>
          <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg mb-6 flex justify-between items-center">
            <span><strong>Error:</strong> {error}</span>
            <button onClick={() => setError(null)} className="font-bold text-xl px-2 hover:text-white transition-colors">&times;</button>
          </div>
        </AnimatedSection>
      )}
      <div className="space-y-8">
        <AnimatedSection>
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-800">1</span>
              Select Videos
            </h2>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="video/*" className="hidden" />
            <div 
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-300 ${isDraggingOver ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/30'}`}
              >
                <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-semibold text-gray-300">Drag & drop videos here, or click to browse</p>
                <p className="text-sm text-gray-500 mt-2">Supports multiple video files</p>
            </div>
          </div>
        </AnimatedSection>

        {videoFiles.length > 0 && (
          <AnimatedSection>
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-800">2</span>
                AI Workspace
              </h2>
              <p className="text-gray-400 mb-6">Your videos are being analyzed. Tools will become available as each video is processed.</p>
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
                      const sourceFile = videoFiles.find(f => f.id === (ad as any).sourceFileName)?.file;
                      if (sourceFile) {
                        handleOpenEditor(ad, sourceFile);
                      } else {
                        setError(`Could not find the original source video (${(ad as any).sourceFileName}) for this ad creative. Please do not remove videos from the list after generating ads.`);
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
    </>
  );
};
