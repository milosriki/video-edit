import { GoogleGenAI, Type } from '@google/genai';
import avatars from '../ai/knowledge/avatars.js';
import copyDB from '../ai/knowledge/copyDatabase.js';
import winningAdsDB from '../ai/knowledge/winningAdsDatabase.js';

// Re-exporting types for use in the main server file.
export type { CampaignBrief } from '../types.js';
export type { CampaignStrategy } from '../types.js';
export type { AdCreative } from '../types.js';
export type { CreativeRanking } from '../types.js';

// Lazy initialization to avoid module-load-time errors
let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set. Please configure it in your Firebase Functions environment.');
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

const analysisModel = 'gemini-1.5-pro';
const adGenerationModel = 'gemini-1.5-flash';

/**
 * FIX: This helper function reads the AI's response text safely.
 */
function readGenAIText(resp: any): string {
  const t = typeof resp.text === 'function' ? resp.text() : resp.text;
  if (typeof t !== 'string' || !t.trim()) {
    throw new Error('Empty or invalid AI response text');
  }
  return t;
}

export function getAvatars() {
    return Object.entries((avatars as any)).map(([key, v]) => ({
        key,
        name: (v as any)?.name ?? key,
        pain_points: (v as any)?.pain_points,
        desires: (v as any)?.desires
    }));
}

/** Analyze a set of user videos and produce a strategy */
export async function analyzeVideoContent(allVideoData: any[]): Promise<import('../types.js').CampaignStrategy> {
    const neuroHooks = (winningAdsDB as any).neuro_hooks.join(', ');
    const systemPrompt = `You are "Andromeda AI", an elite video intelligence analyst and neuro-marketing expert for the Dubai/Abu Dhabi market.
    **MISSION:**
    Perform a deep forensic analysis of each video's visual, audio, and psychological impact to devise a winning campaign strategy.
    
    **KNOWLEDGE BASE (NEURO-MARKETING):**
    Apply these principles: ${neuroHooks}. Look for "Eye Patterns" (direct gaze), "Pattern Interrupts" (sudden visual changes), and "Emotional Micro-expressions".

    **Part 1: Individual Video Analysis**
    For each video, provide a detailed breakdown. Rank them from best to worst based on their potential to be a successful direct-response ad.
    - **Visual Clarity:** Is the lighting professional? Is the resolution high?
    - **Hook Potential:** Does the first 3 seconds contain a "Pattern Interrupt"?
    - **Emotional Appeal:** Does it trigger specific emotions (Desire, Fear of Missing Out, Status)?
    - **Fitness Specifics:** Does it show correct form? Is the physique aspirational?

    **Part 2: Overall Campaign Strategy**
    Select the single best video as the 'Primary Video' and identify 'B-Roll' candidates. Justify your choices using neuro-marketing terminology.

    **Part 3: Deep Emotional & Hook Analysis**
    Identify specific timestamps for:
    - **Hooks:** Moments that stop the scroll (0-3s).
    - **Emotional Peaks:** Moments of intense struggle or triumph.
    - **CTA Opportunities:** Moments of calm or direct address suitable for an offer overlay.

    Strictly adhere to the JSON schema provided.`;
    
    const filePrompts = allVideoData.map(({ videoFile, frames, transcription }) => {
        const imageParts = (frames || []).map((frame: string) => ({
          inlineData: { mimeType: 'image/jpeg', data: frame },
        }));
        const videoId = videoFile?.id || videoFile?.name || 'unknown';
        const textParts = [{ text: `---VIDEO_FILE_START--- ---VIDEO_NAME:${videoId}---` }];
        if (transcription) {
          textParts.push({ text: `---TRANSCRIPTION---\n${transcription}\n---END_TRANSCRIPTION---` });
        }
        textParts.push({ text: `---VIDEO_FILE_END---` });
        return [...imageParts, ...textParts];
      }).flat();

    const response = await getAI().models.generateContent({
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
                  videoAnalyses: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { rank: { type: Type.NUMBER }, fileName: { type: Type.STRING }, justification: { type: Type.STRING }, summary: { type: Type.STRING }, sceneDescriptions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { timestamp: { type: Type.STRING }, description: { type: Type.STRING }}, required: ["timestamp", "description"]}}, keyObjects: { type: Type.ARRAY, items: { type: Type.STRING }}, emotionalTone: { type: Type.ARRAY, items: { type: Type.STRING }}, audioAnalysis: { type: Type.OBJECT, nullable: true, properties: { summary: { type: Type.STRING }, keyPhrases: { type: Type.ARRAY, items: { type: Type.STRING }}, callsToAction: { type: Type.ARRAY, items: { type: Type.STRING }}}, required: ["summary", "keyPhrases", "callsToAction"]}, veoHookSuggestion: { type: Type.STRING, nullable: true }, emotionalMoments: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { timestamp: { type: Type.STRING }, emotion: { type: Type.STRING }, intensity: { type: Type.NUMBER } } } } }, required: ["rank", "fileName", "justification", "summary", "sceneDescriptions", "keyObjects", "emotionalTone"]}}
              },
              required: ["primaryVideoFileName", "bRollFileNames", "strategyJustification", "videoAnalyses"]
            }
        }
    });

    return JSON.parse(readGenAIText(response));
}

/** Generate 10 ad creative blueprints with strict schema */
export async function generateAdCreatives(
    brief: import('../types.js').CampaignBrief,
    avatarKey: string,
    strategy: import('../types.js').CampaignStrategy
): Promise<import('../types.js').AdCreative[]> {
    const avatar = (avatars as any)[avatarKey];
    const copyDBData = (copyDB as any);
    const winningAdsData = (winningAdsDB as any);
    const relevantHeadlines = copyDBData.headlines[avatarKey] || [];
    const winningStructures = JSON.stringify(winningAdsData.winning_structures_2025);

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

**WINNING AD STRUCTURES (2025):**
Use these proven structures as templates for your blueprints:
${winningStructures}

**STRATEGIC ANALYSIS:**
- Primary Video: ${strategy.primaryVideoFileName}
- B-Roll: ${strategy.bRollFileNames?.join(', ') || 'None'}
- Strategy: ${strategy.strategyJustification}

**INSTRUCTIONS:**
1.  **Create 10 variations.** Each must be unique and follow a specific "Winning Structure" (e.g., Pattern Interrupt, Us vs Them).
2.  **Use the Provided Assets:** The \`editPlan\` MUST use file names from the "Primary Video" and "B-Roll Videos".
3.  **Adhere to the Schema:** The final output MUST be a valid JSON array.
4.  **Use Proven Headlines:** Draw inspiration from: ${relevantHeadlines.join('; ')}
5.  **Neuro-Linguistic Programming:** Use sensory language (See, Feel, Hear) in the 'body' and 'overlayText'.
6.  **Overlay Text:** Create compelling, short overlay text. Use 'N/A' if no text is needed.`;

    const response = await getAI().models.generateContent({
        model: adGenerationModel,
        contents: [{ parts: [{ text: masterPrompt }] }],
        config: {
            responseMimeType: "application/json",
            maxOutputTokens: 8192,
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
    brief: import('../types.js').CampaignBrief,
    avatarKey: string,
    creatives: import('../types.js').AdCreative[]
): Promise<import('../types.js').CreativeRanking[]> {
    const avatar = (avatars as any)[avatarKey];
    const benchmarks = (winningAdsDB as any).metrics_benchmarks;

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
- Benchmarks: Thumbstop Ratio ${benchmarks.thumbstop_ratio}, CTR ${benchmarks.ctr_link}.

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

    const response = await getAI().models.generateContent({
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
