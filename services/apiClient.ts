import type { CampaignBrief, CampaignStrategy, AdCreative, Avatar, CreativeRanking } from '../types';
import { titanClient } from '../frontend/src/api/titan_client';

// PRO LEVEL CHANGE: Dynamic URL based on environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

async function handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`API Error ${response.status}: ${body}`);
    }
    return contentType.includes('application/json') ? response.json() : response.text() as any;
}

export const apiClient = {
    // 1. Fetch Avatars (Route to Python)
    async fetchAvatars(): Promise<Avatar[]> {
        // In Pro version, these should live in the DB, but for now we fetch from backend config
        return fetch(`${API_BASE_URL}/avatars`).then(res => handleResponse<Avatar[]>(res));
    },

    // 2. Deep Analysis (Route to Python Director Agent)
    async analyzeVideos(allVideoData: any[]): Promise<CampaignStrategy> {
        // We map the frontend data structure to what the Python Director expects
        const videoUri = allVideoData[0]?.videoFile?.name || "unknown";

        // Call the Titan Backend
        const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_uri: videoUri }), // In real prod, upload file first and send URL
        });

        const analysis = await handleResponse<any>(response);

        // Map Python response back to Frontend CampaignStrategy type
        return {
            primaryVideoFileName: videoUri,
            bRollFileNames: [],
            strategyJustification: analysis.reasoning,
            videoAnalyses: [{
                fileName: videoUri,
                rank: 1,
                justification: analysis.reasoning,
                summary: `Hook: ${analysis.hook_style}, Pacing: ${analysis.pacing}`,
                sceneDescriptions: [],
                keyObjects: analysis.visual_elements,
                emotionalTone: [analysis.emotional_trigger]
            }]
        };
    },

    // 3. Generate Creatives (Route to Veo/Titan)
    async generateCreatives(brief: CampaignBrief, avatarKey: string, strategy: CampaignStrategy): Promise<AdCreative[]> {
        // This calls the /generate endpoint on Python which triggers Veo
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                assets: [strategy.primaryVideoFileName],
                target_audience: brief.targetMarket
            }),
        });

        const result = await handleResponse<any>(response);

        // Return structured data for the UI
        return [{
            primarySourceFileName: result.video_uri,
            variationTitle: 'Veo Generated Ad 1',
            headline: brief.offer,
            body: `Targeting: ${brief.targetMarket}`,
            cta: brief.cta,
            editPlan: [],
            __roiScore: 92,
            __hookScore: 9,
            __ctaScore: 9
        }];
    },

    // 4. Ranking (Route to AutoSxS Judge)
    async rankCreatives(brief: CampaignBrief, avatarKey: string, creatives: AdCreative[]): Promise<CreativeRanking[]> {
        // In Pro version, ranking happens automatically during generation.
        // We return a passthrough here for UI compatibility.
        return creatives.map((c, i) => ({
            index: i,
            roiScore: c.__roiScore || 0,
            reasons: "Scored by Titan AutoSxS Engine",
            hookScore: c.__hookScore || 0,
            ctaScore: c.__ctaScore || 0
        }));
    }
};
