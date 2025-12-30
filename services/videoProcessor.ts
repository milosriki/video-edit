
import { AdCreative, EditScene, TranscribedWord, AdvancedEdit } from '../types';

// Make FFmpeg types available globally
declare global {
    interface Window {
        FFmpeg: any;
    }
}

let ffmpeg: any;
let isFontLoaded = false;

const loadFFmpeg = async (onLog: (log: string) => void): Promise<any> => {
    if (ffmpeg) return ffmpeg;
    try {
        const { FFmpeg } = window.FFmpeg;
        const coreURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js";

        const instance = new FFmpeg();
        instance.on('log', ({ message }: { message: string }) => onLog(message));
        
        await instance.load({ coreURL });
        ffmpeg = instance;
        return ffmpeg;
    } catch (e) {
        ffmpeg = null; // Reset for retry
        throw new Error(`FFMPEG_KERNEL_LOAD_FAILURE: Kernel initialization crashed. Details: ${e instanceof Error ? e.message : 'Wasm link failed'}`);
    }
};

const fileToUint8Array = (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(new Uint8Array(reader.result));
            } else {
                reject(new Error("FAILED_READ_ARRAYBUFFER"));
            }
        };
        reader.onerror = () => reject(new Error("FILEREADER_IO_ERROR"));
        reader.readAsArrayBuffer(file);
    });
};

const ensureFontIsLoaded = async (onLog: (log: string) => void) => {
    if (isFontLoaded || !ffmpeg) return;
    try {
        onLog("Loading typography layers (Plus Jakarta Sans)...");
        const fontResponse = await fetch('https://fonts.gstatic.com/s/plusjakartasans/v8/L0x8DF_B6Y_2I52HuyV4vI265iL6-6p9uX7F.woff2');
        if (!fontResponse.ok) throw new Error("Cloud font fetch timed out.");
        const fontBlob = await fontResponse.arrayBuffer();
        await ffmpeg.writeFile('/fonts/PlusJakartaSans.ttf', new Uint8Array(fontBlob));
        isFontLoaded = true;
        onLog("Neural Typography Bridge Active.");
    } catch (e) {
        onLog("SYSTEM_WARNING: Typography failed to load. Fallback to generic sans.");
    }
}

const parseTimestamp = (timestamp: string): { start: number; end: number, duration: number } => {
    try {
        const parts = timestamp.replace(/s/g, '').split('-');
        const start = parseFloat(parts[0]);
        const end = parseFloat(parts[1]);
        if (isNaN(start) || isNaN(end)) throw new Error("INVALID_TIMESTAMP_FORMAT");
        return { start, end, duration: end - start };
    } catch (e) {
        return { start: 0, end: 5, duration: 5 };
    }
};

export const processVideoWithCreative = async (
    sourceVideos: File[],
    adCreative: AdCreative,
    onProgress: (progress: { progress: number; message: string }) => void,
    onLog: (log: string) => void
): Promise<Blob> => {
    onProgress({ progress: 0, message: 'Wasm Kernel Handshake...' });
    const ffmpegInstance = await loadFFmpeg(onLog);
    await ensureFontIsLoaded(onLog);

    try {
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
                message: `MASTER_RENDER_PHASE: Layer ${i + 1}/${totalScenes}`,
            });

            const vf_filters: string[] = [];

            if (scene.edit.toLowerCase().includes('zoom')) {
                vf_filters.push(`zoompan=z='min(zoom+0.0015,1.2)':d=${Math.ceil(duration * 25)}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720`);
            }
            
            if (scene.overlayText && scene.overlayText !== 'N/A') {
                const safeText = scene.overlayText.replace(/'/g, "'\\''").toUpperCase();
                const fontPath = isFontLoaded ? `fontfile=/fonts/PlusJakartaSans.ttf:` : '';
                vf_filters.push(`drawtext=${fontPath}text='${safeText}':fontcolor=white:fontsize=52:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=(h-text_h)*0.85:shadowcolor=black@0.4:shadowx=2:shadowy=2`);
            }

            vf_filters.push(`drawbox=y=ih-8:color=white@0.2:width=iw:height=8:t=fill,drawbox=y=ih-8:color=0x818cf8:width=iw*(t/${duration}):height=8:t=fill`);

            const command = [
                '-i', scene.sourceFile || 'input.mp4',
                '-ss', String(start), 
                '-t', String(duration),
                '-an', 
            ];
            
            if (vf_filters.length > 0) command.push('-vf', vf_filters.join(','));
            command.push('-y', outputSceneFile);

            const result = await ffmpegInstance.exec(command);
            if (result !== 0) throw new Error(`SCENE_MASTER_COLLISION: Frame buffer overflow at scene ${i}. Try a shorter clip.`);
            
            sceneFiles.push(outputSceneFile);
            sceneDurations.push(duration);
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
            if(i + 1 < sceneDurations.length) currentOffset += sceneDurations[i+1] - transitionDuration;
        }

        const concatInputs = sceneFiles.map(f => ['-i', f]).flat();
        await ffmpegInstance.exec([
            ...concatInputs,
            '-filter_complex', filterComplex.slice(0, -1),
            '-map', lastStream, '-y', 'temp_master.mp4'
        ]);

        onProgress({ progress: 0.9, message: 'Attaching Neural Audio...' });
        
        await ffmpegInstance.exec([
            '-i', 'temp_master.mp4',
            '-i', primaryAudioSource,
            '-c:v', 'copy', '-c:a', 'aac', '-map', '0:v:0', '-map', '1:a:0?',
            '-shortest', '-y', 'output.mp4'
        ]);

        const outputData = await ffmpegInstance.readFile('output.mp4');
        
        onProgress({ progress: 1, message: 'MASTER_SYNTHESIS_COMPLETE' });
        return new Blob([ (outputData as Uint8Array).buffer ], { type: 'video/mp4' });
    } catch (e) {
        onLog(`CRITICAL_PIPELINE_ERROR: ${e instanceof Error ? e.message : 'Memory allocation failure'}`);
        // Reset state for next try
        ffmpeg = null; 
        throw e;
    }
};

export const extractAudio = async (sourceVideo: File, onLog: (log: string) => void): Promise<Blob> => {
    const ffmpegInstance = await loadFFmpeg(onLog);
    try {
        const videoData = await fileToUint8Array(sourceVideo);
        await ffmpegInstance.writeFile('audio_src.mp4', videoData);
        await ffmpegInstance.exec(['-i', 'audio_src.mp4', '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', 'audio_out.wav']);
        const audioData = await ffmpegInstance.readFile('audio_out.wav');
        return new Blob([(audioData as Uint8Array).buffer], { type: 'audio/wav' });
    } catch (e) {
        ffmpeg = null;
        throw new Error("AUDIO_EXTRACTION_FAILURE: Acoustic stream could not be isolated.");
    }
};

export const processVideoWithAdvancedEdits = async (
    sourceVideo: File,
    edits: AdvancedEdit[],
    onProgress: (progress: { progress: number; message: string }) => void,
    onLog: (log: string) => void
): Promise<Blob> => {
    onProgress({ progress: 0, message: 'Advanced Engine Reset...' });
    const ffmpegInstance = await loadFFmpeg(onLog);
    await ensureFontIsLoaded(onLog);

    try {
        const videoData = await fileToUint8Array(sourceVideo);
        await ffmpegInstance.writeFile('input.mp4', videoData);

        const command: string[] = ['-i', 'input.mp4'];
        const filterComplexParts: string[] = [];
        let lastVideoStream = '[0:v]';
        let lastAudioStream = '[0:a]';

        for (const edit of edits) {
            const stepIndex = filterComplexParts.length;
            const newVideoStream = `[v${stepIndex}]`;

            switch (edit.type) {
                case 'filter':
                    filterComplexParts.push(`${lastVideoStream}format=gray${newVideoStream}`);
                    lastVideoStream = newVideoStream;
                    break;
                case 'speed':
                    filterComplexParts.push(`${lastVideoStream}setpts=${1 / edit.factor}*PTS${newVideoStream}`);
                    lastVideoStream = newVideoStream;
                    break;
                case 'text':
                    const safeText = edit.text.replace(/'/g, "'\\''").toUpperCase();
                    const fontPath = isFontLoaded ? `/fonts/PlusJakartaSans.ttf` : 'sans-serif';
                    filterComplexParts.push(`${lastVideoStream}drawtext=fontfile='${fontPath}':text='${safeText}':fontcolor=white:fontsize=${edit.fontSize}:box=1:boxcolor=black@0.5:x=(w-text_w)/2:y=(h-text_h)*0.85:enable='between(t,${edit.start},${edit.end})'${newVideoStream}`);
                    lastVideoStream = newVideoStream;
                    break;
            }
        }

        if (filterComplexParts.length > 0) {
            command.push('-filter_complex', filterComplexParts.join(';'));
            command.push('-map', lastVideoStream);
            command.push('-map', lastAudioStream);
        }

        command.push('-y', 'output.mp4');
        await ffmpegInstance.exec(command);
        const outputData = await ffmpegInstance.readFile('output.mp4');
        return new Blob([(outputData as Uint8Array).buffer], { type: 'video/mp4' });
    } catch (e) {
        ffmpeg = null;
        throw new Error(`ADVANCED_PIPELINE_COLLISION: ${e instanceof Error ? e.message : 'Render execution error'}`);
    }
};

export const processVideoBySegments = async (
    sourceVideo: File,
    segments: { start: number; end: number }[],
    onProgress: (progress: { progress: number; message: string }) => void,
    onLog: (log: string) => void
): Promise<Blob> => {
    const ffmpegInstance = await loadFFmpeg(onLog);
    try {
        const videoData = await fileToUint8Array(sourceVideo);
        await ffmpegInstance.writeFile('input_seg.mp4', videoData);

        let filterComplex = '';
        segments.forEach((seg, i) => {
            filterComplex += `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}];`;
            filterComplex += `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}];`;
        });
        segments.forEach((_, i) => filterComplex += `[v${i}][a${i}]`);
        filterComplex += `concat=n=${segments.length}:v=1:a=1[v][a]`;

        await ffmpegInstance.exec(['-i', 'input_seg.mp4', '-filter_complex', filterComplex, '-map', '[v]', '-map', '[a]', '-y', 'out.mp4']);
        const outputData = await ffmpegInstance.readFile('out.mp4');
        return new Blob([(outputData as Uint8Array).buffer], { type: 'video/mp4' });
    } catch (e) {
        ffmpeg = null;
        throw new Error("SEGMENT_CONCAT_FAILURE: Splice protocol failed.");
    }
};

export const calculateSilenceSegments = (transcription: TranscribedWord[], silenceThreshold: number, videoDuration: number): { start: number; end: number }[] => {
    if (!transcription.length) return [];
    const segments = [];
    let lastEnd = 0;
    for (const word of transcription) {
        if (word.start - lastEnd < silenceThreshold) {
            if (segments.length === 0) segments.push({ start: word.start, end: word.end });
            else segments[segments.length - 1].end = word.end;
        } else {
            segments.push({ start: word.start, end: word.end });
        }
        lastEnd = word.end;
    }
    return segments;
};

export const calculateKeywordSegments = (transcription: TranscribedWord[], startWord: string, endWord: string): { start: number; end: number }[] => {
    const segments = [];
    let currentStart: number | null = null;
    transcription.forEach((w) => {
        if (w.word.toLowerCase().includes(startWord.toLowerCase())) currentStart = w.start;
        if (currentStart !== null && w.word.toLowerCase().includes(endWord.toLowerCase())) {
            segments.push({ start: currentStart, end: w.end });
            currentStart = null;
        }
    });
    return segments;
};
