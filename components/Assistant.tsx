
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { initChatWithIntegratedTools, connectToWarRoom, handleIntegratedMessage } from '../services/geminiService';
import { formatErrorMessage } from '../utils/error';
import { ChatMessage } from '../types';
import { SendIcon, MicIcon, CheckIcon, KeyIcon, SparklesIcon, HeadphonesIcon } from './icons';
import { decode, decodeAudioData, encode } from '../utils/audio';

const Spinner = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const Assistant: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [metaConnected, setMetaConnected] = useState(false);
    const [hubspotConnected, setHubspotConnected] = useState(false);
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
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setGroundingSources([]);

        try {
            const result = await handleIntegratedMessage(chat, input);
            
            // Extract Search Grounding metadata if present
            const metadata = (result as any).candidates?.[0]?.groundingMetadata;
            if (metadata?.groundingChunks) {
                const sources = metadata.groundingChunks
                    .filter((c: any) => c.web)
                    .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
                setGroundingSources(sources);
            }

            const modelText = result.text || "I've processed your request using live market and CRM data.";
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: modelText }] }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Error: ${formatErrorMessage(err)}` }] }]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- WAR ROOM (LIVE API) LOGIC ---

    const startWarRoom = async () => {
        if (isWarRoomActive) {
            liveSessionRef.current?.close();
            setIsWarRoomActive(false);
            return;
        }

        try {
            setIsWarRoomActive(true);
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }

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
                        liveSessionRef.current.sendRealtimeInput({ 
                            media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
                        });
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
                onerror: (e) => console.error("War Room Error:", e),
                onclose: () => setIsWarRoomActive(false)
            });
        } catch (err) {
            alert("Could not activate War Room: " + formatErrorMessage(err));
            setIsWarRoomActive(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-800/50 rounded-lg border border-gray-700 max-w-4xl mx-auto overflow-hidden shadow-2xl">
            <header className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/60 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isWarRoomActive ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <h3 className="font-bold text-gray-100">Integrated Command Center</h3>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={startWarRoom}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isWarRoomActive ? 'bg-red-900/40 border-red-500 text-red-300' : 'bg-indigo-900/40 border-indigo-500 text-indigo-300 hover:bg-indigo-800/60'}`}
                    >
                        <HeadphonesIcon className="w-3.5 h-3.5" />
                        {isWarRoomActive ? 'EXIT WAR ROOM' : 'ENTER WAR ROOM'}
                    </button>
                    <div 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${metaConnected ? 'bg-green-900/40 border-green-500 text-green-300' : 'bg-gray-800 border-gray-600 text-gray-400'}`} 
                        onClick={() => setMetaConnected(!metaConnected)}
                    >
                        {metaConnected ? <CheckIcon className="w-3.5 h-3.5"/> : <KeyIcon className="w-3.5 h-3.5"/>}
                        {metaConnected ? 'Meta Active' : 'Link Meta'}
                    </div>
                    <div 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${hubspotConnected ? 'bg-orange-900/40 border-orange-500 text-orange-300' : 'bg-gray-800 border-gray-600 text-gray-400'}`} 
                        onClick={() => setHubspotConnected(!hubspotConnected)}
                    >
                        {hubspotConnected ? <CheckIcon className="w-3.5 h-3.5"/> : <KeyIcon className="w-3.5 h-3.5"/>}
                        {hubspotConnected ? 'HubSpot Linked' : 'Link HubSpot'}
                    </div>
                </div>
            </header>

            <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-900/30">
                {messages.length === 0 && !isWarRoomActive && (
                    <div className="text-center py-24 text-gray-500">
                        <SparklesIcon className="w-16 h-16 mx-auto mb-6 text-indigo-500/30" />
                        <h4 className="text-xl font-bold text-gray-300 mb-2">Omnichannel Strategy Active</h4>
                        <p className="max-w-md mx-auto mb-8">I am cross-referencing your HubSpot deals with your Meta creative performance.</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {["Which ad creative closed the most deals?", "What's my HubSpot LTV this month?", "Audit campaigns for high-value leads"].map(q => (
                                <button key={q} onClick={() => setInput(q)} className="px-4 py-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-sm text-gray-300 border border-gray-700 transition-colors">{q}</button>
                            ))}
                        </div>
                    </div>
                )}
                
                {isWarRoomActive && (
                    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center animate-pulse">
                        <div className="relative">
                            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/50">
                                <MicIcon className="w-10 h-10 text-red-500" />
                            </div>
                            <div className="absolute -inset-4 bg-red-500/10 rounded-full animate-ping"></div>
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold text-red-400">Integrated War Room</h4>
                            <p className="text-gray-400">Speak now. I can sync lead data to HubSpot as we talk.</p>
                        </div>
                    </div>
                )}

                {!isWarRoomActive && messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700/50'}`}>
                           <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                           {msg.role === 'model' && groundingSources.length > 0 && i === messages.length - 1 && (
                               <div className="mt-4 pt-3 border-t border-gray-700/50 space-y-1">
                                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Sources from Google Search:</p>
                                   {groundingSources.map((s, idx) => (
                                       <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="block text-xs text-indigo-400 hover:text-indigo-300 truncate">
                                           🔗 {s.title}
                                       </a>
                                   ))}
                               </div>
                           )}
                           {msg.role === 'model' && msg.parts[0].text.toLowerCase().includes('hubspot') && (
                               <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-orange-950/40 text-[10px] font-bold text-orange-400 border border-orange-500/20 uppercase">
                                   <CheckIcon className="w-2.5 h-2.5" /> HubSpot Verified
                               </div>
                           )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-gray-900/60 border-t border-gray-700/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        disabled={isWarRoomActive || isLoading}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder={isWarRoomActive ? "Speaking to AI..." : "Ask for revenue insights, deal statuses, or creative audits..."}
                        className="flex-grow bg-gray-950 border border-gray-800 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-gray-600 text-gray-100"
                    />
                    <button onClick={handleSend} disabled={isLoading || isWarRoomActive} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-800 p-4 rounded-2xl transition-all shadow-xl hover:shadow-indigo-500/30 flex items-center justify-center">
                        {isLoading ? <Spinner/> : <SendIcon className="w-5 h-5"/>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Assistant;
