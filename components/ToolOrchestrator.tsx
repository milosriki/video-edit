
import React, { useState, useEffect } from 'react';
import { RemoteToolConfig, ToolExecution } from '../types';
import { ShieldIcon, KeyIcon, SparklesIcon, WandIcon, BarChartIcon } from './icons';
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
            description: description || 'Direct conversion audit tool.',
            status: 'offline'
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-8">
            <div className="bg-gray-900 border border-white/10 rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl animate-fade-in-up">
                <header className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div>
                        <h3 className="text-2xl font-black text-white italic">Register Intelligence Node</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Provide Cloud Run service endpoint</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-3xl font-light">&times;</button>
                </header>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Node Identity</label>
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50"
                            placeholder="e.g., ad_alpha_core"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Service URL</label>
                        <input 
                            type="url" 
                            required
                            value={endpoint}
                            onChange={e => setEndpoint(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/50"
                            placeholder="https://...run.app"
                        />
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-500/30 text-[11px] uppercase tracking-widest"
                    >
                        Initialize Link
                    </button>
                </form>
            </div>
        </div>
    );
};

const ToolOrchestrator: React.FC = () => {
    const [tools, setTools] = useState<RemoteToolConfig[]>([
        { 
            id: 'ad_alpha_core', 
            name: 'Ad Alpha Core', 
            endpoint: 'https://ad-alpha-mcp-xej66rtyoa-uc.a.run.app', 
            description: 'Main intelligence node for ROI cross-referencing and HubSpot audits.', 
            status: 'offline' 
        }
    ]);
    
    const [history, setHistory] = useState<ToolExecution[]>([]);
    const [prompt, setPrompt] = useState('Audit my latest Dubai campaign and suggest high-ROI variations using Ad Alpha intel.');
    const [isExecuting, setIsExecuting] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [pingingId, setPingingId] = useState<string | null>(null);

    useEffect(() => {
        // Automatically verify links on mount
        tools.forEach(t => testConnection(t));
    }, []);

    const handleRunOrchestration = async () => {
        if (!prompt.trim()) return;
        setIsExecuting(true);
        try {
            const result = await orchestrateWithRemoteTools(prompt, tools);
            setHistory(prev => [{
                id: Date.now().toString(),
                toolName: 'Neural Orchestrator',
                params: { prompt },
                result: result,
                timestamp: new Date().toLocaleTimeString(),
                status: 'success'
            }, ...prev]);
        } catch (e) {
            setHistory(prev => [{
                id: Date.now().toString(),
                toolName: 'System Collision',
                params: { prompt },
                result: { error: e instanceof Error ? e.message : 'Bridge timeout' },
                timestamp: new Date().toLocaleTimeString(),
                status: 'failed'
            }, ...prev]);
        } finally {
            setIsExecuting(false);
        }
    };

    const testConnection = async (tool: RemoteToolConfig) => {
        setPingingId(tool.id);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            await fetch(tool.endpoint, { 
                method: 'GET', 
                mode: 'no-cors',
                signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            setTools(prev => prev.map(t => t.id === tool.id ? { ...t, status: 'online', lastPing: new Date().toLocaleTimeString() } : t));
        } catch (e) {
            setTools(prev => prev.map(t => t.id === tool.id ? { ...t, status: 'error' } : t));
        } finally {
            setPingingId(null);
        }
    };

    return (
        <div className="space-y-10 animate-fade-in">
            {showRegisterModal && (
                <RegisterToolModal 
                    onClose={() => setShowRegisterModal(false)} 
                    onAdd={(t) => { setTools(prev => [...prev, t]); testConnection(t); }} 
                />
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-black gradient-text tracking-tighter italic">Neural Bridge</h2>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.3em] mt-2">Remote MCP Node Orchestration</p>
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <ShieldIcon className="w-3.5 h-3.5"/>
                                REMOTE NODES
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {tools.map(tool => (
                                <div key={tool.id} className={`p-6 bg-black/40 rounded-3xl border transition-all ${tool.status === 'online' ? 'border-green-500/40 bg-green-500/[0.03]' : 'border-white/5 hover:border-white/10'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${tool.status === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)]' : 'bg-gray-600'} ${pingingId === tool.id ? 'animate-ping' : ''}`}></div>
                                            <h5 className="text-[11px] text-white font-black uppercase tracking-tight">{tool.name}</h5>
                                        </div>
                                        <button 
                                            onClick={() => testConnection(tool)}
                                            disabled={pingingId === tool.id}
                                            className="text-[8px] font-black uppercase text-indigo-400 hover:text-white bg-indigo-500/10 px-2 py-1 rounded transition-colors"
                                        >
                                            {pingingId === tool.id ? 'SYNCING...' : 'SYNC'}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 italic mb-4 leading-relaxed">"{tool.description}"</p>
                                    <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[9px] font-mono text-gray-500">
                                        <span className="truncate max-w-[150px]">{tool.endpoint}</span>
                                        <span className={tool.status === 'online' ? 'text-green-400 font-black' : 'text-gray-600'}>
                                            {tool.status === 'online' ? 'CONNECTED' : 'STANDBY'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setShowRegisterModal(true)} className="w-full py-4 rounded-3xl border border-dashed border-white/10 text-[10px] font-black uppercase text-gray-600 hover:text-indigo-400 hover:border-indigo-500/20 transition-all">
                                + REGISTER NEW NODE
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 space-y-8 bg-gradient-to-br from-indigo-500/[0.03] to-transparent">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block px-1">Inter-Node Directive</label>
                            <textarea 
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-3xl p-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[140px]"
                                placeholder="Describe the task for your remote intelligence network..."
                            />
                        </div>
                        <button 
                            onClick={handleRunOrchestration}
                            disabled={isExecuting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-4 text-xs uppercase tracking-widest border border-white/10"
                        >
                            {isExecuting ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : <WandIcon className="w-5 h-5" />}
                            Execute Synchronized Request
                        </button>
                    </div>

                    <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 space-y-8">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <BarChartIcon className="w-3.5 h-3.5"/>
                            TELEMETRY LOG
                        </h3>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                            {history.length === 0 ? (
                                <div className="text-center py-20 opacity-20 uppercase font-black text-[10px] tracking-widest flex flex-col items-center gap-4">
                                    <SparklesIcon className="w-12 h-12" />
                                    No Active Transmissions
                                </div>
                            ) : history.map(item => (
                                <div key={item.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4 animate-fade-in">
                                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                                        <span className="font-black text-white">{item.toolName}</span>
                                        <span>{item.timestamp}</span>
                                    </div>
                                    <div className="bg-black/40 rounded-2xl p-6 font-mono text-[10px] text-indigo-300 border border-white/[0.03] overflow-x-auto">
                                        <pre>{JSON.stringify(item.result, null, 2)}</pre>
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
