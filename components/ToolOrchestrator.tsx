
import React, { useState, useEffect } from 'react';
import { RemoteToolConfig, ToolExecution, ConnectionStatus } from '../types';
import { ShieldIcon, KeyIcon, SparklesIcon, WandIcon, BarChartIcon, EyeIcon, CheckIcon, UsersIcon, SendIcon } from './icons';
import { orchestrateWithRemoteTools } from '../services/geminiService';

const ToolOrchestrator: React.FC = () => {
    const [tools, setTools] = useState<RemoteToolConfig[]>([
        { 
            id: 'ad_alpha_360', 
            name: 'AdAlpha 360 Core', 
            endpoint: 'https://ad-alpha-mcp-489769736562.us-central1.run.app', 
            description: 'MCP Server: Truth Checker, Neural Remixer, and Trend Hunter.', 
            status: 'offline' 
        },
        {
            id: 'pipeboard_meta',
            name: 'Pipeboard Meta Ads',
            endpoint: 'https://mcp.pipeboard.co/meta-ads-mcp',
            description: 'Direct Meta Marketing API Bridge: Campaign Stats, Spend, and Engagement.',
            status: 'offline'
        }
    ]);
    
    const [history, setHistory] = useState<ToolExecution[]>([]);
    const [prompt, setPrompt] = useState('Analyze my top performing Facebook ad campaigns from the last 30 days and suggest remixes for the Dubai market.');
    const [isExecuting, setIsExecuting] = useState(false);

    const updateToolStatus = () => {
        const saved = localStorage.getItem('ptd_connections');
        if (saved) {
            const conns = JSON.parse(saved) as ConnectionStatus[];
            setTools(prev => prev.map(t => {
                const isMeta = t.id === 'pipeboard_meta';
                const conn = conns.find(c => isMeta ? c.id === 'meta' : c.id === 'hubspot');
                return { ...t, status: conn?.connected ? 'online' : 'offline', lastPing: conn?.lastSync };
            }));
        }
    };

    useEffect(() => {
        updateToolStatus();
        window.addEventListener('ptd_connections_updated', updateToolStatus);
        return () => window.removeEventListener('ptd_connections_updated', updateToolStatus);
    }, []);

    const handleRunOrchestration = async (overridePrompt?: string) => {
        const finalPrompt = overridePrompt || prompt;
        if (!finalPrompt.trim()) return;
        
        setIsExecuting(true);
        try {
            const result = await orchestrateWithRemoteTools(finalPrompt, tools);
            setHistory(prev => [{
                id: Date.now().toString(),
                toolName: 'AdAlpha Intelligence Hub',
                params: { prompt: finalPrompt },
                result: result,
                timestamp: new Date().toLocaleTimeString(),
                status: 'success'
            }, ...prev]);
        } catch (e) {
            setHistory(prev => [{
                id: Date.now().toString(),
                toolName: 'Neural Hub Error',
                params: { prompt: finalPrompt },
                result: { error: e instanceof Error ? e.message : 'Bridge timeout' },
                timestamp: new Date().toLocaleTimeString(),
                status: 'failed'
            }, ...prev]);
        } finally {
            setIsExecuting(false);
        }
    };

    const runQuickAction = (type: string) => {
        const isMeta = type === 'meta_stats';
        const connStatus = tools.find(t => isMeta ? t.id === 'pipeboard_meta' : t.id === 'ad_alpha_360')?.status;
        
        if (connStatus === 'offline') {
            alert(`NODE_OFFLINE: Please initialize the ${isMeta ? 'Meta Ads' : 'HubSpot/System'} connection in the Intelligence Bridge before executing.`);
            return;
        }

        let p = '';
        if (type === 'meta_stats') p = "Show me my top performing Facebook ad campaigns and current monthly spend.";
        if (type === 'truth') p = "Truth Checker: Verify the ROI of my top 3 Meta ads against HubSpot lead value.";
        if (type === 'remix') p = "Neural Remixer: Generate 5 variations of our highest-performing video asset using Creatify logic.";
        if (type === 'trends') p = "Trend Hunter: Research high-growth fitness hooks currently trending in Dubai.";
        setPrompt(p);
        handleRunOrchestration(p);
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-black gradient-text tracking-tighter italic flex items-center gap-4">
                        Neural Intelligence Hub 
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black not-italic">Mesh Sync Active</span>
                    </h2>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.3em] mt-2">Remote MCP Mesh • Meta, HubSpot & AdAlpha 360</p>
                </div>
                <div className="flex gap-4">
                    {tools.map(t => (
                        <div key={t.id} className={`bg-white/5 border px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${t.status === 'online' ? 'border-green-500/20' : 'border-red-500/20 grayscale opacity-60'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]' : 'bg-red-500'}`}></div>
                            <span className="text-[9px] font-black text-gray-400 uppercase">{t.name}</span>
                        </div>
                    ))}
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-8">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <UsersIcon className="w-3.5 h-3.5"/>
                            PIPEBOARD REMOTE ACTIONS
                        </h3>
                        <div className="space-y-4">
                            <QuickActionBtn 
                                icon={BarChartIcon} title="Meta Performance" color="blue" 
                                onClick={() => runQuickAction('meta_stats')}
                                desc="Direct Facebook API Query" 
                            />
                            <QuickActionBtn 
                                icon={ShieldIcon} title="Truth Checker" color="green" 
                                onClick={() => runQuickAction('truth')}
                                desc="Meta + HubSpot Multi-Sync" 
                            />
                            <QuickActionBtn 
                                icon={WandIcon} title="Neural Remixer" color="indigo" 
                                onClick={() => runQuickAction('remix')}
                                desc="Remote Creative Mutation" 
                            />
                            <QuickActionBtn 
                                icon={EyeIcon} title="Market Trends" color="purple" 
                                onClick={() => runQuickAction('trends')}
                                desc="Live Web Grounded Search" 
                            />
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[2rem] border-white/5 bg-gradient-to-br from-indigo-500/[0.05] to-transparent">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 italic">Remote Telemetry Log</h4>
                        <div className="space-y-4">
                            {tools.map(tool => (
                                <div key={tool.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-white">{tool.name}</span>
                                        <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${tool.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {tool.status}
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-600 truncate font-mono">{tool.endpoint}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 space-y-8 bg-gradient-to-br from-indigo-500/[0.03] to-transparent relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <SparklesIcon className="w-48 h-48 text-white" />
                        </div>
                        
                        <div className="space-y-4 relative z-10">
                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block px-1 flex items-center gap-2">
                                <SendIcon className="w-3 h-3" />
                                Master MCP directive
                            </label>
                            <textarea 
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="w-full bg-black/60 border border-white/10 rounded-3xl p-8 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[160px] shadow-inner"
                                placeholder="Sync with Meta, verify ROAS, or remix assets..."
                            />
                        </div>
                        
                        <button 
                            onClick={() => handleRunOrchestration()}
                            disabled={isExecuting}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-4 text-xs uppercase tracking-widest border border-white/10"
                        >
                            {isExecuting ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : <WandIcon className="w-5 h-5" />}
                            START CROSS-NODE HANDSHAKE
                        </button>
                    </div>

                    <div className="glass-panel p-10 rounded-[2.5rem] border-white/5 space-y-8">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <BarChartIcon className="w-3.5 h-3.5"/>
                            NODE EXECUTION HISTORY
                        </h3>
                        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                            {history.length === 0 ? (
                                <div className="text-center py-20 opacity-20 uppercase font-black text-[10px] tracking-widest flex flex-col items-center gap-4">
                                    <SparklesIcon className="w-12 h-12" />
                                    Awaiting Remote Sync
                                </div>
                            ) : history.map(item => (
                                <div key={item.id} className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6 animate-fade-in-up">
                                    <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2 h-2 rounded-full ${item.status === 'success' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,1)]' : 'bg-red-500'}`}></span>
                                            <span className="font-black text-white uppercase">{item.toolName}</span>
                                        </div>
                                        <span>{item.timestamp}</span>
                                    </div>
                                    <div className="bg-black/60 rounded-2xl p-8 font-mono text-[11px] text-indigo-300 border border-white/[0.03] overflow-x-auto">
                                        <pre className="whitespace-pre-wrap">{JSON.stringify(item.result, null, 2)}</pre>
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

const QuickActionBtn = ({ icon: Icon, title, desc, color, onClick }: { icon: any, title: string, desc: string, color: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center gap-5 p-5 rounded-2xl border border-white/5 bg-black/20 hover:bg-white/[0.05] hover:border-white/10 transition-all group text-left"
    >
        <div className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20 group-hover:border-${color}-500/40 transition-all`}>
            <Icon className={`w-6 h-6 text-${color}-400 group-hover:scale-110 transition-transform`} />
        </div>
        <div className="flex-grow">
            <h5 className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{title}</h5>
            <p className="text-[10px] text-gray-500 font-medium">{desc}</p>
        </div>
    </button>
);

export default ToolOrchestrator;
