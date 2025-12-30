
import React, { useState } from 'react';
import { generateRepository } from '../services/geminiService';
import { Repository, RepoFile } from '../types';
import { formatErrorMessage } from '../utils/error';
import { SparklesIcon, WandIcon, FilmIcon, CheckIcon, ShieldIcon, DownloadIcon } from './icons';

const RepositoryGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A full-stack fitness tracker app with a React dashboard and a Node.js Express API.');
    const [isLoading, setIsLoading] = useState(false);
    const [repo, setRepo] = useState<Repository | null>(null);
    const [selectedFile, setSelectedFile] = useState<RepoFile | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setRepo(null);
        setSelectedFile(null);

        try {
            const generatedRepo = await generateRepository(prompt);
            setRepo(generatedRepo);
            if (generatedRepo.files && generatedRepo.files.length > 0) {
                setSelectedFile(generatedRepo.files[0]);
            }
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (!selectedFile) return;
        navigator.clipboard.writeText(selectedFile.content);
        // Could add a toast here
    };

    return (
        <div className="space-y-10 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-black gradient-text tracking-tighter italic">Project Architect</h2>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.3em] mt-2">Build Mode V2: Full-Stack Repository Generation</p>
                </div>
            </header>

            {/* INPUT SECTION */}
            <section className="glass-panel p-10 rounded-[2.5rem] border-white/5 space-y-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block px-1">Blueprint Specification</label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the full stack application you want to generate..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-white placeholder-gray-700 min-h-[120px]"
                    />
                </div>
                <div className="flex justify-end">
                    <button 
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-12 rounded-2xl flex items-center gap-4 transition-all shadow-2xl shadow-indigo-500/30 disabled:bg-gray-800 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
                        ) : (
                            <SparklesIcon className="w-5 h-5" />
                        )}
                        {isLoading ? 'ARCHITECTING...' : 'INITIALIZE REPOSITORY'}
                    </button>
                </div>
            </section>

            {error && (
                <div className="bg-red-900/50 border border-red-700/50 text-red-300 p-6 rounded-2xl animate-shake">
                    <strong>Architecture Error:</strong> {error}
                </div>
            )}

            {/* REPOSITORY VIEW */}
            {repo && (
                <div className="grid lg:grid-cols-12 gap-10">
                    {/* FILE TREE */}
                    <div className="lg:col-span-4 glass-panel rounded-[2rem] border-white/5 overflow-hidden flex flex-col h-[600px]">
                        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <ShieldIcon className="w-3.5 h-3.5"/>
                                Directory Structure
                            </h3>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-1 custom-scrollbar">
                            {repo.files.map((file) => (
                                <button
                                    key={file.path}
                                    onClick={() => setSelectedFile(file)}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 text-xs font-bold ${
                                        selectedFile?.path === file.path 
                                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-lg' 
                                        : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                    }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedFile?.path === file.path ? 'bg-indigo-400' : 'bg-gray-800'}`}></div>
                                    <span className="truncate">{file.path}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CODE VIEW */}
                    <div className="lg:col-span-8 glass-panel rounded-[2rem] border-white/5 overflow-hidden flex flex-col h-[600px] shadow-2xl">
                        <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="px-3 py-1 bg-black/40 rounded-full border border-white/10 text-[10px] font-mono text-gray-400">
                                    {selectedFile?.path || 'No file selected'}
                                </div>
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                    {selectedFile?.language || 'plain'}
                                </span>
                            </div>
                            <button 
                                onClick={handleCopyCode}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 border border-white/10"
                            >
                                <CheckIcon className="w-3 h-3" />
                                COPY CODE
                            </button>
                        </div>
                        <div className="flex-grow overflow-hidden bg-black/40 relative">
                            <pre className="absolute inset-0 p-8 overflow-auto custom-scrollbar font-mono text-[13px] leading-relaxed text-gray-300 selection:bg-indigo-500/30">
                                <code>{selectedFile?.content}</code>
                            </pre>
                        </div>
                        <div className="p-6 border-t border-white/5 bg-black/40 flex justify-between items-center">
                            <div className="text-[10px] font-mono text-gray-500 italic">Generated by GEMINI_3_PRO_ENGINEER</div>
                            <button className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-indigo-300 transition-colors">
                                <DownloadIcon className="w-4 h-4" />
                                DOWNLOAD FULL REPO
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RepositoryGenerator;
