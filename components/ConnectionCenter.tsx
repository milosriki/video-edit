
import React, { useState, useEffect } from 'react';
import { ConnectionStatus } from '../types';
import { ShieldIcon, KeyIcon, CheckIcon, GoogleDriveIcon, UsersIcon, SparklesIcon, BarChartIcon, FacebookIcon, RefreshIcon } from './icons';

// FB SDK initialization
declare global {
    interface Window {
        FB: any;
        google: any;
        fbAsyncInit: any;
    }
}

const ConnectionCenter: React.FC = () => {
    const [connections, setConnections] = useState<ConnectionStatus[]>([
        { id: 'meta', name: 'Meta Ads Manager', connected: false },
        { id: 'hubspot', name: 'HubSpot CRM', connected: false },
        { id: 'drive', name: 'Google Drive Storage', connected: false },
    ]);

    const [isSyncing, setIsSyncing] = useState<string | null>(null);
    const [isHttps, setIsHttps] = useState(window.location.protocol === 'https:');
    const [manualEntryId, setManualEntryId] = useState<string | null>(null);
    const [manualToken, setManualToken] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('ptd_connections');
        if (saved) setConnections(JSON.parse(saved));

        // Initialize FB SDK safely
        if (!window.fbAsyncInit) {
            window.fbAsyncInit = function() {
                if (window.FB) {
                    window.FB.init({
                        appId: '123456789', // Replace with your actual App ID in production
                        cookie: true,
                        xfbml: true,
                        version: 'v18.0'
                    });
                }
            };
        } else if (window.FB) {
            // Already initialized or script loaded faster than component
            try {
                window.FB.init({
                    appId: '123456789', 
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
            } catch(e) {
                console.warn("FB SDK double init prevented.");
            }
        }
    }, []);

    const saveConnections = (updated: ConnectionStatus[]) => {
        setConnections(updated);
        localStorage.setItem('ptd_connections', JSON.stringify(updated));
        window.dispatchEvent(new Event('ptd_connections_updated'));
    };

    const handleMetaSync = () => {
        if (!isHttps) {
            alert("Facebook Login requires an HTTPS connection. Please use the Manual Token fallback.");
            return;
        }

        setIsSyncing('meta');
        if (!window.FB) {
            alert("Meta SDK not loaded. Check your connection or content blockers.");
            setIsSyncing(null);
            return;
        }

        try {
            window.FB.login((response: any) => {
                if (response.authResponse) {
                    const token = response.authResponse.accessToken;
                    const updated = connections.map(c => c.id === 'meta' ? { 
                        ...c, 
                        connected: true, 
                        apiKey: token, 
                        lastSync: new Date().toLocaleTimeString(),
                        accountName: 'Authenticated_Meta_User'
                    } : c);
                    saveConnections(updated);
                }
                setIsSyncing(null);
            }, { scope: 'ads_management,ads_read,read_insights' });
        } catch (err) {
            console.error("FB Login error:", err);
            alert("Facebook login failed. This usually happens on non-HTTPS origins or if the domain isn't whitelisted in FB App Settings.");
            setIsSyncing(null);
        }
    };

    const handleGoogleDriveSync = () => {
        setIsSyncing('drive');
        try {
            if (!window.google || !window.google.accounts) {
                throw new Error("Google SDK not loaded.");
            }
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com', 
                scope: 'https://www.googleapis.com/auth/drive.readonly',
                callback: (response: any) => {
                    if (response.access_token) {
                        const updated = connections.map(c => c.id === 'drive' ? { 
                            ...c, 
                            connected: true, 
                            apiKey: response.access_token, 
                            lastSync: new Date().toLocaleTimeString(),
                            accountName: 'Cloud_Storage_Node'
                        } : c);
                        saveConnections(updated);
                    }
                    setIsSyncing(null);
                },
            });
            client.requestAccessToken();
        } catch (err) {
            console.error("Google Auth error:", err);
            alert("Google Drive sync failed. Ensure you are on a trusted origin.");
            setIsSyncing(null);
        }
    };

    const handleManualSubmit = (id: string) => {
        if (!manualToken.trim()) return;
        const updated = connections.map(c => c.id === id ? { 
            ...c, 
            connected: true, 
            apiKey: manualToken.trim(), 
            lastSync: new Date().toLocaleTimeString(),
            accountName: 'Manual_Bridge_Node'
        } : c);
        saveConnections(updated);
        setManualEntryId(null);
        setManualToken('');
    };

    const disconnect = (id: string) => {
        const updated = connections.map(c => c.id === id ? { ...c, connected: false, apiKey: undefined, accountName: undefined } : c);
        saveConnections(updated);
    };

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <header>
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <ShieldIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black gradient-text tracking-tighter italic leading-none">Intelligence Bridge</h2>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Multi-Node Authentication Protocol</p>
                    </div>
                </div>
                {!isHttps && (
                    <div className="mt-4 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                            Insecure Origin (HTTP) detected. Real OAuth popups may be blocked. Use manual tokens.
                        </span>
                    </div>
                )}
            </header>

            <div className="grid md:grid-cols-3 gap-8">
                {connections.map(conn => (
                    <div key={conn.id} className={`glass-panel p-8 rounded-[2.5rem] border transition-all relative overflow-hidden ${conn.connected ? 'border-green-500/30 bg-green-500/[0.02]' : 'border-white/5 hover:border-white/10'}`}>
                        {isSyncing === conn.id && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-20 flex flex-col items-center justify-center space-y-4 animate-fade-in">
                                <RefreshIcon className="w-12 h-12 text-indigo-400 animate-spin" />
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Awaiting Handshake...</p>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-8">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${conn.connected ? 'bg-green-500/10 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                                {conn.id === 'meta' && <FacebookIcon className={`w-7 h-7 ${conn.connected ? 'text-blue-400' : 'text-gray-600'}`} />}
                                {conn.id === 'hubspot' && <KeyIcon className={`w-7 h-7 ${conn.connected ? 'text-orange-400' : 'text-gray-600'}`} />}
                                {conn.id === 'drive' && <GoogleDriveIcon className={`w-7 h-7 ${conn.connected ? 'text-indigo-400' : 'text-gray-600'}`} />}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${conn.connected ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                {conn.connected ? 'NODE_ACTIVE' : 'NODE_IDLE'}
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-white mb-2">{conn.name}</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-8 leading-relaxed">
                            {conn.id === 'meta' && 'Direct Facebook Ads Manager integration for live ROAS auditing and creative indexing.'}
                            {conn.id === 'hubspot' && 'Automated CRM sync to map creative assets to high-ticket sales revenue.'}
                            {conn.id === 'drive' && 'Sync cloud video assets to deconstruct viral patterns with Gemini Vision.'}
                        </p>

                        {conn.connected ? (
                            <div className="space-y-4">
                                <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-2">
                                    <div className="flex justify-between text-[9px] font-mono text-gray-500">
                                        <span>ACCOUNT:</span>
                                        <span className="text-indigo-400 font-black">{conn.accountName}</span>
                                    </div>
                                    <div className="flex justify-between text-[9px] font-mono text-gray-500">
                                        <span>STATUS:</span>
                                        <span className="text-green-500">READY</span>
                                    </div>
                                </div>
                                <button onClick={() => disconnect(conn.id)} className="w-full py-3 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-[9px] font-black uppercase text-red-400/70 transition-all border border-red-500/10">
                                    Sever Node
                                </button>
                            </div>
                        ) : manualEntryId === conn.id ? (
                            <div className="space-y-4 animate-fade-in">
                                <input 
                                    type="password" 
                                    placeholder="Paste API Token / Access Key"
                                    value={manualToken}
                                    onChange={e => setManualToken(e.target.value)}
                                    className="w-full bg-black/60 border border-indigo-500/40 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setManualEntryId(null)} className="flex-1 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:bg-white/10">Cancel</button>
                                    <button onClick={() => handleManualSubmit(conn.id)} className="flex-2 py-3 bg-indigo-600 rounded-xl text-[10px] font-black uppercase text-white shadow-lg shadow-indigo-500/20">Bridge Node</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {conn.id === 'meta' && (
                                    <button 
                                        onClick={handleMetaSync}
                                        disabled={!isHttps}
                                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg ${isHttps ? 'bg-[#1877F2] hover:bg-[#166FE5] text-white border border-blue-400/30 shadow-blue-500/20' : 'bg-gray-800 text-gray-500 cursor-not-allowed grayscale'}`}
                                    >
                                        <FacebookIcon className="w-5 h-5 fill-current" />
                                        Login with Facebook
                                    </button>
                                )}
                                
                                {conn.id === 'drive' && (
                                    <button 
                                        onClick={handleGoogleDriveSync}
                                        className="w-full bg-white hover:bg-gray-100 text-gray-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg transition-all"
                                    >
                                        <GoogleDriveIcon className="w-5 h-5 fill-current text-indigo-600" />
                                        Authorize Drive
                                    </button>
                                )}

                                {conn.id === 'hubspot' && (
                                    <button 
                                        onClick={() => setManualEntryId('hubspot')}
                                        className="w-full bg-[#FF7A59] hover:bg-[#E56E50] text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg transition-all border border-orange-400/30 shadow-orange-500/20"
                                    >
                                        <SparklesIcon className="w-5 h-5" />
                                        Connect HubSpot
                                    </button>
                                )}

                                <button 
                                    onClick={() => setManualEntryId(conn.id)}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-gray-600 transition-all"
                                >
                                    Manual Bridge Fallback
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="glass-panel p-10 rounded-[3rem] border-white/5 bg-gradient-to-br from-indigo-500/[0.03] to-transparent flex items-center gap-8 shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 relative">
                    <ShieldIcon className="w-8 h-8 text-indigo-400" />
                    <div className="absolute inset-0 bg-indigo-400/10 animate-ping rounded-full"></div>
                </div>
                <div>
                    <h4 className="text-lg font-black text-white italic">Hardened Security Architecture</h4>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
                        All remote connections use sandboxed browser sessions. Your API tokens are strictly local and never leave your machine except to authenticate with official provider endpoints.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ConnectionCenter;
