
import React, { useState } from 'react';
import { SparklesIcon, EyeIcon, BarChartIcon, CheckIcon, ShieldIcon, UsersIcon, MessageSquareIcon } from './icons';

const IntelligenceSuite: React.FC = () => {
    const [selectedFeature, setSelectedFeature] = useState('heatmap');

    const simulations = [
        { name: "Executive Ahmed", profile: "Dubai C-Level, 45, Time-Poor", reaction: "The hook 'Biohacking for Executives' immediately stopped my scroll. CTR likely high.", roas: 4.2 },
        { name: "Coach Sarah", profile: "Boutique Fitness Owner, 38", reaction: "Visual authenticity is 9/10. The lighting in the b-roll feels premium.", roas: 3.8 },
        { name: "Legacy Investor", profile: "British Expat, 55, High Net Worth", reaction: "Bit too energetic. I'd prefer the 'Longevity' angle over 'Boardroom Power'.", roas: 2.1 },
    ];

    return (
        <div className="space-y-10 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-black gradient-text tracking-tighter">Predictive Intelligence</h2>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.3em] mt-2">Conversion Pre-Visualization & Risk Audit</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-green-500/10 border border-green-500/30 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-xl">
                        <ShieldIcon className="w-5 h-5 text-green-400" />
                        <div>
                            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest block leading-none">Status</span>
                            <span className="text-xs font-bold text-white">UAE Cultural Safe</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* TOOL BAR */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-8">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <SparklesIcon className="w-3.5 h-3.5"/>
                            AI SIMULATOR STACK
                        </h3>
                        <div className="space-y-4">
                            <PredictionCard 
                                active={selectedFeature === 'heatmap'} 
                                onClick={() => setSelectedFeature('heatmap')}
                                icon={EyeIcon} title="Attention Heatmap" desc="Predict RAS activation" value="94%" color="indigo" 
                            />
                            <PredictionCard 
                                active={selectedFeature === 'personas'} 
                                onClick={() => setSelectedFeature('personas')}
                                icon={UsersIcon} title="Persona Sentiment" desc="100 AI Agent focus group" value="POSITIVE" color="green" 
                            />
                            <PredictionCard 
                                active={selectedFeature === 'compliance'} 
                                onClick={() => setSelectedFeature('compliance')}
                                icon={ShieldIcon} title="Cultural Guardrail" desc="Audit for UAE standards" value="PASS" color="blue" 
                            />
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-gradient-to-br from-indigo-500/[0.05] to-transparent">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <MessageSquareIcon className="w-3.5 h-3.5"/>
                            COMPETITIVE SPIKE ALERT
                        </h4>
                        <div className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-white font-black tracking-tight">Vantage Health Ads</span>
                                <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full uppercase font-black">NEW STRATEGY</span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                Competitor just launched 14 variations using "Post-Summer Detox" angle. <br/><br/>
                                <span className="text-indigo-400 font-bold underline cursor-pointer hover:text-indigo-300">Counter-strategy: Lead with "Muscle Maintenance" protocol.</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* VISUALIZER CANVAS */}
                <div className="lg:col-span-8 glass-panel rounded-[2.5rem] border-white/5 overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                        <div className="flex gap-8">
                            <span className="text-sm font-black text-white uppercase tracking-tighter">Visualization Canvas</span>
                        </div>
                        <div className="text-[10px] font-mono text-gray-600 bg-black/40 px-3 py-1 rounded-full border border-white/5">ENGINE: NEURAL_VIS_4.2</div>
                    </div>

                    <div className="flex-grow p-10 bg-black/20 relative min-h-[500px] flex items-center justify-center">
                        {selectedFeature === 'heatmap' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in">
                                <div className="relative w-full max-w-xl aspect-video bg-gray-900 rounded-[2rem] overflow-hidden border border-white/10 shadow-inner group">
                                    <img src="https://placehold.co/800x450/020617/6366f1?text=Frame_Analysis_0032.jpg" className="w-full h-full object-cover grayscale opacity-40 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100" />
                                    {/* GENERATIVE HEATMAP BLURS */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-red-500/40 via-yellow-400/20 to-transparent blur-3xl scale-90 animate-pulse"></div>
                                    <div className="absolute top-[15%] left-[45%] w-48 h-48 bg-red-600/50 rounded-full blur-[60px] animate-pulse"></div>
                                    <div className="absolute bottom-[20%] left-[10%] w-32 h-32 bg-yellow-400/30 rounded-full blur-[40px]"></div>
                                    
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                        <div className="text-center p-8 glass-panel rounded-3xl border-white/20">
                                            <p className="text-xs font-black text-white uppercase tracking-widest mb-1">Attention Concentration</p>
                                            <p className="text-3xl font-black text-green-400">92%</p>
                                        </div>
                                    </div>
                                    
                                    <div className="absolute top-6 left-6 px-4 py-2 bg-black/80 rounded-xl text-[10px] text-indigo-400 font-black tracking-widest border border-indigo-500/30">EYE_TRACK_PREDICTION</div>
                                </div>
                                <div className="mt-12 text-center space-y-3">
                                    <div className="text-sm font-black text-gray-200 uppercase tracking-widest">RAS Activation: <span className="text-green-400">OPTIMIZED</span></div>
                                    <p className="text-xs text-gray-500 max-w-lg leading-relaxed font-medium italic">"The contrast between the white executive shirt and the deep blue gym background triggers immediate pattern recognition in male executives 40+."</p>
                                </div>
                            </div>
                        ) : selectedFeature === 'personas' ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full animate-fade-in">
                                {simulations.map(sim => (
                                    <div key={sim.name} className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-4 hover:bg-white/[0.04] transition-all hover:-translate-y-1">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-lg border border-indigo-500/20">
                                                {sim.name[0]}
                                            </div>
                                            <div className="px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-[9px] font-black text-green-400 tracking-tighter">{sim.roas}x ROAS</div>
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-black text-white tracking-tight">{sim.name}</h5>
                                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">{sim.profile}</p>
                                        </div>
                                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium italic">"{sim.reaction}"</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full text-center space-y-8 animate-fade-in">
                                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                                    <ShieldIcon className="w-10 h-10 text-blue-400" />
                                </div>
                                <h4 className="text-2xl font-black text-white">Cultural Audit Summary</h4>
                                <div className="max-w-md mx-auto space-y-4">
                                    <AuditItem label="Modesty Standards" status="PASS" />
                                    <AuditItem label="Music Tone (Vibe)" status="PASS" />
                                    <AuditItem label="Dialect Accuracy" status="WARNING" desc="Hook uses 'Biohacking' - ensure localized translation for Arabic subtitles." />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-black/40 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <SparklesIcon className="w-5 h-5 text-indigo-400" />
                            <div>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block leading-none">Confidence Score</span>
                                <span className="text-lg font-black text-white">98.2% Accuracy</span>
                            </div>
                        </div>
                        <button className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-500/30">
                            Apply Optimized Direct-Response Logic
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AuditItem = ({ label, status, desc }: { label: string, status: string, desc?: string }) => (
    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-start gap-1">
        <div className="flex justify-between w-full">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
            <span className={`text-[10px] font-black uppercase ${status === 'PASS' ? 'text-green-400' : 'text-yellow-400'}`}>{status}</span>
        </div>
        {desc && <p className="text-[10px] text-gray-600 text-left mt-1">{desc}</p>}
    </div>
);

const PredictionCard = ({ icon: Icon, title, desc, value, color, active, onClick }: { icon: any, title: string, desc: string, value: string, color: string, active: boolean, onClick: () => void }) => (
    <div 
        onClick={onClick}
        className={`flex items-center gap-5 p-5 rounded-2xl border transition-all cursor-pointer group ${
            active 
            ? `bg-${color}-500/10 border-${color}-500/40 shadow-lg` 
            : 'bg-black/20 border-white/5 hover:border-white/10'
        }`}
    >
        <div className={`w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 transition-colors group-hover:border-${color}-500/30`}>
            <Icon className={`w-6 h-6 ${active ? `text-${color}-400` : 'text-gray-600 group-hover:text-gray-400'}`} />
        </div>
        <div className="flex-grow">
            <h5 className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{title}</h5>
            <p className="text-[10px] text-gray-500 font-medium">{desc}</p>
        </div>
        <div className={`text-xs font-black font-mono ${active ? `text-${color}-400` : 'text-gray-700'}`}>{value}</div>
    </div>
);

export default IntelligenceSuite;
