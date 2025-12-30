
import type { CampaignBrief, CampaignStrategy, AdCreative, Avatar, CreativeRanking } from '../types';
import * as gemini from './geminiService';

export const apiClient = {
    async fetchAvatars(): Promise<Avatar[]> {
        return gemini.getAvatarsLocal();
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
};
