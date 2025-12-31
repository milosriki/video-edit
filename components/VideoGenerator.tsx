
import React, { useState, useEffect, useRef } from 'react';
import { generateVideo, understandVideo } from '../services/geminiService';
import { formatErrorMessage } from '../utils/error';
import { KeyIcon, UploadIcon, VideoIcon, DownloadIcon, SparklesIcon, VideoLibraryIcon } from './icons';
import { extractFramesFromVideo } from '../utils/video';
import VideoPlayer from './VideoPlayer';

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const VeoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A golden retriever puppy playing in a field of flowers, cinematic style.');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);

    useEffect(() => {
        (async () => {
            if (await window.aistudio.hasSelectedApiKey()) {
                setApiKeySelected(true);
            }
        })();
        return () => {
            if (outputUrl) URL.revokeObjectURL(outputUrl);
        };
    }, [outputUrl]);

    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            // Assume success to avoid race conditions, API call will validate
            setApiKeySelected(true);
        } catch (e) {
            console.error("Failed to open API key selector", e);
        }
    };
    
    const handleGenerate = async () => {
        if (!prompt && !imageFile) {
            setError("Please provide a prompt or an image to generate a video.");
            return;
        }
        setIsLoading(true);
        setError(null);
        if(outputUrl) URL.revokeObjectURL(outputUrl);
        setOutputUrl(null);
        setProgressMessage("Initializing...");

        try {
            const blob = await generateVideo(prompt, imageFile, aspectRatio, setProgressMessage);
            setOutputUrl(URL.createObjectURL(blob));
        } catch (err) {
            const errorMessage = formatErrorMessage(err);
             if (errorMessage.includes("Requested entity was not found.")) {
                setError("API Key validation failed. Please select a valid key.");
                setApiKeySelected(false);
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    if (!apiKeySelected) {
        return (
            <div className="text-center p-8 bg-gray-900/50 rounded-lg max-w-lg mx-auto">
                <KeyIcon className="w-12 h-12 text-indigo-400 mx-auto mb-4"/>
                <h3 className="text-xl font-bold mb-2">API Key Required for Veo</h3>
                <p className="text-gray-400 mb-4">Video generation with Veo is a powerful feature that requires you to select your own API key. Billing is associated with your key.</p>
                <p className="text-xs text-gray-500 mb-6">Learn more about billing at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">ai.google.dev/gemini-api/docs/billing</a></p>
                <button onClick={handleSelectKey} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all mx-auto">
                    <KeyIcon className="w-5 h-5"/>
                    Select API Key
                </button>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex justify-between items-center">
                    <span><strong>Error:</strong> {error}</span>
                    <button onClick={() => setError(null)} className="font-bold text-xl px-2 hover:text-white transition-colors">&times;</button>
                </div>
            )}
            <div className="space-y-4">
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
                    <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={3} className="w-full p-3 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Animate Image (Optional)</label>
                    <div className="flex items-center gap-4">
                        <label htmlFor="image-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                           <UploadIcon className="w-5 h-5"/> Select Image
                        </label>
                        <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        {imageFile && <span className="text-sm text-gray-400 truncate">{imageFile.name}</span>}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                     <div className="flex gap-2">
                        <button onClick={() => setAspectRatio('16:9')} className={`py-2 px-4 rounded-lg font-semibold ${aspectRatio === '16:9' ? 'bg-indigo-600' : 'bg-gray-700'}`}>Landscape (16:9)</button>
                        <button onClick={() => setAspectRatio('9:16')} className={`py-2 px-4 rounded-lg font-semibold ${aspectRatio === '9:16' ? 'bg-indigo-600' : 'bg-gray-700'}`}>Portrait (9:16)</button>
                    </div>
                </div>
                <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all text-lg">
                    {isLoading ? <><Spinner /> Generating...</> : <><VideoIcon className="w-6 h-6"/> Generate Video</>}
                </button>
            </div>

            {(isLoading || outputUrl) && (
                 <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Result</h3>
                     {isLoading && (
                        <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                             <p className="font-semibold text-indigo-400">{progressMessage}</p>
                             <div className="w-full bg-gray-700 rounded-full h-1 mt-2 overflow-hidden">
                                <div className="bg-indigo-500 h-1 rounded-full animate-pulse" style={{ width: `100%` }}></div>
                             </div>
                             <p className="text-xs text-gray-500 mt-2">Video generation can take several minutes. Please be patient.</p>
                        </div>
                    )}
                    {outputUrl && (
                        <div>
                             <VideoPlayer src={outputUrl} />
                             <div className="mt-4">
                               <a href={outputUrl} download={`veo_video_${Date.now()}.mp4`} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all">
                                  <DownloadIcon className="w-5 h-5"/>
                                  DOWNLOAD VEO CLIP
                                </a>
                             </div>
                        </div>
                    )}
                 </div>
            )}
        </div>
    );
}

const VideoAnalyzer: React.FC = () => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('Summarize this video. What are the key objects and actions?');
    const [isLoading, setIsLoading] = useState(false);
    const [progressMessage, setProgressMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (videoUrl) URL.revokeObjectURL(videoUrl);
        }
    }, [videoUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            if (videoUrl) URL.revokeObjectURL(videoUrl);
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            setAnalysisResult(null);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!videoFile) {
            setError("Please upload a video file first.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            setProgressMessage("Extracting frames...");
            const frames = await extractFramesFromVideo(videoFile, 15);
            setProgressMessage("Analyzing with Gemini Pro...");
            const result = await understandVideo(frames, prompt);
            setAnalysisResult(result);
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setIsLoading(false);
            setProgressMessage("");
        }
    };

    return (
        <div className="space-y-4">
            {error && <p className="text-red-400 text-sm p-3 bg-red-900/30 rounded-md">{error}</p>}

            <div className="w-full bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center p-4 min-h-[200px]">
                {videoUrl ? (
                    <VideoPlayer src={videoUrl} />
                ) : (
                    <p className="text-gray-400">Upload a video to analyze</p>
                )}
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                <UploadIcon className="w-5 h-5"/> {videoFile ? `Change Video: ${videoFile.name}` : 'Upload Video'}
            </button>

            <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={3}
                className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-lg"
                placeholder="What do you want to know about this video?"
            />

            <button onClick={handleAnalyze} disabled={isLoading || !videoFile} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                {isLoading ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
                Analyze Video
            </button>

            {isLoading && <div className="text-center p-4">{progressMessage}...</div>}

            {analysisResult && (
                <div className="p-4 bg-gray-900/50 rounded-md border border-gray-700 whitespace-pre-wrap text-gray-300">
                    <h4 className="font-bold text-gray-200 mb-2">Analysis Result</h4>
                    {analysisResult}
                </div>
            )}
        </div>
    );
};


const VideoStudio: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'generate' | 'analyze'>('generate');

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold">Video Studio</h2>
            <div className="flex gap-2 p-1 bg-gray-900/50 rounded-lg border border-gray-700">
                <button onClick={() => setActiveTab('generate')} className={`flex-1 p-2 rounded-md font-semibold flex items-center justify-center gap-2 ${activeTab === 'generate' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>
                    <SparklesIcon className="w-5 h-5"/> Generate
                </button>
                <button onClick={() => setActiveTab('analyze')} className={`flex-1 p-2 rounded-md font-semibold flex items-center justify-center gap-2 ${activeTab === 'analyze' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>
                    <VideoLibraryIcon className="w-5 h-5"/> Understand
                </button>
            </div>
             <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 min-h-[400px]">
                {activeTab === 'generate' && <VeoGenerator />}
                {activeTab === 'analyze' && <VideoAnalyzer />}
            </div>
        </div>
    );
}

export default VideoStudio;
