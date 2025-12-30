
import React, { useState, useEffect } from 'react';
import { refreshViralHooks, getAvatarsLocal } from '../services/geminiService';
import { Avatar } from '../types';
import { SparklesIcon, CheckIcon } from './icons';

const ViralCenter: React.FC = () => {
    const [avatars, setAvatars] = useState<Avatar[]>([]);
    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [hooks, setHooks] = useState<{text: string, sources: any[]} | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const avs = getAvatarsLocal();
        setAvatars(avs);
        if(avs.length > 0) setSelectedAvatar(avs[0].key);
    }, []);

    const handleRefresh = async () => {
        setIsLoading(true);
        try {
            const data = await refreshViralHooks(selectedAvatar);
            setHooks(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <header className="text-center">
                <h2 className="text-3xl font-black text-white italic">Viral Hook Refresher</h2>
                <p className="text-gray-400 mt-2">I am currently browsing TikTok & Reels to find fitness trends for your avatar.</p>
            </header>

            <div className="flex flex-col sm:flex-row gap-4">
                <select 
                    value={selectedAvatar} 
                    onChange={e => setSelectedAvatar(e.target.value)}
                    className="flex-grow bg-gray-800 border border-gray-700 p-3 rounded-xl text-white outline-none"
                >
                    {avatars.map(a => <option key={a.key} value={a.key}>{a.name}</option>)}
                </select>
                <button 
                    onClick={handleRefresh} 
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {isLoading ? 'Searching...' : <><SparklesIcon className="w-5 h-5"/> Refresh Hooks</>}
                </button>
            </div>

            {hooks && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gray-800/60 p-6 rounded-2xl border border-indigo-500/30">
                        <div className="prose prose-invert text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {hooks.text}
                        </div>
                    </div>
                    {hooks.sources.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {hooks.sources.map((s: any, i: number) => (
                                <a key={i} href={s.uri} target="_blank" className="text-xs text-indigo-400 hover:underline">🔗 {s.title}</a>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ViralCenter;
