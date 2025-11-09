export interface AdCreative {
  headline: string;
  body: string;
  cta: string;
  variationTitle: string;
  editPlan: EditScene[];
}

export interface EditScene {
  timestamp: string;
  visual: string;
  edit: string;
  overlayText: string;
}

export interface VideoFile {
    file: File;
    id: string; // using file.name for simplicity as a key
    thumbnail: string;
}

export interface VideoAnalysisResult {
    rank: number;
    fileName: string;
    justification: string;
    summary: string;
    // Deep Analysis Fields
    sceneDescriptions: { timestamp: string; description: string; }[];
    keyObjects: string[];
    emotionalTone: string[];
}

export interface TranscribedWord {
  word: string;
  start: number;
  end: number;
}