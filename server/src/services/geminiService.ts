
import { GoogleGenAI, Type } from '@google/genai';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CampaignBrief, CampaignStrategy, AdCreative, CreativeRanking } from '../../../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const avatarsPath = path.join(__dirname, '../ai/knowledge/avatars.json');
const copyDBPath = path.join(__dirname, '../ai/knowledge/copyDatabase.json');

const avatars = JSON.parse(await readFile(avatarsPath, 'utf-8'));
const copyDB = JSON.parse(await readFile(copyDBPath, 'utf-8'));

export type { CampaignBrief, CampaignStrategy, AdCreative, CreativeRanking };

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const analysisModel = 'gemini-3-pro-preview';
const adGenerationModel = 'gemini-3-flash-preview';

function readGenAIText(resp: any): string {
  const text = resp?.text;
  if (typeof text !== 'string' || !text.trim()) {
    console.error("AI response text is empty, invalid, or missing.", { response: resp });
    const candidateText = resp?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof candidateText === 'string' && candidateText.trim()) {
      return candidateText;
    }
    throw new Error('AI response was empty or in an unexpected format.');
  }
  return text;
}

export function getAvatars() {
    return Object.entries(avatars).map(([key, v]) => ({
        key,
        name: (v as any)?.name ?? key,
        description: (v as any)?.desires ?? (v as any)?.name ?? key,
        pain_points: (v as any)?.pain_points,
        desires: (v as any)?.desires
    }));
}

export async function analyzeVideoContent(allVideoData: any[]): Promise<CampaignStrategy> {
    const systemPrompt = `You are an expert AI video intelligence analyst. Your goal is to analyze raw video content (frames and transcription) to formulate a high-level ad strategy for UAE premium fitness. Provide strategy summary, key angles, risks, and detailed per-video analysis.`;
    
    const filePrompts = allVideoData.map(({ videoFile, frames, transcription }) => {
        const imageParts = frames.map((frame: string) => ({
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
            maxOutputTokens: 8192, 
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                  primaryVideoFileName: { type: Type.STRING },
                  bRollFileNames: { type: Type.ARRAY, items: { type: Type.STRING } },
                  strategyJustification: { type: Type.STRING },
                  keyAngles: { type: Type.ARRAY, items: { type: Type.STRING } },
                  risksToAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
                  videoAnalyses: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { 
                      rank: { type: Type.NUMBER }, 
                      fileName: { type: Type.STRING }, 
                      justification: { type: Type.STRING }, 
                      summary: { type: Type.STRING }, 
                      sceneDescriptions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { timestamp: { type: Type.STRING }, description: { type: Type.STRING }}, required: ["timestamp", "description"]}}, 
                      keyObjects: { type: Type.ARRAY, items: { type: Type.STRING }}, 
                      emotionalTone: { type: Type.ARRAY, items: { type: Type.STRING }},
                      audioAnalysis: { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, keyPhrases: { type: Type.ARRAY, items: { type: Type.STRING }}, callsToAction: { type: Type.ARRAY, items: { type: Type.STRING }}}, required: ["summary", "keyPhrases", "callsToAction"]},
                      veoHookSuggestion: { type: Type.STRING }
                    }, required: ["rank", "fileName", "justification", "summary", "sceneDescriptions", "keyObjects", "emotionalTone"]}}
              },
              required: ["primaryVideoFileName", "bRollFileNames", "strategyJustification", "keyAngles", "risksToAvoid", "videoAnalyses"],
            }
        }
    });

    return JSON.parse(readGenAIText(response));
}

export async function generateAdCreatives(
    brief: CampaignBrief,
    avatarKey: string,
    strategy: CampaignStrategy
): Promise<AdCreative[]> {
    const avatar = avatars[avatarKey];
    const copyData = copyDB;
    const relevantHeadlines = copyData.headlines[avatarKey] || [];
    const clientHooks = copyData.hooks || [];

    const masterPrompt = `You are the PTD Fitness Creative Dominator. Transform raw PTD Fitness video assets into 10 world-class, high-converting direct-response video ads for Dubai/UAE.

**MANDATORY 4-PHASE STRUCTURE**
Every ad blueprint MUST categorize its scenes into one of these phases:
1. HOOK: Pattern Interrupt (0.0-3.0s).
2. MECHANISM: Unique value proposition/mechanism.
3. PROOF: Authority or social proof stack.
4. ACTION: Call to action with scarcity/urgency.

**RESOURCES**
- Headlines: ${relevantHeadlines.join('; ')}
- Hooks: ${clientHooks.join('; ')}

**OUTPUT**
Valid JSON array of 10 AdCreatives. Ensure each scene in editPlan has a "phase" property: "HOOK", "MECHANISM", "PROOF", or "ACTION".`;

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
                                    sourceFile: { type: Type.STRING },
                                    phase: { type: Type.STRING, enum: ["HOOK", "MECHANISM", "PROOF", "ACTION"] }
                                },
                                required: ["timestamp", "visual", "edit", "overlayText", "sourceFile", "phase"]
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

export async function rankCreatives(
    brief: CampaignBrief,
    avatarKey: string,
    creatives: AdCreative[]
): Promise<CreativeRanking[]> {
    const avatar = avatars[avatarKey];

    const creativesString = creatives.map((c, i) => `
--- CREATIVE ${i} ---
Variation Title: ${c.variationTitle}
Headline: ${c.headline}
Body: ${c.body}
CTA: ${c.cta}
--- END CREATIVE ${i} ---
`).join('\n');

    const prompt = `You are a world-class performance marketing director. Analyze and rank these 10 creatives for predicted ROI in the UAE premium fitness market for avatar ${avatar.name}. Output strictly JSON array with roiScore (0-100), hookScore (0-10), ctaScore (0-10), and reasons.`;

    const response = await ai.models.generateContent({
        model: adGenerationModel, 
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
