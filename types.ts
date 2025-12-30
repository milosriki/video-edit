
export type MarketingFramework = 'AIDA' | 'PAS' | 'HSO' | 'Direct-Offer';

export interface RemoteToolConfig {
  id: string;
  name: string;
  endpoint: string;
  description: string;
  status: 'online' | 'offline' | 'error';
  lastPing?: string;
}

export interface ToolExecution {
  id: string;
  toolName: string;
  params: any;
  result: any;
  timestamp: string;
  status: 'success' | 'failed';
}

export interface RepoFile {
  path: string;
  content: string;
  language: string;
}

export interface Repository {
  projectName: string;
  description: string;
  structure: string[];
  files: RepoFile[];
}

export interface WinningCreative {
  file: File;
  previewUrl: string;
  analysis?: string;
  variations: CreativeVariation[];
}

export interface CreativeVariation {
  id: string;
  type: 'image' | 'video';
  prompt: string;
  reasoning: string;
  generatedUrl?: string;
  status: 'pending' | 'generating' | 'done' | 'error';
}

export interface PromptOptimization {
  original: string;
  optimized: string;
  improvements: string[];
  performancePrediction: number;
}

export interface AutonomousTask {
  id: string;
  goal: string;
  steps: Array<{
    action: string;
    result: string;
    critique?: string;
    correction?: string;
  }>;
  status: 'running' | 'completed' | 'failed';
}

export interface AdCreative {
  primarySourceFileName: string;
  variationTitle: string;
  headline: string;
  body: string;
  cta: string;
  editPlan: EditScene[];
  framework: MarketingFramework;
  ranking?: CreativeRanking;
  __roiScore?: number | null;
  __hookScore?: number | null;
  __ctaScore?: number | null;
  __reasons?: string;
  __roasPrediction?: number;
}

export interface EditScene {
  timestamp: string;
  visual: string;
  edit: string;
  overlayText?: string;
  sourceFile?: string;
}

export interface VideoFile {
    file: File;
    id: string;
    thumbnail: string;
    status: 'pending' | 'processing' | 'analyzed' | 'error';
    analysisResult?: VideoAnalysisResult;
    error?: string;
    progress?: number;
    loadingMessage?: string;
}

export interface AudioAnalysisResult {
  summary: string;
  keyPhrases: string[];
  callsToAction: string[];
}

export interface VideoAnalysisResult {
    fileName: string;
    rank: number;
    justification: string;
    summary: string;
    sceneDescriptions: Array<{ timestamp: string; description: string; }>;
    keyObjects: string[];
    emotionalTone: string[];
    hooks: string[];
    angles: string[];
    risks: string[];
    sentiments: string[];
    keyMoments?: Array<{ t: number; note: string }>;
    veoHookSuggestion?: string;
    audioAnalysis?: AudioAnalysisResult;
    uaeCompliance?: boolean;
}

export interface CampaignStrategy {
    summary: string;
    keyAngles: string[];
    risksToAvoid: string[];
    videoAnalyses: VideoAnalysisResult[];
    primaryVideoFileName?: string;
    bRollFileNames?: string[];
    strategyJustification?: string;
}

export interface TranscribedWord {
  word: string;
  start: number;
  end: number;
}

export type AdvancedEdit = { id: string } & (
  | { type: 'trim'; start: string; end: string }
  | { type: 'text'; text: string; start: string; end: string; position: 'top' | 'center' | 'bottom'; fontSize: number; }
  | { type: 'image'; file: File; position: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right'; scale: number; opacity: number; }
  | { type: 'speed'; factor: number }
  | { type: 'filter'; name: 'grayscale' | 'sepia' | 'negate' | 'vignette' }
  | { type: 'mute' }
);

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface CampaignBrief {
    productName: string;
    offer: string;
    targetMarket: string;
    angle: string;
    cta: string;
    tone: 'direct'|'empathetic'|'authoritative'|'playful'|'inspirational';
    framework: MarketingFramework;
    goals?: string[];
    platform: 'reels'|'shorts'|'tiktok'|'feed'|'stories';
}

export interface Avatar {
    key: string;
    name: string;
    description: string;
    pain_points?: string;
    desires?: string;
}

export interface CreativeRanking {
  index: number;
  roiScore: number;
  reasons: string;
  hookScore?: number;
  ctaScore?: number;
}

export interface StoryboardPanel {
  description: string;
  image_prompt: string;
  imageUrl?: string;
}
