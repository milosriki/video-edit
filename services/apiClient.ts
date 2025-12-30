/// <reference types="vite/client" />

import type { CampaignBrief, CampaignStrategy, AdCreative, Avatar, CreativeRanking, TranscribedWord } from '../types';

const CLOUD_FUNC_URL = 'https://us-central1-ptd-fitness-demo.cloudfunctions.net/unified_gemini_api';
const EXPRESS_API_URL = import.meta.env.VITE_API_URL || 'https://ptd-express-api-489769736562.us-central1.run.app/api';

async function callCloudFunc(task: string, payload: object): Promise<any> {
    const response = await fetch(CLOUD_FUNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, ...payload }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloud Function call for task '${task}' failed: ${errorText}`);
    }
    return response.json();
}

async function callExpressApi(endpoint: string, payload: object): Promise<any> {
    const response = await fetch(`${EXPRESS_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Express API call to '${endpoint}' failed: ${errorText}`);
    }
    return response.json();
}

export const apiClient = {
    async fetchAvatars(): Promise<Avatar[]> {
        const { getAvatarsLocal } = await import('./geminiService');
        return getAvatarsLocal();
    },
    async researchMarketTrends(query: string): Promise<{text: string, sources: any[]}> {
        const { researchMarketTrends } = await import('./geminiService');
        return researchMarketTrends(query);
    },
    async analyzeVideos(allVideoData: any[]): Promise<CampaignStrategy> {
        return callExpressApi('/analyze', { allVideoData });
    },
    async generateCreatives(brief: CampaignBrief, avatarKey: string, strategy: CampaignStrategy): Promise<AdCreative[]> {
        return callExpressApi('/creatives', { brief, avatarKey, strategy });
    },
    async rankCreatives(brief: CampaignBrief, avatarKey: string, creatives: AdCreative[]): Promise<CreativeRanking[]> {
        return callExpressApi('/creatives/rank', { brief, avatarKey, creatives });
    },
    async transcribeAudio(audioBlob: Blob): Promise<TranscribedWord[]> {
        const { fileToBase64 } = await import('../utils/files');
        const audio_data = await fileToBase64(audioBlob);
        // Transcribe is currently missing from both backends in the analysis, 
        // but we'll leave it pointing to Cloud Function as a placeholder or TODO.
        const result = await callCloudFunc('transcribe_audio', { 
            audio_data, 
            mime_type: audioBlob.type 
        });
        return result.transcription;
    },
    async generateStoryboard(prompt: string): Promise<{ description: string; image_prompt: string; }[]> {
        const result = await callCloudFunc('generate_storyboard', { prompt });
        return JSON.parse(result.storyboard);
    },
    async generateImage(prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'): Promise<string> {
        const result = await callCloudFunc('generate_image', { prompt, aspect_ratio: aspectRatio });
        return `data:image/jpeg;base64,${result.image_base64}`;
    },
};
