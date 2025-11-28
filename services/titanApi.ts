/**
 * TITAN API Service
 * Connects to all 4 agents in the TITAN backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// ==========================================
// Types
// ==========================================

export interface VideoAnalysis {
  video_id: string;
  filename: string;
  analysis: {
    hook: HookAnalysis;
    scenes: SceneAnalysis[];
    overall_energy: string;
    pacing: string;
    transformation?: TransformationAnalysis;
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
  };
  prediction?: EnsemblePrediction;
  features?: Record<string, number>;
}

export interface HookAnalysis {
  hook_type: string;
  hook_text?: string;
  effectiveness_score: number;
  reasoning: string;
}

export interface SceneAnalysis {
  timestamp: string;
  description: string;
  energy_level: string;
  key_objects: string[];
}

export interface TransformationAnalysis {
  before_state: string;
  after_state: string;
  transformation_type: string;
  believability_score: number;
}

export interface EnsemblePrediction {
  video_id: string;
  final_score: number;
  roas_prediction: {
    predicted_roas: number;
    confidence_lower: number;
    confidence_upper: number;
    confidence_level: string;
  };
  engine_predictions: EnginePrediction[];
  hook_score: number;
  cta_score: number;
  engagement_score: number;
  conversion_score: number;
  overall_confidence: number;
  reasoning: string;
  compared_to_avg: number;
  similar_campaigns: SimilarCampaign[];
  recommendations: string[];
}

export interface EnginePrediction {
  engine_name: string;
  score: number;
  confidence: number;
  reasoning: string;
}

export interface SimilarCampaign {
  campaign_name: string;
  roas: number;
  spend: number;
  similarity: number;
}

export interface AdBlueprint {
  id: string;
  title: string;
  hook_text: string;
  hook_type: string;
  scenes: SceneBlueprint[];
  cta_text: string;
  cta_type: string;
  caption: string;
  hashtags: string[];
  target_avatar: string;
  emotional_triggers: string[];
  predicted_roas?: number;
  confidence_score?: number;
  rank?: number;
  source_video_id?: string;
  based_on_pattern?: string;
}

export interface SceneBlueprint {
  scene_number: number;
  duration_seconds: number;
  visual_description: string;
  audio_description: string;
  text_overlay?: string;
  transition?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  conversation_id: string;
  response: string;
  suggested_actions: string[];
  insights: ProactiveInsight[];
}

export interface ProactiveInsight {
  insight_type: string;
  title: string;
  description: string;
  action?: string;
  priority: string;
  related_video_id?: string;
}

export interface KnowledgePattern {
  id: string;
  pattern_type: string;
  pattern_value: string;
  performance_data: Record<string, any>;
  source: string;
  created_at: string;
}

export interface CutSuggestion {
  duration: number;
  start_time: number;
  end_time: number;
  key_moments: { time: number; type: string; note: string }[];
  reasoning: string;
}

// ==========================================
// API Client
// ==========================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API Error ${response.status}: ${body}`);
  }
  return response.json();
}

export const titanApi = {
  // ==========================================
  // ANALYST Agent - Video Analysis
  // ==========================================
  
  async analyzeVideo(videoUri: string, filename?: string): Promise<VideoAnalysis> {
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        video_uri: videoUri, 
        filename,
        include_prediction: true 
      }),
    });
    return handleResponse<VideoAnalysis>(response);
  },

  async getVideoAnalysis(videoId: string): Promise<VideoAnalysis> {
    const response = await fetch(`${API_BASE_URL}/api/analyze/${videoId}`);
    return handleResponse<VideoAnalysis>(response);
  },

  async getRecentAnalyses(limit: number = 10): Promise<{ analyses: VideoAnalysis[] }> {
    const response = await fetch(`${API_BASE_URL}/api/analyze/recent?limit=${limit}`);
    return handleResponse(response);
  },

  async compareToHistorical(videoId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/analyze/compare/${videoId}`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  // ==========================================
  // ORACLE Agent - Prediction
  // ==========================================

  async predict(features: Record<string, any>, videoId?: string): Promise<EnsemblePrediction> {
    const response = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features, video_id: videoId }),
    });
    return handleResponse<EnsemblePrediction>(response);
  },

  async explainPrediction(videoId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/predict/explain/${videoId}`);
    return handleResponse(response);
  },

  async getEngineInfo(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/predict/engines`);
    return handleResponse(response);
  },

  // ==========================================
  // DIRECTOR Agent - Blueprint Generation
  // ==========================================

  async generateBlueprints(params: {
    productName: string;
    offer: string;
    targetAvatar: string;
    targetPainPoints?: string[];
    targetDesires?: string[];
    platform?: string;
    tone?: string;
    durationSeconds?: number;
    numVariations?: number;
    sourceVideoId?: string;
  }): Promise<{ generated: number; blueprints: AdBlueprint[] }> {
    const response = await fetch(`${API_BASE_URL}/api/generate/blueprints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_name: params.productName,
        offer: params.offer,
        target_avatar: params.targetAvatar,
        target_pain_points: params.targetPainPoints || [],
        target_desires: params.targetDesires || [],
        platform: params.platform || 'reels',
        tone: params.tone || 'direct',
        duration_seconds: params.durationSeconds || 30,
        num_variations: params.numVariations || 10,
        source_video_id: params.sourceVideoId,
      }),
    });
    return handleResponse(response);
  },

  async generateHooks(baseHook: string, targetAvatar: string, numVariations: number = 50): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/generate/hooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base_hook: baseHook,
        target_avatar: targetAvatar,
        num_variations: numVariations,
      }),
    });
    return handleResponse(response);
  },

  async generateCuts(videoId: string, targetDurations: number[] = [15, 30, 60]): Promise<{ suggestions: CutSuggestion[] }> {
    const response = await fetch(`${API_BASE_URL}/api/generate/cuts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: videoId,
        target_durations: targetDurations,
      }),
    });
    return handleResponse(response);
  },

  async getVideoBlueprints(videoId: string): Promise<{ blueprints: AdBlueprint[] }> {
    const response = await fetch(`${API_BASE_URL}/api/generate/blueprints/${videoId}`);
    return handleResponse(response);
  },

  async getTopBlueprints(limit: number = 10): Promise<{ blueprints: AdBlueprint[] }> {
    const response = await fetch(`${API_BASE_URL}/api/generate/blueprints/top?limit=${limit}`);
    return handleResponse(response);
  },

  // ==========================================
  // CHAT Agent - Conversational AI
  // ==========================================

  async chat(message: string, conversationId?: string, videoId?: string, context?: any): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        video_id: videoId,
        context,
      }),
    });
    return handleResponse<ChatResponse>(response);
  },

  async getChatHistory(conversationId: string, limit: number = 50): Promise<{ messages: ChatMessage[] }> {
    const response = await fetch(`${API_BASE_URL}/api/chat/history/${conversationId}?limit=${limit}`);
    return handleResponse(response);
  },

  async getVideoConversations(videoId: string): Promise<{ conversations: any[] }> {
    const response = await fetch(`${API_BASE_URL}/api/chat/video/${videoId}`);
    return handleResponse(response);
  },

  async getProactiveInsights(userId: string = 'default'): Promise<{ insights: ProactiveInsight[] }> {
    const response = await fetch(`${API_BASE_URL}/api/chat/proactive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, include_historical: true }),
    });
    return handleResponse(response);
  },

  async getChatSummary(conversationId: string): Promise<{ summary: string }> {
    const response = await fetch(`${API_BASE_URL}/api/chat/summary/${conversationId}`);
    return handleResponse(response);
  },

  // ==========================================
  // KNOWLEDGE Base
  // ==========================================

  async getWinningPatterns(patternType?: string, limit: number = 50): Promise<{ patterns: KnowledgePattern[] }> {
    const url = patternType 
      ? `${API_BASE_URL}/api/knowledge/patterns?pattern_type=${patternType}&limit=${limit}`
      : `${API_BASE_URL}/api/knowledge/patterns?limit=${limit}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  async getWinningHooks(limit: number = 20): Promise<{ hooks: KnowledgePattern[] }> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/hooks?limit=${limit}`);
    return handleResponse(response);
  },

  async getEmotionalTriggers(limit: number = 20): Promise<{ triggers: KnowledgePattern[] }> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/triggers?limit=${limit}`);
    return handleResponse(response);
  },

  async getAdStructures(limit: number = 10): Promise<{ structures: KnowledgePattern[] }> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/structures?limit=${limit}`);
    return handleResponse(response);
  },

  async getCTAPatterns(limit: number = 20): Promise<{ ctas: KnowledgePattern[] }> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/ctas?limit=${limit}`);
    return handleResponse(response);
  },

  async addCustomInsight(patternType: string, patternValue: string, notes?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pattern_type: patternType,
        pattern_value: patternValue,
        notes: notes || '',
      }),
    });
    return handleResponse(response);
  },

  async compareToKnowledge(videoId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/compare/${videoId}`);
    return handleResponse(response);
  },

  async getRecommendations(videoId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/recommendations/${videoId}`);
    return handleResponse(response);
  },

  async getHistoricalInsights(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/historical`);
    return handleResponse(response);
  },

  async getTopPerformers(limit: number = 10): Promise<{ campaigns: any[] }> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/top-performers?limit=${limit}`);
    return handleResponse(response);
  },

  async getKnowledgeStats(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/stats`);
    return handleResponse(response);
  },

  // ==========================================
  // System
  // ==========================================

  async getSystemInfo(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/`);
    return handleResponse(response);
  },

  async healthCheck(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  },
};

export default titanApi;
