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
            vf_filters.push(`drawtext=${fontPath}text='${safeText}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.5:boxborderw=5:x=(w-text_w)/2:y=(h-text_h)-20`);
        }

        const command = [
            '-ss', `${start}`,
            '-i', inputFileName,
            '-t', `${duration}`,
            '-an', // remove audio from scene clips
        ];

        if (vf_filters.length > 0) {
            command.push('-vf', vf_filters.join(','));
        }
        
        command.push(outputSceneFile);
        
        await ffmpegInstance.exec(command);
        sceneFiles.push(outputSceneFile);
    }

    onProgress({ progress: 0.7, message: 'Combining scenes...' });

    if (sceneFiles.length === 1) {
        await ffmpegInstance.rename(sceneFiles[0], 'combined_video.mp4');
    } else {
        const concatList = sceneFiles.map(f => `file '${f}'`).join('\n');
        await ffmpegInstance.writeFile('concat.txt', concatList);

        await ffmpegInstance.exec([
            '-f', 'concat',
            '-safe', '0',
            '-i', 'concat.txt',
            '-c', 'copy',
            'combined_video.mp4'
        ]);
    }
    
    onProgress({ progress: 0.9, message: 'Adding original audio...' });
    
    await ffmpegInstance.exec([
        '-i', 'combined_video.mp4',
        '-i', inputFileName,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-shortest',
        'final_output.mp4'
    ]);
    
    const outputData = await ffmpegInstance.readFile('final_output.mp4');

    // Cleanup
    await ffmpegInstance.deleteFile(inputFileName);
    for(const f of sceneFiles) {
        await ffmpegInstance.deleteFile(f);
    }
    if (sceneFiles.length > 1) await ffmpegInstance.deleteFile('concat.txt');
    await ffmpegInstance.deleteFile('combined_video.mp4');
    await ffmpegInstance.deleteFile('final_output.mp4');

    onProgress({ progress: 1, message: 'Done!' });
    return new Blob([outputData], { type: 'video/mp4' });
};

export const extractAudio = async (
    sourceVideo: File,
    onLog: (log: string) => void
): Promise<Blob> => {
    const ffmpegInstance = await loadFFmpeg(onLog);
    const videoData = await fileToUint8Array(sourceVideo);
    const inputFileName = 'input.mp4';
    const outputFileName = 'output.aac';
    await ffmpegInstance.writeFile(inputFileName, videoData);
    
    await ffmpegInstance.exec(['-i', inputFileName, '-vn', '-acodec', 'copy', outputFileName]);
    
    const audioData = await ffmpegInstance.readFile(outputFileName);
    await ffmpegInstance.deleteFile(inputFileName);
    await ffmpegInstance.deleteFile(outputFileName);
    
    return new Blob([audioData], { type: 'audio/aac' });
};

export const calculateSilenceSegments = (
  transcription: TranscribedWord[],
  silenceThreshold: number,
  videoDuration: number
): { start: number; end: number }[] => {
  if (transcription.length === 0) {
    return [{ start: 0, end: videoDuration }];
  }

  const segments: { start: number; end: number }[] = [];
  let currentSegmentStart = transcription[0].start;

  for (let i = 0; i < transcription.length - 1; i++) {
    const currentWord = transcription[i];
    const nextWord = transcription[i + 1];
    const silenceDuration = nextWord.start - currentWord.end;

    if (silenceDuration >= silenceThreshold) {
      segments.push({ start: currentSegmentStart, end: currentWord.end });
      currentSegmentStart = nextWord.start;
    }
  }

  segments.push({ start: currentSegmentStart, end: transcription[transcription.length - 1].end });

  return segments.filter(s => s.end - s.start > 0.1);
};

export const calculateKeywordSegments = (
  transcription: TranscribedWord[],
  startWord: string,
  endWord: string
): { start: number; end: number }[] => {
  if (!startWord || !endWord || transcription.length === 0) {
    return [];
  }

  const lowerStartWord = startWord.toLowerCase();
  const lowerEndWord = endWord.toLowerCase();

  let startIndex = -1;
  for (let i = 0; i < transcription.length; i++) {
    if (transcription[i].word.toLowerCase().includes(lowerStartWord)) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === -1) {
    return [];
  }

  let lastEndIndex = -1;
  for (let i = startIndex; i < transcription.length; i++) {
    if (transcription[i].word.toLowerCase().includes(lowerEndWord)) {
      lastEndIndex = i;
    }
  }

  if (lastEndIndex === -1) {
    return [];
  }

  const segmentStart = transcription[startIndex].start;
  const segmentEnd = transcription[lastEndIndex].end;

  if (segmentEnd <= segmentStart) return [];

  return [{ start: segmentStart, end: segmentEnd }];
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
    const inputFileName = 'input.mp4';
    await ffmpegInstance.writeFile(inputFileName, videoData);

    const filterParts = segments.map((seg, i) => {
        return `[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}];` +
               `[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}]`;
    }).join(';');
    
    const concatInputs = segments.map((_, i) => `[v${i}][a${i}]`).join('');
    
    const filterComplex = `${filterParts};${concatInputs}concat=n=${segments.length}:v=1:a=1[v][a]`;
    
    const totalDuration = segments.reduce((acc, s) => acc + (s.end - s.start), 0);

    ffmpegInstance.on('progress', ({ time }: { time: number }) => {
        const progress = time / totalDuration;
        if (progress > 0 && progress < 1) {
             onProgress({ progress: 0.1 + (progress * 0.8), message: `Processing... (${Math.round(progress * 100)}%)` });
        }
    });

    onProgress({ progress: 0.1, message: 'Cutting and combining segments...' });

    await ffmpegInstance.exec([
        '-i', inputFileName,
        '-filter_complex', filterComplex,
        '-map', '[v]',
        '-map', '[a]',
        'output.mp4'
    ]);
    
    ffmpegInstance.on('progress', () => {}); // Clear progress handler
    
    onProgress({ progress: 0.95, message: 'Finalizing video...' });

    const outputData = await ffmpegInstance.readFile('output.mp4');

    await ffmpegInstance.deleteFile(inputFileName);
    await ffmpegInstance.deleteFile('output.mp4');

    onProgress({ progress: 1, message: 'Done!' });

    return new Blob([outputData], { type: 'video/mp4' });
};