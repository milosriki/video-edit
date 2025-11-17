import React, { useState, useRef, useEffect } from 'react';
import { generateSpeech, transcribeAudio } from '../services/geminiService';
import { formatErrorMessage } from '../utils/error';
import { decode, decodeAudioData } from '../utils/audio';
import { HeadphonesIcon, MicIcon, SparklesIcon, PlayIcon, PauseIcon } from './icons';

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const TextToSpeech: React.FC = () => {
    const [text, setText] = useState("Hello! This is an AI-generated voiceover for my new ad campaign.");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer|null>(null);

    useEffect(() => {
        // Initialize AudioContext on user interaction (or component mount)
        if(!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        // Cleanup
        return () => {
            audioSourceRef.current?.stop();
        }
    }, []);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setAudioBuffer(null);
        setIsPlaying(false);
        try {
            const base64Audio = await generateSpeech(text);
            const audioBytes = decode(base64Audio);
            const buffer = await decodeAudioData(audioBytes, audioContextRef.current!, 24000, 1);
            setAudioBuffer(buffer);
        } catch (err) {
            setError(formatErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };
    
    const togglePlayback = () => {
        if (isPlaying) {
            audioSourceRef.current?.stop();
            setIsPlaying(false);
        } else if (audioBuffer && audioContextRef.current) {
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.onended = () => setIsPlaying(false);
            source.start(0);
            audioSourceRef.current = source;
            setIsPlaying(true);
        }
    }

    return (
        <div className="space-y-4">
            {error && <p className="text-red-400 text-sm p-3 bg-red-900/30 rounded-md">{error}</p>}
            <textarea value={text} onChange={e => setText(e.target.value)} rows={4} className="w-full p-2 bg-gray-900/70 border border-gray-600 rounded-lg" placeholder="Enter text for voiceover..."/>
            <button onClick={handleGenerate} disabled={isLoading} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                {isLoading ? <Spinner /> : <SparklesIcon className="w-5 h-5"/>} Generate Speech
            </button>
            {audioBuffer && (
                <div className="flex items-center gap-4 p-3 bg-gray-900/50 rounded-lg">
                    <button onClick={togglePlayback} className="p-2 bg-indigo-600 rounded-full">
                        {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                    </button>
                    <p className="text-gray-300">Playback Generated Audio</p>
                </div>
            )}
        </div>
    )
}

const Transcriber: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [error, setError] = useState<string|null>(null);
    const mediaRecorderRef = useRef<MediaRecorder|null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleToggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                mediaRecorderRef.current.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };
                mediaRecorderRef.current.onstop = handleTranscribe;
                audioChunksRef.current = [];
                setTranscription('');
                setError(null);
                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (err) {
                setError("Could not access microphone. Please grant permission.");
            }
        }
    };
    
    const handleTranscribe = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const result = await transcribeAudio(audioBlob);
            setTranscription(result.map(w => w.word).join(' '));
        } catch(err) {
            setError(formatErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }
    
    return (
        <div className="space-y-4 text-center">
            <button onClick={handleToggleRecording} className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-colors ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                <MicIcon className="w-10 h-10"/>
            </button>
            <p className="text-lg font-semibold">{isRecording ? "Recording..." : "Tap to record"}</p>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {isLoading && <p>Transcribing...</p>}
            {transcription && <div className="p-4 bg-gray-900/50 rounded-md border border-gray-700 text-left text-gray-300">{transcription}</div>}
        </div>
    )
};


const AudioSuite: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'tts' | 'transcribe'>('tts');

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold">Audio Studio</h2>
             <div className="flex gap-2 p-1 bg-gray-900/50 rounded-lg border border-gray-700">
                <button onClick={() => setActiveTab('tts')} className={`flex-1 p-2 rounded-md font-semibold ${activeTab === 'tts' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>Text-to-Speech</button>
                <button onClick={() => setActiveTab('transcribe')} className={`flex-1 p-2 rounded-md font-semibold ${activeTab === 'transcribe' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}>Transcribe Mic</button>
            </div>
             <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                {activeTab === 'tts' && <TextToSpeech />}
                {activeTab === 'transcribe' && <Transcriber />}
            </div>
        </div>
    )
};

export default AudioSuite;