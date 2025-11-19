// services/apiClient.ts
import type { CampaignBrief, CampaignStrategy, AdCreative, Avatar, CreativeRanking } from '../types';

const API_BASE_URL = import.meta.env.DEV 
  ? '/api' // Local dev server proxy
  : 'https://us-central1-ptd-fitness-demo.cloudfunctions.net/api'; // Production Cloud Functions

async function handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null);

    if (!response.ok) {
        const message = (body && (body.error || body.message)) || `API error (${response.status} ${response.statusText})`;
        throw new Error(message);
    }
    
    if (body === null) {
        throw new Error('API response body is empty or invalid.');
    }

    return body as T;
}

export const apiClient = {
    // Avatars from the server KB
    fetchAvatars(): Promise<Avatar[]> {
        return fetch(`${API_BASE_URL}/avatars`).then(res => handleResponse<Avatar[]>(res));
    },

    // Analysis (video → strategy)
    analyzeVideos(allVideoData: any[]): Promise<CampaignStrategy> {
        return fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allVideoData }),
        }).then(res => handleResponse<CampaignStrategy>(res));
    },

    // Generate 10 blueprints
    generateCreatives(brief: CampaignBrief, avatarKey: string, strategy: CampaignStrategy): Promise<AdCreative[]> {
        return fetch(`${API_BASE_URL}/creatives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brief, avatarKey, strategy }),
        }).then(res => handleResponse<AdCreative[]>(res));
    },

    // Rank the 10 blueprints by predicted ROI (Top 3)
    rankCreatives(brief: CampaignBrief, avatarKey: string, creatives: AdCreative[]): Promise<CreativeRanking[]> {
        return fetch(`${API_BASE_URL}/creatives/rank`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brief, avatarKey, creatives }),
        }).then(res => handleResponse<CreativeRanking[]>(res));
    },
};

export type ApiClient = typeof apiClient;
