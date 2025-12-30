
import React, { useState } from 'react';
import { researchMarketTrends } from '../services/geminiService';
import { formatErrorMessage } from '../utils/error';
import { EyeIcon, SparklesIcon, CheckIcon } from './icons';

const AdResearcher: React.FC = () => {
    const [query, setQuery] = useState('Fitness ads for businessmen over 40 in Dubai');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{text: string, sources: any[]} | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleResearch = async () => {
        if (!query.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await researchMarketTrends(query);
            setResult(data);
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <header className="text-center space-y-2">
                <h2 className="text-3xl font-black text-white">Ad Trend Researcher</h2>
                <p className="text-gray-400">Search grounded intelligence to find what's winning on Meta right now.</p>
            </header>

            <div className="bg-gray-800/40 p-1 rounded-2xl border border-gray-700 flex shadow-2xl">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
                    placeholder="e.g. Current best hooks for luxury real estate ads..."
                    className="flex-grow bg-transparent p-4 focus:outline-none text-gray-100"
                />
                <button 
                    onClick={handleResearch} 
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:bg-gray-700 flex items-center gap-2"
                >
                    {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <SparklesIcon className="w-5 h-5" />}
                    Research
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300">
                    {error}
                </div>
            )}

            {result && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gray-800/60 p-6 rounded-2xl border border-gray-700/50 shadow-inner">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Market Intelligence Report</h3>
                        <div className="prose prose-invert max-w-none text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {result.text}
                        </div>
                    </div>

                    <div className="bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/30">
                        <h4 className="text-sm font-bold text-indigo-300 mb-4 flex items-center gap-2">
                            <CheckIcon className="w-4 h-4" /> Verified Sources
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {result.sources.map((s, idx) => (
                                <a 
                                    key={idx} 
                                    href={s.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-3 bg-gray-900/50 rounded-xl border border-gray-800 hover:border-indigo-500/50 transition-all text-xs text-gray-400 truncate flex items-center gap-3"
                                >
                                    <span className="bg-indigo-500/20 text-indigo-400 w-5 h-5 rounded flex items-center justify-center font-bold">{idx + 1}</span>
                                    {s.title}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!result && !isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 opacity-50">
                    {["Competitive Pricing", "Viral Hooks", "Visual Trends"].map(t => (
                        <div key={t} className="p-6 bg-gray-800/20 border border-gray-800 rounded-2xl text-center">
                            <h5 className="font-bold text-gray-400 mb-1">{t}</h5>
                            <p className="text-[10px] text-gray-600">Analyze real-time data</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdResearcher;
