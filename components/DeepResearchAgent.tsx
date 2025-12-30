import React, { useState } from 'react';
import { runDeepResearchAgent } from '../services/geminiService';
import { SparklesIcon, EyeIcon, SearchIcon, CheckIcon, ShieldIcon, RefreshIcon, GlobeIcon } from './icons';

interface ResearchStep {
    action: string;
    result: string;
    sources?: any[];
    status: 'running' | 'completed' | 'failed';
}

const DeepResearchAgent: React.FC = () => {
    const [goal, setGoal] = useState('Luxury Real Estate vs Premium Fitness trends in Dubai Q4 2025');
    const [steps, setSteps] = useState<ResearchStep[]>([]);
    const [isThinking, setIsThinking] = useState(false);

    const startResearch = async () => {
        setIsThinking(true);
        setSteps([]);
        try {
            await runDeepResearchAgent(goal, (step) => {
                setSteps(prev => [...prev, step]);
            });
        } catch (err) {
            console.error("Agent logic failed", err);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in max-w-6xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-black gradient-text tracking-tighter italic flex items-center gap-4">
                        Deep Research Agent 
                        <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black not-italic animate-pulse">L3 Autonomous</span>
                    </h2>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.3em] mt-2">Grounded Search • Pattern Extraction • Knowledge Expansion</p>
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 space-y-8 bg-gradient-to-br from-red-500/[0.05] to-transparent shadow-2xl">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-red-400 uppercase tracking-widest block px-1 flex items-center gap-2">
                                <SparklesIcon className="w-3 h-3" />
                                Mission Objective
                            </label>
                            <textarea 
                                value={goal}
                                onChange={e => setGoal(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-3xl p-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 min-h-[140px] shadow-inner"
                                placeholder="Define the niche or competitor to deconstruct..."
                            />
                        </div>
                        <button 
                            onClick={startResearch}
                            disabled={isThinking}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-800 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-red-500/40 flex items-center justify-center gap-4 text-xs uppercase tracking-widest border border-white/10"
                        >
                            {isThinking ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <GlobeIcon className="w-5 h-5" />}
                            DEPLOY RESEARCH AGENT
                        </button>
                    </div>

                    <div className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-6">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <ShieldIcon className="w-3.5 h-3.5" />
                            AGENT CAPABILITIES
                        </h3>
                        <div className="space-y-4">
                            <CapItem label="Google Search Grounding" status="ACTIVE" />
                            <CapItem label="Competitor Psychological Audit" status="ACTIVE" />
                            <CapItem label="UAE Cultural Modesty Check" status="ACTIVE" />
                            <CapItem label="RAS Pattern Identification" status="ACTIVE" />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 space-y-8 min-h-[500px] flex flex-col">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <RefreshIcon className={`w-3.5 h-3.5 ${isThinking ? 'animate-spin text-red-400' : ''}`} />
                            MISSION TELEMETRY STREAM
                        </h3>

                        <div className="flex-grow space-y-8 overflow-y-auto pr-4 custom-scrollbar">
                            {steps.length === 0 && !isThinking ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 grayscale">
                                    <GlobeIcon className="w-24 h-24 mb-6" />
                                    <p className="text-xs font-black uppercase tracking-[0.4em]">Awaiting Objective Signal</p>
                                </div>
                            ) : (
                                steps.map((step, i) => (
                                    <div key={i} className="space-y-6 animate-fade-in-up">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] border ${step.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                                PHASE_{i+1}
                                            </div>
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest">{step.action}</h4>
                                        </div>
                                        <div className="bg-black/60 border border-white/10 rounded-3xl p-8 shadow-inner">
                                            <div className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed italic whitespace-pre-wrap">
                                                {step.result}
                                            </div>
                                            
                                            {step.sources && step.sources.length > 0 && (
                                                <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Grounding Citations:</p>
                                                    <div className="grid md:grid-cols-2 gap-3">
                                                        {step.sources.map((s: any, idx: number) => (
                                                            <a key={idx} href={s.web?.uri || '#'} target="_blank" className="p-3 bg-white/5 rounded-xl border border-white/5 text-[9px] font-bold text-red-400 truncate hover:bg-white/10 transition-all flex items-center gap-3">
                                                                <EyeIcon className="w-3 h-3" />
                                                                {s.web?.title || 'External Intelligence Node'}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isThinking && (
                                <div className="flex items-center justify-center p-20 gap-4 opacity-40 animate-pulse">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400 ml-4">Agent is reasoning...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CapItem = ({ label, status }: { label: string, status: string }) => (
    <div className="flex justify-between items-center p-4 bg-black/40 rounded-xl border border-white/5">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{label}</span>
        <span className="text-[9px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
            <CheckIcon className="w-3 h-3" />
            {status}
        </span>
    </div>
);

export default DeepResearchAgent;