
import React, { useState, useRef, useEffect } from 'react';
import { Chat, GenerateContentResponse } from '@google/genai';
import { initChatWithIntegratedTools, connectToWarRoom, handleIntegratedMessage } from '../services/geminiService';
import { formatErrorMessage } from '../utils/error';
import { ChatMessage } from '../types';
import { SendIcon, MicIcon, CheckIcon, KeyIcon, SparklesIcon, HeadphonesIcon, EyeIcon, RefreshIcon } from './icons';
import { decode, decodeAudioData, encode } from '../utils/audio';

const Assistant: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isWarRoomActive, setIsWarRoomActive] = useState(false);
    const [groundingSources, setGroundingSources] = useState<{title: string, uri: string}[]>([]);
    const [hasThoughtSignature, setHasThoughtSignature] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const liveSessionRef = useRef<any>(null);
    const nextStartTimeRef = useRef(0);

    useEffect(() => {
        setChat(initChatWithIntegratedTools());
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chat || isLoading) return;
        setMessages(prev => [...prev, { role: 'user', parts: [{ text: input }] }]);
        setInput('');
        setIsLoading(true);
        setGroundingSources([]);

        try {
            const result = await handleIntegratedMessage(chat, input);
            const metadata = (result as any).candidates?.[0]?.groundingMetadata;
            
            // Check for persistent state (Interactions API simulation)
            if ((result as any).thoughtSignature) setHasThoughtSignature(true);

            if (metadata?.groundingChunks) {
                setGroundingSources(metadata.groundingChunks.filter((c: any) => c.web).map((c: any) => ({ title: c.web.title, uri: c.web.uri })));
            }
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: result.text || "Analysis synthesized." }] }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: `NODE_FAULT: ${formatErrorMessage(err)}` }] }]);
        } finally { setIsLoading(false); }
    };

    const startWarRoom = async () => {
        if (isWarRoomActive) { liveSessionRef.current?.close(); setIsWarRoomActive(false); return; }
        try {
            setIsWarRoomActive(true);
            if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            liveSessionRef.current = await connectToWarRoom({
                onopen: () => {
                    const inputContext = new AudioContext({ sampleRate: 16000 });
                    const source = inputContext.createMediaStreamSource(stream);
                    const scriptProcessor = inputContext.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const int16 = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                        if (liveSessionRef.current) {
                            liveSessionRef.current.sendRealtimeInput({ 
                                media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
                            });
                        }
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputContext.destination);
                },
                onmessage: async (msg: any) => {
                    if (msg.thoughtSignature) setHasThoughtSignature(true);
                    const audioBase64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioBase64 && audioContextRef.current) {
                        const buffer = await decodeAudioData(decode(audioBase64), audioContextRef.current, 24000, 1);
                        const source = audioContextRef.current.createBufferSource();
                        source.buffer = buffer;
                        source.connect(audioContextRef.current.destination);
                        const startAt = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                        source.start(startAt);
                        nextStartTimeRef.current = startAt + buffer.duration;
                    }
                },
                onerror: () => setIsWarRoomActive(false),
                onclose: () => setIsWarRoomActive(false)
            });
        } catch (err) { 
            alert(`WAR_ROOM_BRIDGE_FAILURE: ${formatErrorMessage(err)}`); 
            setIsWarRoomActive(false); 
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-16rem)] glass-panel rounded-[3rem] border-white/5 overflow-hidden shadow-2xl relative">
            <header className="p-8 bg-white/[0.02] border-b border-white/5 flex justify-between items-center relative z-20">
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${isWarRoomActive ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}></div>
                    <h3 className="text-sm font-black uppercase tracking-[0.4em] text-gray-200 italic">Command Strategist v4</h3>
                </div>
                <div className="flex items-center gap-6">
                    {hasThoughtSignature && (
                        <div className="flex items-center gap-2 text-[8px] font-mono text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20 animate-fade-in uppercase">
                            <CheckIcon className="w-3 h-3" /> THOUGHT_SIGNATURE_LOCKED
                        </div>
                    )}
                    <button 
                        onClick={startWarRoom}
                        className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${isWarRoomActive ? 'bg-red-600 text-white border-red-500 shadow-red-500/20' : 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/20'}`}
                    >
                        <HeadphonesIcon className="w-4 h-4" />
                        {isWarRoomActive ? 'DISCONNECT FEED' : 'OPEN WAR ROOM VOICE'}
                    </button>
                </div>
            </header>

            <div className="flex-grow p-10 space-y-8 overflow-y-auto custom-scrollbar bg-black/30">
                {messages.length === 0 && !isWarRoomActive && (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-30 animate-fade-in">
                        <SparklesIcon className="w-20 h-20 text-indigo-400 mb-10 animate-float" />
                        <h4 className="text-3xl font-black mb-4 italic tracking-tighter uppercase">Grounding Mesh Ready</h4>
                        <p className="text-xs text-gray-500 leading-relaxed font-bold uppercase tracking-[0.2em]">Connected to Cloud Storage Node & Dubai Market Intel. Issue a strategic command to begin.</p>
                    </div>
                )}
                
                {isWarRoomActive && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-12 animate-fade-in">
                        <div className="relative">
                            <div className="w-48 h-48 bg-red-600/5 rounded-full flex items-center justify-center border border-red-500/20 shadow-inner">
                                <MicIcon className="w-20 h-20 text-red-500/60" />
                            </div>
                            <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping pointer-events-none"></div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-4xl font-black uppercase tracking-[0.5em] text-red-400 italic">LIVE_VOICE_TX</h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">Strategist is analyzing audio stream for conversion patterns.</p>
                        </div>
                    </div>
                )}

                {!isWarRoomActive && messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                        <div className={`max-w-[75%] p-8 rounded-[2.5rem] text-sm leading-relaxed shadow-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white font-bold italic' : 'bg-white/[0.03] border border-white/5 text-gray-200'}`}>
                           <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                           {msg.role === 'model' && groundingSources.length > 0 && i === messages.length - 1 && (
                               <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
                                   <div className="flex items-center gap-3 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                        <EyeIcon className="w-4 h-4" /> Grounded Intelligence Sources:
                                   </div>
                                   <div className="grid gap-3">
                                       {groundingSources.map((s, idx) => (
                                           <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="block p-4 bg-black/40 rounded-2xl border border-white/5 text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/10 transition-all truncate group">
                                               <span className="opacity-40 mr-3 group-hover:opacity-100 transition-opacity">INTEL_NODE_{idx+1}:</span> {s.title}
                                           </a>
                                       ))}
                                   </div>
                               </div>
                           )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-8 bg-white/[0.02] border-t border-white/5 relative z-20">
                <div className="flex items-center gap-6 bg-black/60 border border-white/10 rounded-[2rem] p-3 pl-8 shadow-inner focus-within:border-indigo-500/50 transition-all">
                    <input
                        type="text"
                        value={input}
                        disabled={isWarRoomActive || isLoading}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder={isWarRoomActive ? "VOICE_TX_ACTIVE..." : "ISSUE_MISSION_DIRECTIVE..."}
                        className="flex-grow bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-200 placeholder-gray-800 tracking-tight"
                    />
                    <button onClick={handleSend} disabled={isLoading || isWarRoomActive} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-900 w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl group">
                        {isLoading ? <RefreshIcon className="w-6 h-6 text-white animate-spin" /> : <SendIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform"/>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Assistant;
