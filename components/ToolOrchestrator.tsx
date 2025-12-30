
import React, { useState } from 'react';
import { RemoteToolConfig, ToolExecution } from '../types';
import { SlidersIcon, ShieldIcon, CheckIcon, KeyIcon, SparklesIcon, WandIcon, VideoIcon } from './icons';
import { orchestrateWithRemoteTools } from '../services/geminiService';

const RegisterToolModal: React.FC<{
    onClose: () => void;
    onAdd: (tool: RemoteToolConfig) => void;
}> = ({ onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [endpoint, setEndpoint] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !endpoint) return;
        
        onAdd({
            id: name.toLowerCase().replace(/\s+/g, '_'),
            name,
            endpoint,
            description: description || 'User-registered remote tool.',
            status: 'online'
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-8">
            <div className="bg-gray-900 border border-white/10 rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-fade-in-up">
                <header className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div>
                        <h3 className="text-2xl font-black text-white italic">Register Cloud Run Tool</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Connect your custom MCP or API endpoint</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-3xl font-light">&times;</button>
                </header>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Tool Name</label>
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50"
                            placeholder="e.g., Conversion Analyzer"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Service URL (Cloud Run)</label>
                        <input 
                            type="url" 
                            required
                            value={endpoint}
                            onChange={e => setEndpoint(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50"
                            placeholder="https://service-hash.a.run.app"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Capability Description</label>
                        <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50 h-24"
                            placeholder="Describe what this tool does so the AI knows when to use it..."
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-500/30 text-[11px] uppercase tracking-widest"
                    >
                        Register Intelligence Endpoint
                    </button>
                </form>
            </div>
        </div>
    );
};

const ToolOrchestrator: React.FC = () => {
    const [tools, setTools] = useState<RemoteToolConfig[]>([
        { 
            id: 'ad_alpha_intelligence', 
            name: 'Ad Alpha Core', 
            endpoint: 'https://ad-alpha-mcp-server-489769736562.us-central1.run.app', 
            description: 'The master PTD MCP server for direct response auditing and conversion engineering.', 
            status: 'online' 
        },
        { 
            id: 'verify_winning_ad', 
            name: 'The Truth Checker', 
            endpoint: 'https://ad-alpha-mcp.a.run.app/verify_winning_ad', 
            description: 'Cross-references FB Clicks with HubSpot Customers to find REAL ROI.', 
            status: 'online' 
        }
    ]);
    
    const [history, setHistory] = useState<ToolExecution[]>([]);
    const [prompt, setPrompt] = useState('Use the Ad Alpha Intelligence server to analyze the creative (ID: ad_102) and provide a conversion probability score for the Dubai market.');
    const [isExecuting, setIsExecuting] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    const handleRunOrchestration = async () => {
        setIsExecuting(true);
        try {
            const result = await orchestrateWithRemoteTools(prompt, tools);
            setHistory(prev => [{
                id: Date.now().toString(),
                toolName: 'Gemini Orchestrator',
                params: { prompt },
                result: result,
                timestamp: new Date().toLocaleTimeString(),
                status: 'success'
            }, ...prev]);
        } catch (e) {
            console.error(e);
            setHistory(prev => [{
                id: Date.now().toString(),
                toolName: 'System Error',
                params: { prompt },
                result: { error: e instanceof Error ? e.message : 'Execution failed.' },
                timestamp: new Date().toLocaleTimeString(),
                status: 'failed'
            }, ...prev]);
        } finally {
            setIsExecuting(false);
        }
    };

    const handleAddTool = (newTool: RemoteToolConfig) => {
        setTools(prev => [...prev, newTool]);
    };

    return (
        <div className="space-y-10 animate-fade-in">
            {showRegisterModal && (
                <RegisterToolModal 
                    onClose={() => setShowRegisterModal(false)} 
                    onAdd={handleAddTool} 
                />
            )}

            <header className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black gradient-text tracking-tighter italic">Remote Tool Orchestrator</h2>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.3em] mt-2">MCP Agent Configuration & Execution Hub</p>
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-8">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <ShieldIcon className="w-3.5 h-3.5"/>
                            REMOTE ENDPOINTS
                        </h3>
                        <div className="space-y-4">
                            {tools.map(tool => (
                                <div key={tool.id} className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-3 group hover:border-indigo-500/30 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            {tool.id.includes('alpha') ? <VideoIcon className="w-3 h-3 text-indigo-400" /> : <KeyIcon className="w-3 h-3 text-gray-500" />}
                                            <h5 className="text-xs text-white font-black">{tool.name}</h5>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                                            <span className="text-[8px] font-black text-green-400 uppercase">ONLINE</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium">{tool.description}</p>
                                    <div className="text-[8px] font-mono text-gray-600 truncate group-hover:text-indigo-400/60 transition-colors">{tool.endpoint}</div>
                                </div>
                            ))}
                            <button 
                                onClick={() => setShowRegisterModal(true)}
                                className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-gray-600 text-[10px] font-black uppercase hover:bg-white/5 hover:text-indigo-400 hover:border-indigo-500/20 transition-all"
                            >
                                + REGISTER CLOUD RUN TOOL
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 space-y-8 shadow-2xl bg-gradient-to-br from-indigo-500/[0.03] to-transparent">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block px-1">Agent Command</label>
                            <textarea 
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px] shadow-inner"
                                placeholder="Describe the sequence of remote tools you want to orchestrate..."
                            />
                        </div>
                        <button 
                            onClick={handleRunOrchestration}
                            disabled={isExecuting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-4 border border-white/10"
                        >
                            {isExecuting ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : <WandIcon className="w-5 h-5" />}
                            EXECUTE MULTI-STEP ORCHESTRATION
                        </button>
                    </div>

                    <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 space-y-8">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <SlidersIcon className="w-3.5 h-3.5"/>
                            EXECUTION LOGS
                        </h3>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                            {history.length === 0 && (
                                <div className="text-center py-20 opacity-20">
                                    <SparklesIcon className="w-12 h-12 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Command Input</p>
                                </div>
                            )}
                            {history.map(item => (
                                <div key={item.id} className={`p-6 bg-white/[0.02] border rounded-3xl space-y-4 animate-fade-in ${item.status === 'failed' ? 'border-red-500/20' : 'border-white/5'}`}>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${item.status === 'failed' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.toolName}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-600">{item.timestamp}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] text-gray-400 font-medium italic">"{item.params.prompt}"</p>
                                        <div className={`bg-black/40 rounded-xl p-4 font-mono text-[10px] border border-white/[0.03] ${item.status === 'failed' ? 'text-red-400' : 'text-indigo-300'}`}>
                                            {JSON.stringify(item.result, null, 2)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolOrchestrator;
