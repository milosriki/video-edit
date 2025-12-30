
import { GoogleGenAI, Type } from '@google/genai';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CampaignBrief, CampaignStrategy, AdCreative, CreativeRanking } from '../../../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load JSON data using fs to avoid require/ESM issues
const avatarsPath = path.join(__dirname, '../ai/knowledge/avatars.json');
const copyDBPath = path.join(__dirname, '../ai/knowledge/copyDatabase.json');

const avatars = JSON.parse(await readFile(avatarsPath, 'utf-8'));
const copyDB = JSON.parse(await readFile(copyDBPath, 'utf-8'));

// Re-exporting types for use in the main server file.
export type { CampaignBrief, CampaignStrategy, AdCreative, CreativeRanking };

// FIX: Obtained the API key exclusively from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// FIX: Use compliant model names as per guidelines.
const analysisModel = 'gemini-3-pro-preview';
const adGenerationModel = 'gemini-3-flash-preview';

/**
 * This helper function reads the AI's response text safely.
 */
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

// FIX: Add 'description' property to satisfy the Avatar interface.
export function getAvatars() {
    return Object.entries(avatars).map(([key, v]) => ({
        key,
        name: (v as any)?.name ?? key,
        description: (v as any)?.desires ?? (v as any)?.name ?? key,
        pain_points: (v as any)?.pain_points,
        desires: (v as any)?.desires
    }));
}

/** Analyze a set of user videos and produce a strategy */
export async function analyzeVideoContent(allVideoData: any[]): Promise<CampaignStrategy> {
    const systemPrompt = `You are an expert AI video intelligence analyst. Your goal is to analyze the raw video content provided (frames and transcription) and formulate a high-level ad strategy.

Identify the key visual elements, the emotional tone, and how these assets can be used to target premium fitness clients in Dubai and Abu Dhabi.

Provide a strategy summary, key angles to test, risks to avoid (e.g. poor audio, bad lighting, cultural insensitivity), and detailed analysis for each video file.`;
    
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

/** Generate 10 ad creative blueprints with strict schema using the PTD Mega-Prompt */
export async function generateAdCreatives(
    brief: CampaignBrief,
    avatarKey: string,
    strategy: CampaignStrategy
): Promise<AdCreative[]> {
    const avatar = avatars[avatarKey];
    const copyData = copyDB;
    const relevantHeadlines = copyData.headlines[avatarKey] || [];
    const clientHooks = copyData.hooks || [];

    const masterPrompt = `You are the PTD Fitness Creative Dominator, an elite AI strategist and "renegade marketer". Your sole mission is to analyze raw PTD Fitness video transcripts/strategy and transform them into world-class, high-converting direct-response video ads for the Dubai & Abu Dhabi premium market.

**I. CORE IDENTITY & MISSION**
You do not write generic ads. You understand the real psychology of the UAE market, targeting secret, unadmitted desires like Status/Superiority and Social Approval. You use proven PTD messaging and advanced, data-driven frameworks to engineer ads that get results.

**II. THE PTD AVATAR DNA (TARGET FOR THIS TASK)**
- **Archetype:** ${avatar.name}
- **Pain Points:** ${avatar.pain_points}
- **Desires:** ${avatar.desires}
- **Psych Hook:** ${avatar.psych_hook}
- **Internal Language:** ${avatar.language || 'N/A'}

**III. CAMPAIGN CONTEXT**
- Product: ${brief.productName}
- Offer: ${brief.offer}
- Angle: ${brief.angle}
- Tone: ${brief.tone}
- Platform: ${brief.platform}
- CTA: ${brief.cta}

**IV. ASSET ANALYSIS & STRATEGY**
- **Primary Video (Main Narrative):** ${strategy.primaryVideoFileName}
- **B-Roll Pool:** ${strategy.bRollFileNames?.join(', ') || 'None'}
- **Strategy Justification:** ${strategy.strategyJustification}
- **Key Angles Identified:** ${strategy.keyAngles.join(', ')}
- **Risks to Avoid:** ${strategy.risksToAvoid.join(', ')}

**V. MESSAGING BANK (MANDATORY RESOURCES)**
You MUST build all ad copy from these proven, high-converting headlines and client soundbites.
- **PROVEN HEADLINES:** ${relevantHeadlines.join('; ')}
- **PROVEN CLIENT HOOKS:** ${clientHooks.join('; ')}

**VI. THE 4-PHASE AD STRUCTURE (MANDATORY)**
Every ad blueprint must follow this neurological structure:
1.  **Pattern Interrupt (0.0-0.8s):** Stop the scroll. Hijack the brain's Reticular Activating System. (Visual or Text).
2.  **Value Proposition (0.9-3.0s):** State the unique mechanism/benefit.
3.  **Validation Block (3.1-35s):** Stack proof (Authority/Social Proof).
4.  **Action Driver (36-60s):** Low-Friction CTA + Urgency.

**VII. CREATIVE CONCEPT SPARKS**
Use these unconventional angles if applicable:
- "Sex and the City" Vibe (Women 50+)
- "Netflix Drama" / Cinematic Quality
- "Guerrilla Marketing" (Football jersey concept)
- "Luxury In-Home" (Privacy/Cultural Respect)

**VIII. OUTPUT INSTRUCTIONS**
Generate **10 distinct, high-converting video ad blueprints**.
- The \`editPlan\` must strictly use file names from the "Primary Video" and "B-Roll Pool".
- \`overlayText\` must be punchy, high-contrast copy.
- \`edit\` instructions should be precise (e.g., "Fast cut", "Zoom in").
- The output must be a valid JSON array matching the schema below.

Generate the response now.`;

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
`).join('\\n');

    const prompt = `You are a world-class performance marketing director specializing in direct-response video ads for the UAE premium market. Your task is to analyze and rank the following ad creatives based on their predicted Return on Investment (ROI).

**CONTEXT:**
- Target Avatar: ${avatar.name} (Pains: ${avatar.pain_points}, Desires: ${avatar.desires})
- Campaign Goal: Drive leads for "${brief.productName}" with the offer "${brief.offer}".

**CREATIVES TO RANK:**
${creativesString}

**INSTRUCTIONS:**
1.  **Analyze Each Creative:** Evaluate each creative against the target avatar's psychology and the campaign goal.
2.  **Assign Scores:**
    *   **roiScore (0-100):** Your primary prediction of which creative will generate the highest return on ad spend. 100 is best.
    *   **hookScore (0-10):** How well the headline and first few seconds will stop the scroll.
    *   **ctaScore (0-10):** How compelling and clear the call-to-action is.
3.  **Provide Justification:** For each creative, provide a concise reason for its roiScore.
4.  **Output JSON:** Your final output must be a valid JSON array, strictly adhering to the provided schema, containing an object for each creative. The 'index' must match the creative number from the input.`;

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
