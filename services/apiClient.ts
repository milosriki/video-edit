// services/apiClient.ts
import type { CampaignBrief, CampaignStrategy, AdCreative, Avatar, CreativeRanking } from '../types';

// Updated to point to the new Cloud Run backend
// Updated to point to the new Titan Backend
const API_BASE_URL = 'http://localhost:8080';
import { titanClient } from '../frontend/src/api/titan_client';

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
    async generateCreatives(brief: CampaignBrief, avatarKey: string, strategy: CampaignStrategy): Promise<AdCreative[]> {
        // Use Titan Client to trigger generation
        await titanClient.generateCampaign({
            assets: [], // Placeholder
            target_audience: brief.targetMarket
        });

        // Return mock creatives for now as the backend returns a status message
        return [
            {
                primarySourceFileName: 'generated_video_1.mp4',
                variationTitle: 'Titan Generated #1',
                headline: brief.offer,
                body: `Get ${brief.productName} now!`,
                cta: brief.cta,
                editPlan: [],
                __roiScore: 95,
                __hookScore: 9,
                __ctaScore: 8
            },
            {
                primarySourceFileName: 'generated_video_2.mp4',
                variationTitle: 'Titan Generated #2',
                headline: 'Limited Time Offer',
                body: `Don't miss out on ${brief.productName}.`,
                cta: brief.cta,
                editPlan: [],
                __roiScore: 88,
                __hookScore: 8,
                __ctaScore: 7
            }
        ];
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
