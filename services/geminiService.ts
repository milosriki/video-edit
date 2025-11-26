import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { TranscribedWord } from '../types';
import { fileToBase64 } from "../utils/files";

// This file handles ONLY direct-to-Gemini calls for the standalone tools.
// The core workflow is now managed by `apiClient.ts`.

// Helper to get API key safely
const getApiKey = () => {
  // @ts-ignore
  const key = (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  if (!key || key === 'undefined') {
    console.warn("Gemini API Key is missing or undefined. Some features may not work.");
    return '';
  }
  return key;
};

// Initialize lazily to avoid crash on load if key is missing
let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const key = getApiKey();
    if (!key) {
      // Return a dummy instance or throw specific error when used?
      // For now, let's throw if we try to use it without a key
      throw new Error("Gemini API Key is not configured. Please set it in your environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

const fastModel = 'gemini-3-flash';
const chatModel = 'gemini-3-flash';
const imageGenModel = 'imagen-4.0-generate-001';
const imageEditModel = 'gemini-3-pro';
const ttsModel = 'gemini-3-pro';
const liveModel = 'gemini-3-pro';
const veoModel = 'veo-3.1-fast-generate-preview';
const proModel = 'gemini-3-pro';

// @ts-ignore
function readGenAIText(resp: any): string {
  const t = typeof resp.text === 'function' ? resp.text() : resp.text;
  if (typeof t !== 'string' || !t.trim()) {
    throw new Error('Empty or invalid AI response text');
  }
  return t;
}

export const transcribeAudio = async (audioBlob: Blob): Promise<TranscribedWord[]> => {
  const ai = getAI();
  const audioData = await fileToBase64(audioBlob);

  const prompt = `Transcribe the following audio file. Provide a word-by-word transcription with precise start and end timestamps for each word.`;
  
  const response = await ai.models.generateContent({
    model: fastModel,
    contents: {
      parts: [
        { inlineData: { mimeType: audioBlob.type, data: audioData } },
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                start: { type: Type.NUMBER },
                end: { type: Type.NUMBER },
              },
              required: ["word", "start", "end"],
            },
          },
        },
        required: ["transcription"],
      },
    },
  });

  const jsonResponse = JSON.parse(readGenAIText(response));
  if (jsonResponse.transcription && Array.isArray(jsonResponse.transcription)) {
    return jsonResponse.transcription as TranscribedWord[];
  }
  throw new Error("The AI's transcription response was missing the expected 'transcription' data.");
};

export const generateStoryboard = async (prompt: string): Promise<{ description: string; image_prompt: string; }[]> => {
  const ai = getAI();
  const systemInstruction = `You are a creative director specializing in short-form video ads. Your task is to break down an ad concept into a 6-panel storyboard. For each panel, provide a concise visual description and a detailed, vibrant prompt suitable for an AI image generator like Imagen. The image prompt should be descriptive, including style, lighting, and composition details. The response must be a valid JSON array of 6 objects.`;

  const response = await ai.models.generateContent({
    model: proModel,
    contents: { parts: [{ text: `Ad Concept: "${prompt}"` }] },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "A concise description of the visual for this panel."
            },
            image_prompt: {
              type: Type.STRING,
              description: "A detailed, vibrant prompt for an AI image generator."
            }
          },
          required: ["description", "image_prompt"]
        }
      }
    }
  });

  const jsonResponse = JSON.parse(readGenAIText(response));
  if (Array.isArray(jsonResponse) && jsonResponse.length > 0) {
    return jsonResponse;
  }
  throw new Error("The AI's response was not a valid storyboard array.");
};

export const generateVideo = async (prompt: string, image: File | null, aspectRatio: '16:9' | '9:16', onProgress: (message: string) => void) => {
    // @ts-ignore
    const key = getApiKey();
    if (!key) throw new Error("API Key is required for video generation.");
    const veoAI = new GoogleGenAI({ apiKey: key });
    let operation;
    const config = { numberOfVideos: 1, resolution: '720p', aspectRatio };
    
    onProgress("Starting video generation...");
    if (image) {
        const imageBase64 = await fileToBase64(image);
        operation = await veoAI.models.generateVideos({ model: veoModel, prompt, image: { imageBytes: imageBase64, mimeType: image.type }, config });
    } else {
        operation = await veoAI.models.generateVideos({ model: veoModel, prompt, config });
    }

    onProgress("Processing request... this can take several minutes.");
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        onProgress("Checking video status...");
        operation = await veoAI.operations.getVideosOperation({ operation: operation });
    }

    onProgress("Finalizing video...");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation completed, but no download link was provided.");
    
    // @ts-ignore
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) throw new Error(`Failed to download the generated video. Status: ${response.status}`);
    return response.blob();
};

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateImages({ model: imageGenModel, prompt, config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio } });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const editImage = async (imageFile: File, prompt: string): Promise<string> => {
    const ai = getAI();
    const base64Data = await fileToBase64(imageFile);
    const response = await ai.models.generateContent({ model: imageEditModel, contents: { parts: [{ inlineData: { data: base64Data, mimeType: imageFile.type } }, { text: prompt }] }, config: { responseModalities: [Modality.IMAGE] } });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("AI did not return an edited image.");
};

export const analyzeImage = async (imageFile: File, prompt: string): Promise<string> => {
    const ai = getAI();
    const base64Data = await fileToBase64(imageFile);
    const response = await ai.models.generateContent({ model: fastModel, contents: { parts: [{ inlineData: { mimeType: imageFile.type, data: base64Data } }, { text: prompt }] } });
    return readGenAIText(response);
};

export const understandVideo = async (frames: string[], prompt: string): Promise<string> => {
  const ai = getAI();
  const imageParts = frames.map(frame => ({ inlineData: { mimeType: 'image/jpeg', data: frame } }));
  const fullPrompt = `You are "Andromeda AI", an elite video intelligence analyst and neuro-marketing expert. 
  Analyze the provided video frames with a focus on:
  1. **Visual Hooks:** Identify pattern interrupts and scroll-stopping moments.
  2. **Emotional Micro-expressions:** Detect subtle facial cues of trust, fear, or desire.
  3. **Neuro-Linguistic Triggers:** Analyze any visible text or context for psychological impact.
  
  User's specific question: "${prompt}"
  
  Provide a detailed, professional, and strategic response.`;
  const response = await ai.models.generateContent({ model: proModel, contents: { parts: [...imageParts, { text: fullPrompt }] } });
  return readGenAIText(response);
};

export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({ model: ttsModel, contents: [{ parts: [{ text }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } } });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("AI did not return any audio data.");
    return base64Audio;
};

export const initChat = (): Chat => {
    const ai = getAI();
    return ai.chats.create({ model: chatModel, config: { systemInstruction: "You are an expert Meta Ads strategist and creative assistant. Help me brainstorm ideas, write copy, and develop strategies for high-converting ads. Keep your responses concise and actionable." } });
};

export const connectLive = (callbacks: { onopen: () => void; onmessage: (message: any) => Promise<void>; onerror: (e: ErrorEvent) => void; onclose: (e: CloseEvent) => void; }): Promise<any> => {
    const ai = getAI();
    // @ts-ignore
    return ai.live.connect({ model: liveModel, callbacks, config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }, inputAudioTranscription: {}, outputAudioTranscription: {}, systemInstruction: 'You are an AI ad strategist. Talk with me to brainstorm ideas. Be friendly and keep your responses brief.' } });
};
