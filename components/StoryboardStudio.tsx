
import React, { useState } from 'react';
import { generateStoryboard, generateImage } from '../services/geminiService';
import { StoryboardPanel } from '../types';
import { formatErrorMessage } from '../utils/error';
import { SparklesIcon } from './icons';

const Spinner: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex flex-col items-center justify-center text-center p-8">
        <svg className="animate-spin h-8 w-8 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-semibold text-gray-300">{text}</p>
    </div>
);

const StoryboardStudio: React.FC = () => {
    const [prompt, setPrompt] = useState('An ad for a high-tech coffee mug that keeps coffee at the perfect temperature for 12 hours. The ad should feel modern, sleek, and slightly futuristic.');
    const [panels, setPanels] = useState<StoryboardPanel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setPanels([]);
        setLoadingMessage('Generating storyboard structure...');

        try {
            const storyboardStructure = await generateStoryboard(prompt);
            setPanels(storyboardStructure.map(p => ({ ...p, imageUrl: undefined })));

            for (let i = 0; i < storyboardStructure.length; i++) {
                setLoadingMessage(`Generating image ${i + 1} of ${storyboardStructure.length}...`);
                try {
                    const imageUrl = await generateImage(storyboardStructure[i].image_prompt, '16:9');
                    setPanels(prevPanels => {
                        const newPanels = [...prevPanels];
                        newPanels[i].imageUrl = imageUrl;
                        return newPanels;
                    });
                } catch (imgErr) {
                    console.error(`Failed to generate image for panel ${i + 1}:`, imgErr);
                    // Continue to the next image even if one fails
                }
            }

        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <h2 className="text-xl font-bold">Storyboard Studio</h2>
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-4">
                <div>
                    <label htmlFor="storyboard-prompt" className="block text-sm font-medium text-gray-300 mb-2">Ad Concept</label>
                    <textarea
                        id="storyboard-prompt"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        rows={3}
                        className="w-full p-3 bg-gray-900/70 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        placeholder="Describe your ad concept here..."
                    />
                </div>
                <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all text-lg">
                    {isLoading ? 'Generating...' : <><SparklesIcon className="w-6 h-6" /> Generate Storyboard</>}
                </button>
            </div>

            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {isLoading && <Spinner text={loadingMessage} />}

            {panels.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Generated Storyboard</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {panels.map((panel, index) => (
                            <div key={index} className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden">
                                <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
                                    {panel.imageUrl ? (
                                        <img src={panel.imageUrl} alt={`Storyboard panel ${index + 1}`} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-gray-500">Generating...</div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-indigo-400">Panel {index + 1}</h4>
                                    <p className="text-sm text-gray-300 mt-1">{panel.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoryboardStudio;
