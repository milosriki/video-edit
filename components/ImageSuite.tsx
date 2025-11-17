import React, { useState, useRef } from 'react';
import { generateImage, editImage, analyzeImage } from '../services/geminiService';
import { formatErrorMessage } from '../utils/error';
import { UploadIcon, ImageIcon, SparklesIcon } from './icons';

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A cinematic shot of a futuristic city skyline at dusk, with flying vehicles.');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('16:9');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);
    const [outputImage, setOutputImage] = useState<string|null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setOutputImage(null);
        try {
            const imageUrl = await generateImage(prompt, aspectRatio);
            setOutputImage(imageUrl);
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-4">
             {error && <p className="text-red-400 text-sm p-3 bg-red-900/30 rounded-md">{error}</p>}
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2} className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-lg" placeholder="Enter a prompt..."/>
            <div className="flex flex-wrap gap-2">
                {(['16:9', '9:16', '1:1', '4:3', '3:4'] as const).map(ar => (
                    <button key={ar} onClick={() => setAspectRatio(ar)} className={`px-3 py-1 text-sm rounded-md ${aspectRatio === ar ? 'bg-indigo-600' : 'bg-gray-600'}`}>{ar}</button>
                ))}
            </div>
            <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                {isLoading ? <Spinner /> : <SparklesIcon className="w-5 h-5"/>} Generate Image
            </button>
            {isLoading && <div className="text-center p-4">Generating image...</div>}
            {outputImage && <img src={outputImage} alt="Generated image" className="rounded-lg w-full"/>}
        </div>
    );
};

const ImageEditor: React.FC = () => {
    const [prompt, setPrompt] = useState('Add a small, tasteful logo in the bottom right corner.');
    const [imageFile, setImageFile] = useState<File|null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);
    const [outputImage, setOutputImage] = useState<string|null>(null);
    const [previewUrl, setPreviewUrl] = useState<string|null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    }
    
    const handleEdit = async () => {
        if (!imageFile) {
            setError("Please upload an image to edit.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setOutputImage(null);
        try {
            const imageUrl = await editImage(imageFile, prompt);
            setOutputImage(imageUrl);
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-4">
             {error && <p className="text-red-400 text-sm p-3 bg-red-900/30 rounded-md">{error}</p>}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="w-full aspect-video bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                    {previewUrl ? <img src={previewUrl} className="max-h-full max-w-full object-contain rounded-md"/> : <span className="text-gray-400">Upload an image</span>}
                </div>
                <div className="w-full aspect-video bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                    {isLoading ? <Spinner/> : outputImage ? <img src={outputImage} className="max-h-full max-w-full object-contain rounded-md"/> : <span className="text-gray-400">Edited image will appear here</span>}
                </div>
            </div>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
             <button onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                <UploadIcon className="w-5 h-5"/> {imageFile ? `Change Image: ${imageFile.name}` : 'Upload Image'}
             </button>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2} className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-lg" placeholder="Describe your edit..."/>
            <button onClick={handleEdit} disabled={isLoading || !imageFile} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                {isLoading ? <Spinner /> : <SparklesIcon className="w-5 h-5"/>} Apply Edit
            </button>
        </div>
    );
};

const ImageAnalyzer: React.FC = () => {
    const [prompt, setPrompt] = useState('Analyze this image from the perspective of a marketing expert for a social media ad. What are its strengths and weaknesses?');
    const [imageFile, setImageFile] = useState<File|null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);
    const [analysisResult, setAnalysisResult] = useState<string|null>(null);
    const [previewUrl, setPreviewUrl] = useState<string|null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    }
    
    const handleAnalyze = async () => {
        if (!imageFile) {
            setError("Please upload an image to analyze.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        try {
            const result = await analyzeImage(imageFile, prompt);
            setAnalysisResult(result);
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-4">
            {error && <p className="text-red-400 text-sm p-3 bg-red-900/30 rounded-md">{error}</p>}
            <div className="w-full h-64 bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center mb-4">
                {previewUrl ? <img src={previewUrl} className="max-h-full max-w-full object-contain rounded-md"/> : <span className="text-gray-400">Upload an image</span>}
            </div>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
             <button onClick={() => fileInputRef.current?.click()} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                 <UploadIcon className="w-5 h-5"/> {imageFile ? `Change Image: ${imageFile.name}` : 'Upload Image'}
             </button>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2} className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-lg" placeholder="What do you want to analyze?"/>
            <button onClick={handleAnalyze} disabled={isLoading || !imageFile} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                {isLoading ? <Spinner /> : <SparklesIcon className="w-5 h-5"/>} Analyze Image
            </button>
            {isLoading && <div className="text-center p-4">Analyzing...</div>}
            {analysisResult && <div className="p-4 bg-gray-900/50 rounded-md border border-gray-700 whitespace-pre-wrap text-gray-300">{analysisResult}</div>}
        </div>
    );
};


const ImageSuite: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'analyze'>('generate');

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold">Image Studio</h2>
            <div className="flex gap-2 p-1 bg-gray-900/50 rounded-lg border border-gray-700">
                <button onClick={() => setActiveTab('generate')} className={`flex-1 p-2 rounded-md font-semibold ${activeTab === 'generate' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>Generate</button>
                <button onClick={() => setActiveTab('edit')} className={`flex-1 p-2 rounded-md font-semibold ${activeTab === 'edit' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>Edit</button>
                <button onClick={() => setActiveTab('analyze')} className={`flex-1 p-2 rounded-md font-semibold ${activeTab === 'analyze' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>Analyze</button>
            </div>
             <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                {activeTab === 'generate' && <ImageGenerator />}
                {activeTab === 'edit' && <ImageEditor />}
                {activeTab === 'analyze' && <ImageAnalyzer />}
            </div>
        </div>
    );
};

export default ImageSuite;