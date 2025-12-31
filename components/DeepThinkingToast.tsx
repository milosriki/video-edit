import React, { useState, useEffect } from 'react';
import { setThinkingListener } from '../services/geminiService';
import { SparklesIcon, RefreshIcon } from './icons';

export const DeepThinkingToast: React.FC = () => {
    const [isThinking, setIsThinking] = useState(false);
    const [thought, setThought] = useState<string>('');

    useEffect(() => {
        setThinkingListener((active, msg) => {
            setIsThinking(active);
            if (msg) setThought(msg);
        });
    }, []);

    if (!isThinking) return null;

    return (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[300] animate-fade-in">
            <div className="glass-panel px-8 py-4 rounded-[2rem] border-indigo-500/50 flex items-center gap-6 shadow-[0_30px_100px_-20px_rgba(79,70,229,0.5)] ring-2 ring-indigo-500/20 bg-black/80 backdrop-blur-3xl">
                <div className="relative">
                    <RefreshIcon className="w-8 h-8 text-indigo-400 animate-spin" />
                    <div className="absolute inset-0 bg-indigo-500/30 blur-xl animate-pulse rounded-full"></div>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <SparklesIcon className="w-3 h-3 text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Gemini 3 Pro Reasoning</span>
                    </div>
                    <p className="text-sm font-black text-white italic tracking-tight">{thought || 'Processing complex strategic query...'}</p>
                </div>
                <div className="ml-4 pl-6 border-l border-white/10">
                    <div className="flex gap-1">
                        <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};