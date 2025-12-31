import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldIcon, RefreshIcon, BarChartIcon, 
  CheckIcon, WandIcon, SlidersIcon, GlobeIcon, 
  TerminalIcon, KeyIcon, SendIcon, DownloadIcon, EyeIcon
} from './icons';
import { sendMcpSignal } from '../services/geminiService';

interface CLILog {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'EXEC' | 'AI' | 'UPLINK';
    message: string;
    model?: string;
}

const CLISyncNode: React.FC = () => {
    const [logs, setLogs] = useState<CLILog[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [activeTab, setActiveTab] = useState<'terminal' | 'config'>('terminal');
    const [uplinkMsg, setUplinkMsg] = useState('');
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [sessionId, setSessionId] = useState('PTD_MINI_' + Math.random().toString(36).substr(2, 6).toUpperCase());
    const terminalRef = useRef<HTMLDivElement>(null);

    const mcpManifest = {
        mcp_version: "2025.12.31",
        node_id: sessionId,
        runtime: "gemini-3-flash-preview",
        transport: "websocket",
        endpoint: "wss://ptd-command-center.local/mcp/v1",
        capabilities: ["scan_drive", "analyze_conversion", "blueprint_gen"]
    };

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    const addLog = (level: CLILog['level'], message: string, model?: string) => {
        setLogs(prev => [...prev, { 
            timestamp: new Date().toLocaleTimeString(), 
            level, 
            message,
            model
        }].slice(-100));
    };

    const connectToCLI = () => {
        setIsConnected(true);
        addLog('INFO', 'Initializing Handshake with Mini CLI...');
        
        const interval = setInterval(async () => {
            try {
                const res = await fetch('https://ad-alpha-mcp-489769736562.us-central1.run.app/mcp/signal/pending');
                const data = await res.json();
                if (data.command) {
                    addLog('AI', `SIGNAL_RECEIVED: ${data.command}`, 'GEMINI_3_PRO');
                }
            } catch (e) {
                console.warn("Uplink unstable...");
            }
        }, 5000);

        return () => clearInterval(interval);
    };

    const handleSendSignal = async () => {
        if (!uplinkMsg.trim() || isTransmitting) return;
        
        setIsTransmitting(true);
        addLog('UPLINK', `>>> SIG_TX: ${uplinkMsg}`);
        const currentMsg = uplinkMsg;
        setUplinkMsg('');

        try {
            const response = await sendMcpSignal(currentMsg);
            addLog('AI', `<<< SIG_ACK: ${response}`, 'GEMINI_3_FLASH');
        } catch (e) {
            addLog('WARN', `!!! SIG_FAIL: Connection timed out.`);
        } finally {
            setIsTransmitting(false);
        }
    };

    const copyManifest = () => {
        navigator.clipboard.writeText(JSON.stringify(mcpManifest, null, 2));
        alert("MANIFEST_COPIED: Paste into your local .mcp-config.json");
    };

    return (
        <div className="space-y-10 animate-fade-in pb-40 max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-4xl font-black gradient-text tracking-tighter italic flex items-center gap-4">
                        Mini CLI Satellite
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black not-italic animate-pulse">Flash_Ready</span>
                    </h2>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.3em] mt-2">Ultra-Low Latency Bridge for Gemini 3 Flash CLI</p>
                </div>
                <div className="flex gap-4 p-1 bg-white/5 rounded-2xl border border-white/5">
                    <button 
                        onClick={() => setActiveTab('terminal')}
                        className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'terminal' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Terminal_Stream
                    </button>
                    <button 
                        onClick={() => setActiveTab('config')}
                        className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Handshake_Spec
                    </button>
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-6">
                    {activeTab === 'terminal' ? (
                        <div className="space-y-6">
                            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl bg-[#010409] group">
                                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-10 bg-[length:100%_2px,3px_100%] opacity-40"></div>
                                <div className="p-4 bg-zinc-900/60 border-b border-white/5 flex items-center justify-between relative z-20">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                                        <div className="w-3 h-3 rounded-full bg-amber-500/20"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                                    </div>
                                    <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest italic">PTD_MINI_SHELL_v2.0 // GEMINI_3_FLASH</span>
                                </div>
                                <div ref={terminalRef} className="h-[450px] overflow-y-auto p-10 font-mono text-[11px] leading-relaxed relative z-0 custom-scrollbar scroll-smooth">
                                    {!isConnected ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                                            <TerminalIcon className="w-16 h-16 text-indigo-500" />
                                            <p className="text-xs font-black uppercase tracking-[0.4em]">INITIATE SATELLITE HANDSHAKE TO PROCEED</p>
                                        </div>
                                    ) : logs.map((log, i) => (
                                        <div key={i} className="mb-2 flex gap-4 animate-fade-in-up">
                                            <span className="text-zinc-700 shrink-0">[{log.timestamp}]</span>
                                            <span className={`shrink-0 font-black ${
                                                log.level === 'AI' ? 'text-indigo-400' :
                                                log.level === 'EXEC' ? 'text-amber-500/60' :
                                                log.level === 'UPLINK' ? 'text-green-400' :
                                                'text-zinc-600'
                                            }`}>
                                                [{log.level}]
                                            </span>
                                            <div className="flex-grow">
                                                <span className={log.level === 'AI' ? 'text-gray-300 italic' : log.level === 'UPLINK' ? 'text-green-300 font-bold' : 'text-zinc-400'}>
                                                    {log.message}
                                                </span>
                                                {log.model && (
                                                    <span className="ml-3 text-[8px] font-black text-indigo-500/40 border border-indigo-500/20 px-1.5 rounded uppercase">{log.model}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="glass-panel p-4 rounded-[2rem] border-white/5 bg-zinc-900/50 flex gap-4 items-center">
                                <input 
                                    type="text"
                                    value={uplinkMsg}
                                    disabled={!isConnected || isTransmitting}
                                    onChange={e => setUplinkMsg(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSendSignal()}
                                    className="flex-grow bg-transparent border-none focus:ring-0 text-sm font-mono text-white placeholder-zinc-800"
                                    placeholder={isConnected ? "TRANSMIT_SIGNAL: Type command..." : "AWAITING_SAT_LINK..."}
                                />
                                <button onClick={handleSendSignal} disabled={!isConnected || isTransmitting || !uplinkMsg.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 text-white p-3 rounded-xl transition-all shadow-lg active:scale-95">
                                    {isTransmitting ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <SendIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel p-10 rounded-[3rem] border-white/5 bg-black space-y-8 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black text-white italic">Handshake Configuration</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Protocol Manifest v2025.12.31</p>
                                </div>
                                <button onClick={copyManifest} className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:text-indigo-300">
                                    <DownloadIcon className="w-4 h-4" /> COPY_JSON
                                </button>
                            </div>
                            <pre className="bg-zinc-900 p-8 rounded-3xl font-mono text-[12px] text-indigo-300/80 border border-white/5 overflow-x-auto shadow-inner leading-relaxed">
                                {JSON.stringify(mcpManifest, null, 4)}
                            </pre>
                            <div className="p-8 bg-indigo-500/5 rounded-3xl border border-indigo-500/20 space-y-4">
                                <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Initialization Command</h4>
                                <div className="bg-black/60 p-4 rounded-xl font-mono text-xs text-gray-400 border border-white/5 flex justify-between items-center">
                                    <code>ptd-mini connect --node={sessionId} --flash</code>
                                    <CheckIcon className="w-4 h-4 text-green-500" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 space-y-8 bg-gradient-to-br from-indigo-500/[0.05] to-transparent shadow-2xl">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <BarChartIcon className="w-4 h-4" />
                            TELEMETRY_DASH
                        </h3>
                        <div className="space-y-6">
                            {!isConnected ? (
                                <button 
                                    onClick={connectToCLI}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl text-[11px] uppercase tracking-[0.2em] transition-all shadow-3xl shadow-indigo-500/40 border border-white/10 active:scale-95 flex items-center justify-center gap-4"
                                >
                                    <RefreshIcon className="w-5 h-5" />
                                    OPEN_SATELLITE_LINK
                                </button>
                            ) : (
                                <>
                                    <ResourceStat label="Flash Throughput" value="1.2k req/s" progress={72} color="indigo" />
                                    <ResourceStat label="Drive Mesh Health" value="OPTIMAL" progress={100} color="green" />
                                    <ResourceStat label="CLI Token Buffer" value="84k / 1M" progress={8} color="amber" />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 space-y-6 bg-black/40">
                         <div className="flex items-center gap-3">
                             <ShieldIcon className="w-4 h-4 text-gray-600" />
                             <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Node Status</h4>
                         </div>
                         <div className="space-y-3">
                             <StatusRow label="GSI_ENCRYPTED" status="TRUE" active={true} />
                             <StatusRow label="DRIVE_SYNC_HOT" status="ACTIVE" active={isConnected} />
                             <StatusRow label="A2A_PROTOCOL" status="MESH" active={true} />
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResourceStat = ({ label, value, progress, color }: { label: string, value: string, progress: number, color: string }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-end px-1">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
            <span className={`text-[10px] font-mono font-bold text-${color}-400`}>{value}</span>
        </div>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full bg-${color}-500 shadow-[0_0_8px_rgba(99,102,241,0.4)] transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
        </div>
    </div>
);

const StatusRow = ({ label, status, active }: { label: string, status: string, active: boolean }) => (
    <div className={`flex justify-between items-center p-3 rounded-xl border border-white/5 ${active ? 'bg-white/5 text-gray-300' : 'opacity-20 text-gray-700'}`}>
        <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
        <span className={`text-[9px] font-mono font-bold ${active ? 'text-green-500' : ''}`}>{status}</span>
    </div>
);

export default CLISyncNode;
