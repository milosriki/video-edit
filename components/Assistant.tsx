import React, { useState, useRef, useEffect } from 'react';
import { Chat, LiveServerMessage } from '@google/genai';
import { initChat, connectLive } from '../services/geminiService';
import { formatErrorMessage } from '../utils/error';
import { ChatMessage } from '../types';
import { SendIcon, MicIcon } from './icons';
import { encode, decode, decodeAudioData } from '../utils/audio';

const Spinner = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

const Chatbot: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setChat(initChat());
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

        try {
            const stream = await chat.sendMessageStream({ message: input });
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);
            
            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: modelResponse }] };
                    return newMessages;
                });
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Error: ${formatErrorMessage(err)}` }] }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full bg-gray-800/50 rounded-lg border border-gray-700 max-w-2xl mx-auto">
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                           <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Ask your AI strategist..."
                    className="flex-grow bg-gray-900 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={handleSend} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 p-3 rounded-lg">
                    {isLoading ? <Spinner/> : <SendIcon className="w-5 h-5"/>}
                </button>
            </div>
        </div>
    );
};


const VoiceAssistant: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [transcripts, setTranscripts] = useState<{user: string, model: string}[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef(0);
    
    const handleToggleConnection = async () => {
        if (isConnected) {
            const session = await sessionPromiseRef.current;
            session?.close();
            return;
        }

        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsConnected(true);
            
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = 0;

            sessionPromiseRef.current = connectLive({
                onopen: async () => {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaStreamSourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(stream);
                    scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const int16 = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                        sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle transcription
                    if (message.serverContent?.inputTranscription) {
                        setCurrentInput(prev => prev + message.serverContent.inputTranscription.text);
                    }
                    if (message.serverContent?.outputTranscription) {
                        setCurrentOutput(prev => prev + message.serverContent.outputTranscription.text);
                    }
                    if(message.serverContent?.turnComplete) {
                        setTranscripts(prev => [...prev, {user: currentInput, model: currentOutput}]);
                        setCurrentInput('');
                        setCurrentOutput('');
                    }

                    // Handle audio playback
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        const ctx = outputAudioContextRef.current!;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                        const source = ctx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(ctx.destination);
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                    }
                },
                onerror: (e) => console.error(e),
                onclose: () => {
                    setIsConnected(false);
                    mediaStreamSourceRef.current?.disconnect();
                    scriptProcessorRef.current?.disconnect();
                    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
                        inputAudioContextRef.current.close();
                    }
                    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
                        outputAudioContextRef.current.close();
                    }
                }
            });
        } catch (err) {
            console.error(err);
            alert("Could not start voice session. Please grant microphone permissions.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-800/50 rounded-lg border border-gray-700 max-w-2xl mx-auto p-4 space-y-4">
            <button onClick={handleToggleConnection} className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-colors ${isConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                <MicIcon className="w-10 h-10"/>
            </button>
            <p className="text-center font-semibold">{isConnected ? "Session Active - Start Speaking" : "Tap to Start Voice Session"}</p>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto bg-gray-900/50 rounded-lg min-h-[200px]">
                {transcripts.map((t, i) => (
                    <div key={i}>
                        <p><strong className="text-indigo-400">You:</strong> {t.user}</p>
                        <p><strong className="text-purple-400">AI:</strong> {t.model}</p>
                    </div>
                ))}
                 {currentInput && <p><strong className="text-indigo-400">You:</strong> {currentInput}</p>}
                 {currentOutput && <p><strong className="text-purple-400">AI:</strong> {currentOutput}</p>}
            </div>
        </div>
    );
}

const Assistant: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat');
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">AI Assistant</h2>
             <div className="flex gap-2 p-1 bg-gray-900/50 rounded-lg border border-gray-700 max-w-sm mx-auto">
                <button onClick={() => setActiveTab('chat')} className={`flex-1 p-2 rounded-md font-semibold ${activeTab === 'chat' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>Chatbot</button>
                <button onClick={() => setActiveTab('voice')} className={`flex-1 p-2 rounded-md font-semibold ${activeTab === 'voice' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>Voice Assistant</button>
            </div>
            <div className="h-[60vh]">
                {activeTab === 'chat' && <Chatbot />}
                {activeTab === 'voice' && <VoiceAssistant />}
            </div>
        </div>
    );
};

export default Assistant;