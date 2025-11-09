import { AdCreative, EditScene, TranscribedWord } from '../types';

// Make FFmpeg types available globally
declare global {
    interface Window {
        FFmpeg: any;
    }
}

let ffmpeg: any;
let isFontLoaded = false;

// Function to load FFmpeg. It's a singleton pattern.
const loadFFmpeg = async (onLog: (log: string) => void): Promise<any> => {
    if (ffmpeg) {
        return ffmpeg;
    }
    const { FFmpeg } = window.FFmpeg;
    const coreURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js";

    const instance = new FFmpeg();
    instance.on('log', ({ message }: { message: string }) => {
        onLog(message);
    });
    
    await instance.load({
        coreURL,
    });
    ffmpeg = instance;
    return ffmpeg;
};

// Helper to convert a File object to a Uint8Array
const fileToUint8Array = (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(new Uint8Array(reader.result));
            } else {
                reject(new Error("Failed to read file as ArrayBuffer."));
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

const ensureFontIsLoaded = async (onLog: (log: string) => void) => {
    if (isFontLoaded || !ffmpeg) return;
    try {
        onLog("Loading custom font...");
        const fontResponse = await fetch('https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxK.woff2');
        const fontBlob = await fontResponse.arrayBuffer();
        await ffmpeg.writeFile('/fonts/Roboto-Regular.ttf', new Uint8Array(fontBlob));
        isFontLoaded = true;
        onLog("Custom font loaded.");
    } catch (e) {
        console.error("Failed to load custom font.", e);
        onLog("Warning: Could not load custom font. Text rendering may vary.");
    }
}

// Helper to parse timestamp string (e.g., "0s-2s") into start and end seconds
const parseTimestamp = (timestamp: string): { start: number; end: number, duration: number } => {
    const parts = timestamp.replace(/s/g, '').split('-');
    const start = parseFloat(parts[0]);
    const end = parseFloat(parts[1]);
    if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid timestamp format: ${timestamp}`);
    }
    return { start, end, duration: end - start };
};


// Main processing function for creating ad creatives
export const processVideoWithCreative = async (
    sourceVideo: File,
    adCreative: AdCreative,
    onProgress: (progress: { progress: number; message: string }) => void,
    onLog: (log: string) => void
): Promise<Blob> => {
    onProgress({ progress: 0, message: 'Loading FFmpeg...' });
    const ffmpegInstance = await loadFFmpeg(onLog);
    await ensureFontIsLoaded(onLog);
    onProgress({ progress: 0.1, message: 'FFmpeg loaded. Preparing video...' });

    const videoData = await fileToUint8Array(sourceVideo);
    const inputFileName = 'input.mp4';
    await ffmpegInstance.writeFile(inputFileName, videoData);

    const sceneFiles: string[] = [];
    const sceneDurations: number[] = [];
    const totalScenes = adCreative.editPlan.length;

    for (let i = 0; i < totalScenes; i++) {
        const scene = adCreative.editPlan[i];
        const { start, duration } = parseTimestamp(scene.timestamp);
        const outputSceneFile = `scene_${i}.mp4`;
        
        onProgress({
            progress: 0.1 + (0.6 * (i / totalScenes)),
            message: `Processing Scene ${i + 1}/${totalScenes}...`,
        });

        const vf_filters: string[] = [];

        if (scene.edit.toLowerCase().includes('quick zoom')) {
            vf_filters.push(`zoompan=z='min(zoom+0.0015,1.2)':d=${Math.ceil(duration * 25)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720`);
        }
        
        if (scene.overlayText && scene.overlayText !== 'N/A') {
            const safeText = scene.overlayText.replace(/'/g, "'\\''").replace(/:/g, '\\:');
            const fontPath = isFontLoaded ? `fontfile=/fonts/Roboto-Regular.ttf:` : '';
            vf_filters.push(`drawtext=${fontPath}text='${safeText}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=(h-text_h)*0.9`);
        }

        const command = [
            '-i', inputFileName, '-ss', String(start), '-t', String(duration),
            '-an', // remove audio for visual processing
        ];
        
        if (vf_filters.length > 0) {
            command.push('-vf', vf_filters.join(','));
        }
        
        command.push('-y', outputSceneFile);

        await ffmpegInstance.exec(command);
        sceneFiles.push(outputSceneFile);
        sceneDurations.push(duration);
    }
    
    onProgress({ progress: 0.7, message: 'Applying transitions...' });

    if (sceneFiles.length === 1) {
        const outputData = await ffmpegInstance.readFile(sceneFiles[0]);
        await ffmpegInstance.deleteFile(inputFileName);
        await ffmpegInstance.deleteFile(sceneFiles[0]);
        onProgress({ progress: 1, message: 'Processing complete!' });
        return new Blob([(outputData as Uint8Array).buffer], { type: 'video/mp4' });
    }

    const transitionDuration = 0.5;
    let filterComplex = '';
    let lastStream = '[0:v]';
    let currentOffset = sceneDurations[0] - transitionDuration;

    for (let i = 0; i < sceneFiles.length - 1; i++) {
        const nextStream = `[${i + 1}:v]`;
        const outputStream = `[v${i+1}]`;
        filterComplex += `${lastStream}${nextStream}xfade=transition=fade:duration=${transitionDuration}:offset=${currentOffset}${outputStream};`;
        lastStream = outputStream;
        if(i + 1 < sceneDurations.length) {
            currentOffset += sceneDurations[i+1] - transitionDuration;
        }
    }

    const concatInputs = sceneFiles.map(f => ['-i', f]).flat();
    
    await ffmpegInstance.exec([
        ...concatInputs,
        '-filter_complex', filterComplex.slice(0, -1),
        '-map', lastStream, '-y', 'output_no_audio.mp4'
    ]);

    onProgress({ progress: 0.9, message: 'Adding original audio...' });
    
    // Re-attach the original audio stream to the edited video
    await ffmpegInstance.exec([
        '-i', 'output_no_audio.mp4',
        '-i', inputFileName,
        '-c', 'copy', '-map', '0:v:0', '-map', '1:a:0?',
        '-shortest', '-y', 'output.mp4'
    ]);

    onProgress({ progress: 0.95, message: 'Finalizing video...' });

    const outputData = await ffmpegInstance.readFile('output.mp4');
    
    await ffmpegInstance.deleteFile(inputFileName);
    await ffmpegInstance.deleteFile('output_no_audio.mp4');
    await ffmpegInstance.deleteFile('output.mp4');
    for (const f of sceneFiles) {
        await ffmpegInstance.deleteFile(f);
    }

    onProgress({ progress: 1, message: 'Processing complete!' });

    return new Blob([ (outputData as Uint8Array).buffer ], { type: 'video/mp4' });
};

// --- Smart Cutter Functions ---

export const extractAudio = async (
    sourceVideo: File,
    onLog: (log: string) => void
): Promise<Blob> => {
    const ffmpegInstance = await loadFFmpeg(onLog);
    const videoData = await fileToUint8Array(sourceVideo);
    await ffmpegInstance.writeFile('input_audio.mp4', videoData);

    await ffmpegInstance.exec(['-i', 'input_audio.mp4', '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', 'output.wav']);

    const audioData = await ffmpegInstance.readFile('output.wav');
    await ffmpegInstance.deleteFile('input_audio.mp4');
    await ffmpegInstance.deleteFile('output.wav');
    
    return new Blob([(audioData as Uint8Array).buffer], { type: 'audio/wav' });
};

export const calculateSilenceSegments = (transcription: TranscribedWord[], silenceThreshold: number, videoDuration: number): { start: number; end: number }[] => {
    if (transcription.length === 0) return [{ start: 0, end: videoDuration }];
    
    const segmentsToKeep = [];
    let lastWordEnd = 0;

    // Add segment from start to the first word if it's not at the very beginning
    if (transcription[0].start > 0) {
        segmentsToKeep.push({ start: 0, end: transcription[0].end });
    }

    for (let i = 0; i < transcription.length - 1; i++) {
        const currentWord = transcription[i];
        const nextWord = transcription[i+1];
        const silenceDuration = nextWord.start - currentWord.end;

        if (silenceDuration < silenceThreshold) {
            // Part of the same spoken segment
            if (segmentsToKeep.length === 0 || lastWordEnd !== currentWord.start) {
                segmentsToKeep.push({ start: currentWord.start, end: nextWord.end });
            } else {
                segmentsToKeep[segmentsToKeep.length - 1].end = nextWord.end;
            }
            lastWordEnd = nextWord.end;
        }
    }
    
    // Add segment from the last word to the end of the video
    const lastWord = transcription[transcription.length - 1];
    if (lastWord.end < videoDuration && segmentsToKeep[segmentsToKeep.length-1].end !== videoDuration) {
         if (segmentsToKeep[segmentsToKeep.length - 1].end === lastWord.start) {
             segmentsToKeep[segmentsToKeep.length - 1].end = videoDuration;
         }
    }


    return segmentsToKeep;
};


export const calculateKeywordSegments = (transcription: TranscribedWord[], startWord: string, endWord: string): { start: number; end: number }[] => {
    const segments = [];
    let startIndex = -1;

    transcription.forEach((word, i) => {
        if (word.word.toLowerCase().includes(startWord.toLowerCase()) && startIndex === -1) {
            startIndex = i;
        }
        if (word.word.toLowerCase().includes(endWord.toLowerCase()) && startIndex !== -1) {
            const segment = {
                start: transcription[startIndex].start,
                end: word.end
            };
            segments.push(segment);
            startIndex = -1;
        }
    });

    return segments;
};

export const processVideoBySegments = async (
    sourceVideo: File,
    segments: { start: number; end: number }[],
    onProgress: (progress: { progress: number; message: string }) => void,
    onLog: (log: string) => void
): Promise<Blob> => {
    onProgress({ progress: 0, message: 'Loading FFmpeg...' });
    const ffmpegInstance = await loadFFmpeg(onLog);
    onProgress({ progress: 0.1, message: 'FFmpeg loaded. Preparing video...' });

    const videoData = await fileToUint8Array(sourceVideo);
    await ffmpegInstance.writeFile('input_cutter.mp4', videoData);

    let filterComplex = '';
    const totalDuration = segments.reduce((acc, s) => acc + (s.end - s.start), 0);
    
    segments.forEach((seg, i) => {
        filterComplex += `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}];`;
        filterComplex += `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}];`;
    });

    segments.forEach((_, i) => {
        filterComplex += `[v${i}][a${i}]`;
    });
    
    filterComplex += `concat=n=${segments.length}:v=1:a=1[v][a]`;

    onProgress({ progress: 0.5, message: 'Cutting and concatenating video...' });

    await ffmpegInstance.exec([
        '-i', 'input_cutter.mp4',
        '-filter_complex', filterComplex,
        '-map', '[v]', '-map', '[a]',
        '-y', 'output_cutter.mp4'
    ]);

    onProgress({ progress: 0.95, message: 'Finalizing video...' });
    const outputData = await ffmpegInstance.readFile('output_cutter.mp4');
    
    await ffmpegInstance.deleteFile('input_cutter.mp4');
    await ffmpegInstance.deleteFile('output_cutter.mp4');

    onProgress({ progress: 1, message: 'Processing complete!' });
    return new Blob([(outputData as Uint8Array).buffer], { type: 'video/mp4' });
};