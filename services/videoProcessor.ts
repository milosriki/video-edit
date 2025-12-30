import { AdCreative, EditScene, TranscribedWord, AdvancedEdit } from '../types';

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
    sourceVideos: File[], // MODIFIED: Accept an array of files
    adCreative: AdCreative,
    onProgress: (progress: { progress: number; message: string }) => void,
    onLog: (log: string) => void
): Promise<Blob> => {
    onProgress({ progress: 0, message: 'Loading FFmpeg...' });
    const ffmpegInstance = await loadFFmpeg(onLog);
    await ensureFontIsLoaded(onLog);
    onProgress({ progress: 0.1, message: 'FFmpeg loaded. Preparing video assets...' });

    // Write all source videos to the FFmpeg filesystem
    for (const videoFile of sourceVideos) {
        const videoData = await fileToUint8Array(videoFile);
        await ffmpegInstance.writeFile(videoFile.name, videoData);
    }
    
    const primaryAudioSource = adCreative.primarySourceFileName;
    const sceneFiles: string[] = [];
    const sceneDurations: number[] = [];
    const totalScenes = adCreative.editPlan.length;

    for (let i = 0; i < totalScenes; i++) {
        const scene = adCreative.editPlan[i];
        const { start, duration } = parseTimestamp(scene.timestamp);
        const outputSceneFile = `scene_${i}.mp4`;
        
        onProgress({
            progress: 0.1 + (0.6 * (i / totalScenes)),
            message: `Processing Scene ${i + 1}/${totalScenes} from ${scene.sourceFile}...`,
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
            '-i', scene.sourceFile, // MODIFIED: Use the source file specified for the scene
            '-ss', String(start), 
            '-t', String(duration),
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
        // If only one scene, just use it and add audio
        await ffmpegInstance.exec([
            '-i', sceneFiles[0],
            '-i', primaryAudioSource,
            '-c', 'copy', '-map', '0:v:0', '-map', '1:a:0?',
            '-shortest', '-y', 'output.mp4'
        ]);
    } else {
        // Build complex filter for transitions if multiple scenes
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

        onProgress({ progress: 0.9, message: `Adding audio from ${primaryAudioSource}...` });
        
        // Re-attach the audio stream from the primary video
        await ffmpegInstance.exec([
            '-i', 'output_no_audio.mp4',
            '-i', primaryAudioSource,
            '-c', 'copy', '-map', '0:v:0', '-map', '1:a:0?',
            '-shortest', '-y', 'output.mp4'
        ]);
        await ffmpegInstance.deleteFile('output_no_audio.mp4');
    }

    onProgress({ progress: 0.95, message: 'Finalizing video...' });

    const outputData = await ffmpegInstance.readFile('output.mp4');
    
    // Cleanup all files
    for (const videoFile of sourceVideos) {
        await ffmpegInstance.deleteFile(videoFile.name);
    }
    await ffmpegInstance.deleteFile('output.mp4');
    for (const f of sceneFiles) {
        await ffmpegInstance.deleteFile(f);
    }

    onProgress({ progress: 1, message: 'Processing complete!' });

    return new Blob([ (outputData as Uint8Array).buffer ], { type: 'video/mp4' });
};


// --- Advanced Manual Editor ---
export const processVideoWithAdvancedEdits = async (
    sourceVideo: File,
    edits: AdvancedEdit[],
    onProgress: (progress: { progress: number; message: string }) => void,
    onLog: (log: string) => void
): Promise<Blob> => {
    onProgress({ progress: 0, message: 'Loading FFmpeg...' });
    const ffmpegInstance = await loadFFmpeg(onLog);
    await ensureFontIsLoaded(onLog);
    onProgress({ progress: 0.1, message: 'FFmpeg loaded. Preparing inputs...' });

    const videoData = await fileToUint8Array(sourceVideo);
    await ffmpegInstance.writeFile('input.mp4', videoData);

    const command: string[] = [];
    const trimEdit = edits.find(e => e.type === 'trim');
    
    if (trimEdit && trimEdit.type === 'trim') {
        command.push('-ss', trimEdit.start);
    }
    command.push('-i', 'input.mp4');
    if (trimEdit && trimEdit.type === 'trim') {
        command.push('-to', trimEdit.end);
    }

    const imageOverlays = edits.filter(e => e.type === 'image') as Extract<AdvancedEdit, { type: 'image' }>[];
    for (let i = 0; i < imageOverlays.length; i++) {
        const imageData = await fileToUint8Array(imageOverlays[i].file);
        const imageFileName = `overlay_${i}.png`;
        await ffmpegInstance.writeFile(imageFileName, imageData);
        command.push('-i', imageFileName);
    }

    const filterComplexParts: string[] = [];
    let lastVideoStream = '[0:v]';
    let lastAudioStream = '[0:a]';
    let imageInputIndex = 1;

    for (const edit of edits) {
        const stepIndex = filterComplexParts.length;
        const newVideoStream = `[v${stepIndex}]`;
        const newAudioStream = `[a${stepIndex}]`;

        switch (edit.type) {
            case 'filter': {
                let filterName = '';
                if (edit.name === 'grayscale') filterName = 'format=gray';
                else if (edit.name === 'sepia') filterName = 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131';
                else if (edit.name === 'negate') filterName = 'negate';
                else if (edit.name === 'vignette') filterName = 'vignette';
                if (filterName) {
                    filterComplexParts.push(`${lastVideoStream}${filterName}${newVideoStream}`);
                    lastVideoStream = newVideoStream;
                }
                break;
            }
            case 'speed': {
                filterComplexParts.push(`${lastVideoStream}setpts=${1 / edit.factor}*PTS${newVideoStream}`);
                lastVideoStream = newVideoStream;

                if (edit.factor > 0) {
                    const atempoFilters = [];
                    let currentFactor = edit.factor;
                    while (currentFactor < 0.5) {
                        atempoFilters.push('atempo=0.5');
                        currentFactor /= 0.5;
                    }
                    while (currentFactor > 2.0) { // FFmpeg doc recommends chaining for >2x
                        atempoFilters.push('atempo=2.0');
                        currentFactor /= 2.0;
                    }
                    if (currentFactor >= 0.5) { // Check it's in valid range now
                       atempoFilters.push(`atempo=${currentFactor}`);
                    }
                    
                    const audioFilter = atempoFilters.join(',');
                    filterComplexParts.push(`${lastAudioStream}${audioFilter}${newAudioStream}`);
                    lastAudioStream = newAudioStream;
                }
                break;
            }
            case 'text': {
                const safeText = edit.text.replace(/'/g, "'\\''").replace(/:/g, '\\:').replace(/%/g, '\\%');
                const yPos = edit.position === 'top' ? '20' : edit.position === 'center' ? '(h-text_h)/2' : `(h-text_h-20)`;
                const fontPath = isFontLoaded ? `/fonts/Roboto-Regular.ttf` : 'sans-serif';
                const drawtextFilter = `drawtext=fontfile='${fontPath}':text='${safeText}':fontcolor=white:fontsize=${edit.fontSize}:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=${yPos}:enable='between(t,${edit.start},${edit.end})'`;
                filterComplexParts.push(`${lastVideoStream}${drawtextFilter}${newVideoStream}`);
                lastVideoStream = newVideoStream;
                break;
            }
            case 'image': {
                const imgStream = `[${imageInputIndex++}:v]`;
                const scaledImgStream = `[scaled_img_${stepIndex}]`;
                const overlayedStream = `[overlayed_${stepIndex}]`;
                
                let pos = '10:10'; // top_left
                if (edit.position === 'top_right') pos = 'W-w-10:10';
                if (edit.position === 'bottom_left') pos = '10:H-h-10';
                if (edit.position === 'bottom_right') pos = 'W-w-10:H-h-10';
                
                filterComplexParts.push(`${imgStream}format=rgba,colorchannelmixer=aa=${edit.opacity},scale=iw*${edit.scale}:-1${scaledImgStream}`);
                filterComplexParts.push(`${lastVideoStream}${scaledImgStream}overlay=${pos}${overlayedStream}`);
                lastVideoStream = overlayedStream;
                break;
            }
            case 'mute': {
                filterComplexParts.push(`${lastAudioStream}volume=0${newAudioStream}`);
                lastAudioStream = newAudioStream;
                break;
            }
        }
    }

    if (filterComplexParts.length > 0) {
        command.push('-filter_complex', filterComplexParts.join(';'));
        command.push('-map', lastVideoStream);
        command.push('-map', lastAudioStream);
    } else {
        command.push('-c', 'copy');
    }

    command.push('-y', 'output.mp4');

    onProgress({ progress: 0.2, message: 'Starting FFmpeg process...' });
    await ffmpegInstance.exec(command);
    onProgress({ progress: 0.95, message: 'Finalizing video...' });

    const outputData = await ffmpegInstance.readFile('output.mp4');
    
    await ffmpegInstance.deleteFile('input.mp4');
    await ffmpegInstance.deleteFile('output.mp4');
    for (let i = 0; i < imageOverlays.length; i++) {
        await ffmpegInstance.deleteFile(`overlay_${i}.png`);
    }

    onProgress({ progress: 1, message: 'Processing complete!' });
    return new Blob([(outputData as Uint8Array).buffer], { type: 'video/mp4' });
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
    if (!transcription || transcription.length === 0) {
        return [];
    }
    const sortedTranscription = [...transcription].sort((a, b) => a.start - b.start);
    const segments: { start: number; end: number }[] = [];
    let currentStart = sortedTranscription[0].start;
    let currentEnd = sortedTranscription[0].end;

    for (let i = 1; i < sortedTranscription.length; i++) {
        const prevWord = sortedTranscription[i - 1];
        const currentWord = sortedTranscription[i];
        const silence = currentWord.start - prevWord.end;

        if (silence > silenceThreshold) {
            segments.push({ start: currentStart, end: currentEnd });
            currentStart = currentWord.start;
            currentEnd = currentWord.end;
        } else {
            currentEnd = currentWord.end;
        }
    }
    segments.push({ start: currentStart, end: currentEnd });
    return segments;
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