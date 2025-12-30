
import type { CampaignBrief, CampaignStrategy, AdCreative, Avatar, CreativeRanking, TranscribedWord } from '../types';

const API_BASE_URL = 'https://us-central1-ptd-fitness-demo.cloudfunctions.net/unified_gemini_api';

async function callUnifiedApi(task: string, payload: object): Promise<any> {
    const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task, ...payload }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call for task '${task}' failed: ${errorText}`);
    }
    return response.json();
}

export const apiClient = {
    async fetchAvatars(): Promise<Avatar[]> {
        // This can remain a local call for now as it's reading a constant.
        const { getAvatarsLocal } = await import('./geminiService');
        return getAvatarsLocal();
    },
    async analyzeVideos(allVideoData: any[]): Promise<CampaignStrategy> {
        return callUnifiedApi('analyze_videos', { videos: allVideoData });
    },
    async generateCreatives(brief: CampaignBrief, avatarKey: string, strategy: CampaignStrategy): Promise<AdCreative[]> {
        return callUnifiedApi('generate_creatives', { brief, avatarKey, strategy });
    },
    async rankCreatives(brief: CampaignBrief, avatarKey: string, creatives: AdCreative[]): Promise<CreativeRanking[]> {
        return callUnifiedApi('rank_creatives', { brief, avatarKey, creatives });
    },
    async transcribeAudio(audioBlob: Blob): Promise<TranscribedWord[]> {
        const { fileToBase64 } = await import('../utils/files');
        const audio_data = await fileToBase64(audioBlob);
        const result = await callUnifiedApi('transcribe_audio', { 
            audio_data, 
            mime_type: audioBlob.type 
        });
        return result.transcription;
    },
    async generateStoryboard(prompt: string): Promise<{ description: string; image_prompt: string; }[]> {
        const result = await callUnifiedApi('generate_storyboard', { prompt });
        return JSON.parse(result.storyboard);
    },
    async generateImage(prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'): Promise<string> {
        const result = await callUnifiedApi('generate_image', { prompt, aspect_ratio: aspectRatio });
        return `data:image/jpeg;base64,${result.image_base64}`;
    },
};
