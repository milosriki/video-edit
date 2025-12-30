
import type { CampaignBrief, CampaignStrategy, AdCreative, Avatar, CreativeRanking } from '../types';

/**
 * PTD Command Center API Client
 * Orchestrates communication between the frontend and the AI-powered backend.
 */
export const apiClient = {
    async fetchAvatars(): Promise<Avatar[]> {
        const response = await fetch('/api/avatars');
        if (!response.ok) throw new Error('Failed to synchronize client avatars.');
        return response.json();
    },

    async analyzeVideos(allVideoData: any[]): Promise<CampaignStrategy> {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allVideoData })
        });
        if (!response.ok) throw new Error('Neural Video Intelligence analysis failed.');
        return response.json();
    },

    async generateCreatives(brief: CampaignBrief, avatarKey: string, strategy: CampaignStrategy): Promise<AdCreative[]> {
        const response = await fetch('/api/creatives', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brief, avatarKey, strategy })
        });
        if (!response.ok) throw new Error('Direct-response creative generation failed.');
        return response.json();
    },

    async rankCreatives(brief: CampaignBrief, avatarKey: string, creatives: AdCreative[]): Promise<CreativeRanking[]> {
        const response = await fetch('/api/creatives/rank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brief, avatarKey, creatives })
        });
        if (!response.ok) throw new Error('ROI Ranking operation timed out.');
        return response.json();
    },
};
