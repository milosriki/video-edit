import React, { useState, useRef, useEffect } from 'react';
import { Chat } from '@google/genai';
import { initChatWithIntegratedTools, connectToWarRoom, handleIntegratedMessage } from '../services/geminiService';
import { formatErrorMessage } from '../utils/error';
import { ChatMessage } from '../types';
import { SendIcon, MicIcon, CheckIcon, KeyIcon, SparklesIcon, HeadphonesIcon } from './icons';
import { decode, decodeAudioData, encode } from '../utils/audio';

const Assistant: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isWarRoomActive, setIsWarRoomActive] = useState(false);
    const [groundingSources, setGroundingSources] = useState<{title: string, uri: string}[]>([]);
    
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
            if (metadata?.groundingChunks) {
                setGroundingSources(metadata.groundingChunks.filter((c: any) => c.web).map((c: any) => ({ title: c.web.title, uri: c.web.uri })));
            }
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: result.text || "Analysis complete." }] }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Error: ${formatErrorMessage(err)}` }] }]);
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
                        liveSessionRef.current.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputContext.destination);
                },
                onmessage: async (msg) => {
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
                onerror: (e) => console.error(e),
                onclose: () => setIsWarRoomActive(false)
            });
        } catch (err) { alert(formatErrorMessage(err)); setIsWarRoomActive(false); }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-16rem)] glass-panel rounded-3xl border-white/5 overflow-hidden shadow-2xl">
            <header className="p-6 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${isWarRoomActive ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`}></div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-200">Ad Command Strategist</h3>
                </div>
                <button 
                    onClick={startWarRoom}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isWarRoomActive ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-indigo-600/10 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/20'}`}
                >
                    <HeadphonesIcon className="w-3.5 h-3.5" />
                    {isWarRoomActive ? 'DISCONNECT' : 'WAR ROOM VOICE'}
                </button>
            </header>

            <div className="flex-grow p-8 space-y-6 overflow-y-auto custom-scrollbar bg-black/20">
                {messages.length === 0 && !isWarRoomActive && (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto opacity-50">
                        <SparklesIcon className="w-12 h-12 text-indigo-400 mb-6 animate-float" />
                        <h4 className="text-xl font-black mb-2">Omnichannel Intel Ready</h4>
                        <p className="text-xs text-gray-500 leading-relaxed font-bold uppercase tracking-wider">Ask me about your HubSpot deals, Meta insights, or current market trends in Dubai.</p>
                    </div>
                )}
                
                {isWarRoomActive && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-pulse">
                        <div className="w-32 h-32 bg-red-500/5 rounded-full flex items-center justify-center border border-red-500/20 relative">
                            <MicIcon className="w-12 h-12 text-red-500/40" />
                            <div className="absolute inset-0 bg-red-500/10 rounded-full animate-ping"></div>
                        </div>
                        <div>
                            <h4 className="text-2xl font-black uppercase tracking-[0.3em] text-red-400">Recording</h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">Voice protocol active. Speak your strategy query.</p>
                        </div>
                    </div>
                )}

                {!isWarRoomActive && messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white font-semibold' : 'bg-white/5 border border-white/5 text-gray-300'}`}>
                           <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                           {msg.role === 'model' && groundingSources.length > 0 && i === messages.length - 1 && (
                               <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
                                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Market Sources:</p>
                                   {groundingSources.map((s, idx) => (
                                       <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="block text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                                           🔗 {s.title}
                                       </a>
                                   ))}
                               </div>
                           )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-white/[0.02] border-t border-white/5">
                <div className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-2xl p-2 pl-4">
                    <input
                        type="text"
                        value={input}
                        disabled={isWarRoomActive || isLoading}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder={isWarRoomActive ? "Speaking to AI..." : "Enter strategic command..."}
                        className="flex-grow bg-transparent border-none focus:ring-0 text-sm text-gray-200 placeholder-gray-600"
                    />
                    <button onClick={handleSend} disabled={isLoading || isWarRoomActive} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 w-10 h-10 rounded-xl flex items-center justify-center transition-all">
                        {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <SendIcon className="w-4 h-4 text-white"/>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Assistant;
