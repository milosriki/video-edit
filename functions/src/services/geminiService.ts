import * as functions from "firebase-functions";
import { GoogleGenAI, Type } from '@google/genai';
import * as avatars from '../ai/knowledge/avatars.json' with { type: 'json' };
import * as copyDB from '../ai/knowledge/copyDatabase.json' with { type: 'json' };

// Re-exporting types for use in the main server file.
export type { CampaignBrief } from '../../../types';
export type { CampaignStrategy } from '../../../types';
export type { AdCreative } from '../../../types';
export type { CreativeRanking } from '../../../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? functions.config().gemini.api_key });
const analysisModel = 'gemini-2.5-pro';
const adGenerationModel = 'gemini-2.5-flash';

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

export async function analyzeVideoContent(allVideoData: any[]): Promise<import('../../../types').CampaignStrategy> {
  const systemPrompt = `You are an expert AI video intelligence analyst... [Your full analysis prompt here]`;

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
          videoAnalyses: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { rank: { type: Type.NUMBER }, fileName: { type: Type.STRING }, justification: { type: Type.STRING }, summary: { type: Type.STRING }, sceneDescriptions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { timestamp: { type: Type.STRING }, description: { type: Type.STRING }}, required: ["timestamp", "description"]}}, keyObjects: { type: Type.ARRAY, items: { type: Type.STRING }}, emotionalTone: { type: Type.ARRAY, items: { type: Type.STRING }}, audioAnalysis: { type: Type.OBJECT, nullable: true, properties: { summary: { type: Type.STRING }, keyPhrases: { type: Type.ARRAY, items: { type: Type.STRING }}, callsToAction: { type: Type.ARRAY, items: { type: Type.STRING }}}, required: ["summary", "keyPhrases", "callsToAction"]}, veoHookSuggestion: { type: Type.STRING, nullable: true }}, required: ["rank", "fileName", "justification", "summary", "sceneDescriptions", "keyObjects", "emotionalTone"]}}
        },
        required: ["primaryVideoFileName", "bRollFileNames", "strategyJustification", "videoAnalyses"]
      }
    }
  });

  return JSON.parse(readGenAIText(response));
}

export async function generateAdCreatives(
  brief: import('../../../types').CampaignBrief,
  avatarKey: string,
  strategy: import('../../../types').CampaignStrategy
): Promise<import('../../../types').AdCreative[]> {
  const avatar = (avatars as any).default[avatarKey];
  const relevantHeadlines = (copyDB as any).default.headlines[avatarKey as keyof typeof (copyDB as any).default.headlines];

  const masterPrompt = `You are the PTD Fitness Creative Dominator... [Your full ad generation prompt here, using the PTD frameworks] ...`;

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

  const prompt = `You are a world-class performance marketing director... [Your full ranking prompt here] ...`;

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
