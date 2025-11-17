import * as functions from "firebase-functions";
import { GoogleGenAI, Type } from '@google/genai';
import * as avatars from '../ai/knowledge/avatars.json' with { type: 'json' };
import * as copyDB from '../ai/knowledge/copyDatabase.json' with { type: 'json' };

// Re-exporting types for use in the main server file.
export type { CampaignBrief } from '../../../types';
export type { CampaignStrategy } from '../../../types';
export type { AdCreative } from '../../../types';
export type { CreativeRanking } from '../../../types';

// FIX: This now correctly uses the imported `functions` module to get the API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? functions.config().gemini.api_key });
const analysisModel = 'gemini-2.5-pro';
const adGenerationModel = 'gemini-2.5-flash';

/**
 * FIX: This helper function reads the AI's response text safely.
 * (All invisible characters have been removed)
 */
function readGenAIText(resp: any): string {
  const t = typeof resp.text === 'function' ? resp.text() : resp.text;
  if (typeof t !== 'string' || !t.trim()) {
    throw new Error('Empty or invalid AI response text');
  }
  return t;
}

export function getAvatars() {
    return Object.entries((avatars as any).default).map(([key, v]) => ({
        key,
        name: (v as any)?.name ?? key,
        pain_points: (v as any)?.pain_points,
        desires: (v as any)?.desires
    }));
}

/** Analyze a set of user videos and produce a strategy */
export async function analyzeVideoContent(allVideoData: any[]): Promise<import('../../../types').CampaignStrategy> {
    const systemPrompt = `You are an expert AI video intelligence analyst for the Dubai/Abu Dhabi market. Your task is to perform a deep analysis of each video's visual and audio content and then devise a winning campaign strategy.
    **Part 1: Individual Video Analysis**
    For each video, provide a detailed breakdown. Rank them from best to worst based on their potential to be a successful direct-response ad. Consider factors like visual clarity, hook potential, emotional appeal, clear depiction of fitness activities, and the strength of the spoken message.
    **Part 2: Overall Campaign Strategy**
    After analyzing all videos, create a unified campaign strategy. Select the single best video as the 'Primary Video' and identify any other videos that contain valuable clips suitable for 'B-Roll' footage in a remixed ad. Justify your choices.
    Strictly adhere to the JSON schema provided.`;
    
    const filePrompts = allVideoData.map(({ videoFile, frames, transcription }) => {
        const imageParts = frames.map(frame => ({
          inlineData: { mimeType: 'image/jpeg', data: frame },
        }));
        const textParts = [{ text: `---VIDEO_FILE_START--- ---VIDEO_NAME:${videoFile.id}---` }];
        if (transcription) {
          textParts.push({ text: `---TRANSCRIPTION---\n${transcription}\n---END_TRANSCRIPTION---` });
        }
        textParts.push({ text: `---VIDEO_FILE_END---` });
        return [...imageParts, ...textParts];
      }).flat();

    const response = await ai.models.generateContent({
        model: analysisModel,
        contents: [{ parts: [...filePrompts, { text: systemPrompt }] }],
        config: {
            responseMimeType: "application/json",
            maxOutputTokens: 32768, 
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                  primaryVideoFileName: { type: Type.STRING },
                  bRollFileNames: { type: Type.ARRAY, items: { type: Type.STRING } },
                  strategyJustification: { type: Type.STRING },
                  videoAnalyses: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { rank: { type: Type.NUMBER }, fileName: { type: Type.STRING }, justification: { type: Type.STRING }, summary: { type: Type.STRING }, sceneDescriptions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { timestamp: { type: Type.STRING }, description: { type: Type.STRING }}, required: ["timestamp", "description"]}}, keyObjects: { type: Type.ARRAY, items: { type: Type.STRING }}, emotionalTone: { type: Type.ARRAY, items: { type: Type.STRING }}, audioAnalysis: { type: Type.OBJECT, nullable: true, properties: { summary: { type: Type.STRING }, keyPhrases: { type: Type.ARRAY, items: { type: Type.STRING }}, callsToAction: { type: Type.ARRAY, items: { type: Type.STRING }}}, required: ["summary", "keyPhrases", "callsToAction"]}}, veoHookSuggestion: { type: Type.STRING, nullable: true }}, required: ["rank", "fileName", "justification", "summary", "sceneDescriptions", "keyObjects", "emotionalTone"]}}
              },
              required: ["primaryVideoFileName", "bRollFileNames", "strategyJustification", "videoAnalyses"]
            }
        }
    });

    return JSON.parse(readGenAIText(response));
}

/** Generate 10 ad creative blueprints with strict schema */
export async function generateAdCreatives(
    brief: import('../../../types').CampaignBrief,
    avatarKey: string,
    strategy: import('../../../types').CampaignStrategy
): Promise<import('../../../types').AdCreative[]> {
    const avatar = (avatars as any).default[avatarKey];
    const relevantHeadlines = (copyDB as any).default.headlines[avatarKey as keyof typeof (copyDB as any).default.headlines];

    const masterPrompt = `You are the PTD Fitness Creative Dominator, an elite AI strategist for the Dubai & Abu Dhabi premium market.
**MISSION:**
Generate 10 distinct, high-converting direct-response video ad blueprints based on the provided strategy and campaign brief.
**TARGET AVATAR:**
- Name: ${avatar.name}
- Pains: ${avatar.pain_points}
- Desires: ${avatar.desires}
- Psych Hook: ${(avatar as any).psych_hook}
**CAMPAIGN BRIEF:**
- Product: ${brief.productName}
- Offer: ${brief.offer}
- Angle: ${brief.angle}
- Tone: ${brief.tone}
- Platform: ${brief.platform}
- Call to Action: ${brief.cta}
**STRATEGIC ANALYSIS OF PROVIDED VIDEOS:**
- Primary Video for Audio/Narrative: ${strategy.primaryVideoFileName}
- Available B-Roll Videos: ${strategy.bRollFileNames?.join(', ') || 'None'}
- Winning Strategy: ${strategy.strategyJustification}
- Key Angles to Leverage: ${(strategy as any).keyAngles?.join(', ') || 'N/A'}
- Risks to Avoid: ${(strategy as any).risksToAvoid?.join(', ') || 'N/A'}
**INSTRUCTIONS:**
1.  **Create 10 variations.** Each must be unique.
2.  **Use the Provided Assets:** The \`editPlan\` for each creative MUST use file names from the "Primary Video" and "B-Roll Videos" listed above.
3.  **Adhere to the Schema:** The final output MUST be a valid JSON array matching the provided schema. Do not include any other text or explanations.
4.  **Use Proven Headlines:** Draw inspiration from these proven headlines for this avatar: ${relevantHeadlines.join('; ')}
5.  **Be Specific:** The 'visual' and 'edit' descriptions in the edit plan should be concise and actionable for a video editor.
6.  **Overlay Text:** Create compelling, short overlay text. Use 'N/A' if no text is needed for a scene.`;

    const response = await ai.models.generateContent({
        model: adGenerationModel,
        contents: [{ parts: [{ text: masterPrompt }] }],
        config: {
            responseMimeType: "application/json",
            maxOutputTokens: 32768,
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        primarySourceFileName: { type: Type.STRING },
                        variationTitle: { type: Type.STRING },
                        headline: { type: Type.STRING },
                        body: { type: Type.STRING },
                        cta: { type: Type.STRING },
                        editPlan: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    timestamp: { type: Type.STRING },
                                    visual: { type: Type.STRING },
                                    edit: { type: Type.STRING },
                                    overlayText: { type: Type.STRING },
                                    sourceFile: { type: Type.STRING }
                                },
                                required: ["timestamp", "visual", "edit", "overlayText", "sourceFile"]
                            }
                        }
                    },
                     required: ["primarySourceFileName", "variationTitle", "headline", "body", "cta", "editPlan"]
                }
            }
        }
    });

    return JSON.parse(readGenAIText(response));
}

/** Rank creatives by predicted ROI and return scores */
export async function rankCreatives(
    brief: import('../../../types').CampaignBrief,
    avatarKey: string,
    creatives: import('../../../types').AdCreative[]
): Promise<import('../../../types').CreativeRanking[]> {
    const avatar = (avatars as any).default[avatarKey];

    const creativesString = creatives.map((c, i) => `
--- CREATIVE ${i} ---
Variation Title: ${c.variationTitle}
Headline: ${c.headline}
Body: ${c.body}
CTA: ${c.cta}
--- END CREATIVE ${i} ---
`).join('\n');

    const prompt = `You are a world-class performance marketing director specializing in direct-response video ads for the UAE premium market. Your task is to analyze and rank the following ad creatives based on their predicted Return on Investment (ROI).
**CONTEXT:**
- Target Avatar: ${avatar.name} (Pains: ${avatar.pain_points}, Desires: ${avatar.desires})
- Campaign Goal: Drive leads for "${brief.productName}" with the offer "${brief.offer}".
**CREATIVES TO RANK:**
${creativesString}
**INSTRUCTIONS:**
1.  **Analyze Each Creative:** Evaluate each creative against the target avatar's psychology and the campaign goal.
2.  **Assign Scores:**
    * **roiScore (0-100):** Your primary prediction of which creative will generate the highest return on ad spend. 100 is best.
    * **hookScore (0-10):** How well the headline and first few seconds will stop the scroll.
    * **ctaScore (0-10):** How compelling and clear the call-to-action is.
3.  **Provide Justification:** For each creative, provide a concise reason for its roiScore.
4.  **Output JSON:** Your final output must be a valid JSON array, strictly adhering to the provided schema, containing an object for each creative. The 'index' must match the creative number from the input. Do not include markdown or any other text.`;

    const response = await ai.models.generateContent({
        model: adGenerationModel, // Using flash for speed
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseMimeType: 'application/json',
            maxOutputTokens: 8192,
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        index: { type: Type.NUMBER },
                        roiScore: { type: Type.NUMBER },
                        reasons: { type: Type.STRING },
                        hookScore: { type: Type.NUMBER },
                        ctaScore: { type: Type.NUMBER },
                    },
                    required: ["index", "roiScore", "reasons", "hookScore", "ctaScore"],
                }
            },
            temperature: 0.2
        }
    });

    return JSON.parse(readGenAIText(response));
}
