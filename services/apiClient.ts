import type { CampaignBrief, CampaignStrategy, AdCreative, Avatar, CreativeRanking } from '../types';
import { AVATARS } from '../constants/knowledge';
import * as gemini from './geminiService';

/**
 * PTD Command Center API Client
 * Orchestrates communication between the frontend and the AI logic.
 * Unified to use Local Gemini Service for zero-latency node processing.
 */
export const apiClient = {
    async fetchAvatars(): Promise<Avatar[]> {
        return Object.entries(AVATARS).map(([key, v]) => ({
            key,
            name: (v as any).name,
            description: (v as any).desires || (v as any).name,
            pain_points: (v as any).pain_points,
            desires: (v as any).desires
        }));
    },

    async analyzeVideos(allVideoData: any[]): Promise<CampaignStrategy> {
        return gemini.analyzeVideosLocal(allVideoData);
    },

    async generateCreatives(brief: CampaignBrief, avatarKey: string, strategy: CampaignStrategy): Promise<AdCreative[]> {
        return gemini.generateCreativesLocal(brief, avatarKey, strategy);
    },

    async rankCreatives(brief: CampaignBrief, avatarKey: string, creatives: AdCreative[]): Promise<CreativeRanking[]> {
        return gemini.rankCreativesLocal(brief, avatarKey, creatives);
    },

    async fetchFacebookInsights(startDate: string, endDate: string) {
        return gemini.fetchFacebookInsights(startDate, endDate);
    },

    async fetchHubSpotRoi(adId: string) {
        const endpoint = 'https://ad-alpha-mcp-489769736562.us-central1.run.app';
        const response = await fetch(`${endpoint}/hubspot/roi?ad_id=${adId}`);
        if (!response.ok) throw new Error('Failed to fetch HubSpot ROI');
        return await response.json();
    }
};
