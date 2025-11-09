import { GoogleGenAI, Type } from "@google/genai";
import { AdCreative, TranscribedWord, VideoAnalysisResult, VideoFile } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisModel = 'gemini-2.5-flash';
const adGenerationModel = 'gemini-2.5-flash';

type VideoFrameData = {
  videoFile: VideoFile;
  frames: string[];
}

export const analyzeAndRankVideos = async (videoFrameData: VideoFrameData[]): Promise<VideoAnalysisResult[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }

  const filePrompts = videoFrameData.map(({ videoFile, frames }) => {
    const imageParts = frames.map(frame => ({
      inlineData: { mimeType: 'image/jpeg', data: frame },
    }));
    return [...imageParts, { text: `---VIDEO_NAME:${videoFile.file.name}---` }];
  }).flat();
  
  const prompt = `You are an expert AI video intelligence analyst, specializing in Meta ads for the personal training industry. I have provided frames from several videos.
  
  Your task is to perform a deep analysis of each video and rank them from best to worst based on their potential to be a successful direct-response ad.

  For each video, provide:
  1.  **Ranking and Justification:** A rank and a clear reason for it, considering factors like visual clarity, hook potential, emotional appeal, and clear depiction of fitness activities.
  2.  **Summary:** A concise summary of the video's content.
  3.  **Scene Breakdown:** A timestamped list of the key visual scenes or shots.
  4.  **Key Elements:** A list of key objects or actions depicted (e.g., 'kettlebell swing', 'running on treadmill').
  5.  **Emotional Tone:** A list of the dominant emotions conveyed (e.g., 'motivational', 'intense', 'positive').

  Strictly adhere to the JSON schema provided.
  `;
  
  const response = await ai.models.generateContent({
    model: analysisModel,
    contents: { parts: [...filePrompts, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            rank: { type: Type.INTEGER },
            fileName: { type: Type.STRING },
            summary: { type: Type.STRING },
            justification: { type: Type.STRING },
            sceneDescriptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["timestamp", "description"],
              },
            },
            keyObjects: { type: Type.ARRAY, items: { type: Type.STRING } },
            emotionalTone: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["rank", "fileName", "summary", "justification", "sceneDescriptions", "keyObjects", "emotionalTone"],
        },
      },
    },
  });

  try {
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse as VideoAnalysisResult[];
  } catch (error) {
    console.error("Failed to parse ranking response:", error, response.text);
    throw new Error("Failed to process the AI's analysis response due to an invalid format. Please try again.");
  }
};


export const generateAdCreatives = async (
  analysisResult: VideoAnalysisResult,
  productInfo: string
): Promise<AdCreative[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }

  const prompt = `
You are an elite AI Video Editor and Meta Ads Strategist for the personal training industry. Your task is to create a complete "Creative Blueprint" for 10 high-converting video ads based on the provided deep video analysis. This blueprint must include both the ad copy and a detailed, second-by-second editing plan. You MUST adhere to the "Mastery 2025" framework.

---
**Mastery 2025 Framework Rules:**
1.  **Creative Architecture (4-Phase Framework):** Structure every ad with a Pattern Interrupt, Value Prop, Validation, and Action Driver.
2.  **Psychological Triggers:** Stack a Primary Driver (Fear, Curiosity, etc.) with Secondary Reinforcers (Scarcity, Social Proof, etc.).
3.  **Hook Multiplication (PASTOR Formula):** Generate diverse hooks based on Problem, Amplify, Solution, Testimonial, Offer, Response.
4.  **Industry-Specific Tactics:** Focus on transformation, authority, and client pain points.

---

**Deep Analysis of Winning Video (${analysisResult.fileName}):**
*   **Summary:** ${analysisResult.summary}
*   **Justification:** ${analysisResult.justification}
*   **Scene Breakdown:** ${analysisResult.sceneDescriptions.map(s => `(${s.timestamp}) ${s.description}`).join(', ')}
*   **Key Elements:** ${analysisResult.keyObjects.join(', ')}
*   **Emotional Tone:** ${analysisResult.emotionalTone.join(', ')}

**Product Information:**
${productInfo}

---

**YOUR TASK:**
For each of the 10 ad variations, provide:
1.  A compelling title for the variation (e.g., "The 'Fear of Missing Out' Angle").
2.  The ad copy (headline, body, cta).
3.  A detailed, timestamped **Edit Plan** that tells a human editor exactly how to cut the video. It should describe the visual from the source video, the specific edit to make (e.g., "Quick zoom," "Text overlay"), and any text to show on screen.

**Output Format:**
Strictly adhere to the JSON schema provided.
`;

  const response = await ai.models.generateContent({
    model: adGenerationModel,
    contents: prompt,
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                ads: {
                    type: Type.ARRAY,
                    description: "An array of up to 10 unique ad creative blueprints.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            variationTitle: { type: Type.STRING, description: "A descriptive title for the ad angle (e.g., 'Social Proof Angle')." },
                            headline: { type: Type.STRING, description: "The Pattern Interrupt hook. A short, attention-grabbing headline." },
                            body: { type: Type.STRING, description: "The Value Prop & Validation. Persuasive body copy (2-4 sentences)." },
                            cta: { type: Type.STRING, description: "The Action Driver. A clear and urgent call to action." },
                            editPlan: {
                                type: Type.ARRAY,
                                description: "A step-by-step editing plan for the video.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        timestamp: { type: Type.STRING, description: "Time range for the scene (e.g., '0s-2s')." },
                                        visual: { type: Type.STRING, description: "Description of the visual content in this scene." },
                                        edit: { type: Type.STRING, description: "Specific editing action to take (e.g., 'Add text overlay', 'Quick zoom')." },
                                        overlayText: { type: Type.STRING, description: "Text to display on screen. Use 'N/A' if none." }
                                    },
                                    required: ["timestamp", "visual", "edit", "overlayText"]
                                }
                            }
                        },
                        required: ["variationTitle", "headline", "body", "cta", "editPlan"]
                    }
                }
            },
            required: ["ads"]
        }
    }
  });

  try {
    const jsonResponse = JSON.parse(response.text);
    if(jsonResponse.ads && Array.isArray(jsonResponse.ads)) {
        return jsonResponse.ads as AdCreative[];
    }
    throw new Error("The AI's ad creative response was missing the expected 'ads' data.");
  } catch (error) {
    console.error("Failed to parse ad variations response:", error, response.text);
    if (error instanceof Error && error.message.includes("'ads' data")) {
        throw error;
    }
    throw new Error("Failed to process the AI's ad creative response due to an invalid format. Please try again.");
  }
};

export const transcribeAudio = async (audioBlob: Blob): Promise<TranscribedWord[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API key is not configured.");
  }

  const reader = new FileReader();
  const base64AudioPromise = new Promise<string>((resolve, reject) => {
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });
  
  const audioData = await base64AudioPromise;

  const prompt = `Transcribe the following audio file. Provide a word-by-word transcription with precise start and end timestamps for each word.`;
  
  const response = await ai.models.generateContent({
    model: analysisModel, // or a model fine-tuned for transcription if available
    contents: {
      parts: [
        { inlineData: { mimeType: audioBlob.type, data: audioData } },
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                start: { type: Type.NUMBER },
                end: { type: Type.NUMBER },
              },
              required: ["word", "start", "end"],
            },
          },
        },
        required: ["transcription"],
      },
    },
  });

  try {
    const jsonResponse = JSON.parse(response.text);
    if (jsonResponse.transcription && Array.isArray(jsonResponse.transcription)) {
      return jsonResponse.transcription as TranscribedWord[];
    }
    throw new Error("The AI's transcription response was missing the expected 'transcription' data.");
  } catch (error) {
    console.error("Failed to parse transcription response:", error, response.text);
    if (error instanceof Error && error.message.includes("'transcription' data")) {
        throw error;
    }
    throw new Error("Failed to process the AI's transcription response due to an invalid format. Please try again.");
  }
};
