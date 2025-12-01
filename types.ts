
export interface AdCreative {
  primarySourceFileName: string;
  variationTitle: string;
  headline: string;
  body: string;
  cta: string;
  editPlan: EditScene[];
  ranking?: CreativeRanking; // For holding ranked data on the client
  // FIX: Add properties for ranked data used by AdCreativeCard
  __roiScore?: number | null;
  __hookScore?: number | null;
  __ctaScore?: number | null;
  __reasons?: string;
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
    /**
     * Legacy analysis result from original DirectorAgent
     * @deprecated Use titanAnalysis for new TITAN-based analysis
     */
    analysisResult?: VideoAnalysisResult;
    /**
     * TITAN deep analysis from AnalystAgent
     * Provides comprehensive video intelligence including hook analysis,
     * scene detection, transformation detection, and pattern matching
     */
    titanAnalysis?: TitanVideoAnalysis;
    /**
     * TITAN 8-engine ensemble prediction from OracleAgent
     * Provides ROAS prediction with confidence intervals
     */
    titanPrediction?: TitanPrediction;
    error?: string;
    progress?: number; // For per-file progress tracking
    loadingMessage?: string; // For per-file status messages
}

// ==========================================
// TITAN Types
// ==========================================

export interface TitanVideoAnalysis {
  video_id: string;
  hook: {
    hook_type: string;
    hook_text?: string;
    effectiveness_score: number;
    reasoning: string;
  };
  scenes: Array<{
    timestamp: string;
    description: string;
    energy_level: string;
  }>;
  overall_energy: string;
  pacing: string;
  transformation?: {
    before_state: string;
    after_state: string;
    transformation_type: string;
    believability_score: number;
  };
  emotional_triggers: string[];
  visual_elements: string[];
  has_voiceover: boolean;
  has_music: boolean;
  transcription?: string;
  key_phrases: string[];
  cta_type?: string;
  cta_strength: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  similar_to_winning_patterns: string[];
}

export interface TitanPrediction {
  video_id: string;
  final_score: number;
  roas_prediction: {
    predicted_roas: number;
    confidence_lower: number;
    confidence_upper: number;
    confidence_level: 'low' | 'medium' | 'high';
  };
  engine_predictions: Array<{
    engine_name: string;
    score: number;
    confidence: number;
    reasoning: string;
  }>;
  hook_score: number;
  cta_score: number;
  engagement_score: number;
  conversion_score: number;
  overall_confidence: number;
  reasoning: string;
  compared_to_avg: number;
  recommendations: string[];
}

export interface TitanBlueprint {
  id: string;
  title: string;
  hook_text: string;
  hook_type: string;
  scenes: Array<{
    scene_number: number;
    duration_seconds: number;
    visual_description: string;
    audio_description: string;
    text_overlay?: string;
    transition?: string;
  }>;
  cta_text: string;
  cta_type: string;
  caption: string;
  hashtags: string[];
  target_avatar: string;
  emotional_triggers: string[];
  predicted_roas?: number;
  confidence_score?: number;
  rank?: number;
}

export interface TitanKnowledgePattern {
  id: string;
  pattern_type: 'hook' | 'trigger' | 'structure' | 'cta' | 'transformation';
  pattern_value: string;
  performance_data: {
    avg_roas?: number;
    effectiveness?: number;
    best_platform?: string;
    usage_frequency?: number;
  };
  source: 'historical' | 'campaign' | 'manual';
}

// ==========================================
// Original Types (continued)
// ==========================================

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
    veoHookSuggestion?: string;
    audioAnalysis?: AudioAnalysisResult;
    hooks?: string[];
    angles?: string[];
    risks?: string[];
    sentiments?: string[];
    keyMoments?: Array<{ t: number; note: string }>;
}

export interface CampaignStrategy {
    primaryVideoFileName: string;
    bRollFileNames: string[];
    strategyJustification: string;
    videoAnalyses: VideoAnalysisResult[];
    summary?: string;
    keyAngles?: string[];
    risksToAvoid?: string[];
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
  | { type: 'color'; brightness: number; contrast: number; saturation: number; }
  | { type: 'volume'; level: number; }
  | { type: 'fade'; typeIn: boolean; typeOut: boolean; duration: number; }
  | { type: 'crop'; ratio: '16:9' | '9:16' | '1:1' | '4:5'; }
  | { type: 'subtitles'; text: string; } // Simplified for now
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
    platform: 'reels'|'shorts'|'tiktok'|'feed'|'stories';
    serviceName?: string;
    idealClient?: string;
    coreBenefits?: string;
    uniqueSellingPoint?: string;
    painPoints?: string;
    emotionalResponse?: string;
    goals?: string[];
    complianceRules?: string[];
}

export interface Avatar {
    key: string;
    name: string;
    description?: string;
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