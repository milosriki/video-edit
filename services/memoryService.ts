/**
 * Memory Service
 * Handles Supabase integration for persistent memory
 */

import { supabase } from './supabaseClient';

export interface HistoricalCampaign {
  id: string;
  campaign_name: string;
  spend: number;
  revenue: number;
  roas: number;
  ctr: number;
  cvr: number;
  hook_text?: string;
  hook_type?: string;
  cta_text?: string;
  emotional_triggers?: string[];
  target_avatar?: string;
  platform?: string;
  features?: Record<string, any>;
  created_at: string;
}

export interface AnalyzedVideo {
  id: string;
  filename: string;
  analysis: any;
  prediction?: any;
  features?: Record<string, any>;
  status: string;
  created_at: string;
}

export interface ChatMemory {
  id: string;
  video_id?: string;
  messages: any[];
  context: any;
  user_preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const memoryService = {
  // ==========================================
  // Historical Campaigns
  // ==========================================
  
  async getHistoricalCampaigns(limit: number = 100): Promise<HistoricalCampaign[]> {
    const { data, error } = await supabase
      .from('historical_campaigns')
      .select('*')
      .order('roas', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
    
    return data || [];
  },

  async getTopPerformers(limit: number = 10): Promise<HistoricalCampaign[]> {
    const { data, error } = await supabase
      .from('historical_campaigns')
      .select('*')
      .gte('roas', 2.0)
      .order('roas', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching top performers:', error);
      return [];
    }
    
    return data || [];
  },

  // ==========================================
  // Analyzed Videos
  // ==========================================

  async getAnalyzedVideos(limit: number = 20): Promise<AnalyzedVideo[]> {
    const { data, error } = await supabase
      .from('analyzed_videos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching analyzed videos:', error);
      return [];
    }
    
    return data || [];
  },

  async getVideoAnalysis(videoId: string): Promise<AnalyzedVideo | null> {
    const { data, error } = await supabase
      .from('analyzed_videos')
      .select('*')
      .eq('id', videoId)
      .single();
    
    if (error) {
      console.error('Error fetching video analysis:', error);
      return null;
    }
    
    return data;
  },

  async saveVideoAnalysis(
    videoId: string,
    filename: string,
    analysis: any,
    prediction?: any,
    features?: Record<string, any>
  ): Promise<boolean> {
    const { error } = await supabase
      .from('analyzed_videos')
      .upsert({
        id: videoId,
        filename,
        analysis,
        prediction,
        features,
        status: 'analyzed',
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error saving video analysis:', error);
      return false;
    }
    
    return true;
  },

  // ==========================================
  // Chat Memory
  // ==========================================

  async getChatHistory(conversationId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('chat_memory')
      .select('messages')
      .eq('id', conversationId)
      .single();
    
    if (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
    
    return data?.messages || [];
  },

  async saveConversation(
    conversationId: string,
    messages: any[],
    videoId?: string,
    context?: any
  ): Promise<boolean> {
    const { error } = await supabase
      .from('chat_memory')
      .upsert({
        id: conversationId,
        video_id: videoId,
        messages,
        context: context || {},
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error saving conversation:', error);
      return false;
    }
    
    return true;
  },

  async getVideoConversations(videoId: string): Promise<ChatMemory[]> {
    const { data, error } = await supabase
      .from('chat_memory')
      .select('*')
      .eq('video_id', videoId)
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching video conversations:', error);
      return [];
    }
    
    return data || [];
  },

  // ==========================================
  // Knowledge Base
  // ==========================================

  async getPatterns(patternType?: string, limit: number = 50): Promise<any[]> {
    let query = supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (patternType) {
      query = query.eq('pattern_type', patternType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching patterns:', error);
      return [];
    }
    
    return data || [];
  },

  async addPattern(
    patternType: string,
    patternValue: string,
    performanceData: Record<string, any>,
    source: string = 'manual'
  ): Promise<boolean> {
    const { error } = await supabase
      .from('knowledge_base')
      .insert({
        pattern_type: patternType,
        pattern_value: patternValue,
        performance_data: performanceData,
        source,
      });
    
    if (error) {
      console.error('Error adding pattern:', error);
      return false;
    }
    
    return true;
  },

  // ==========================================
  // Blueprints
  // ==========================================

  async getBlueprints(videoId?: string, limit: number = 50): Promise<any[]> {
    let query = supabase
      .from('ad_blueprints')
      .select('*')
      .order('rank')
      .limit(limit);
    
    if (videoId) {
      query = query.eq('video_id', videoId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching blueprints:', error);
      return [];
    }
    
    // Parse blueprint JSON
    return (data || []).map(item => {
      if (typeof item.blueprint === 'string') {
        try {
          return { ...JSON.parse(item.blueprint), predicted_roas: item.predicted_roas, rank: item.rank };
        } catch {
          return item;
        }
      }
      return { ...item.blueprint, predicted_roas: item.predicted_roas, rank: item.rank };
    });
  },

  async saveBlueprint(blueprint: any): Promise<boolean> {
    const { error } = await supabase
      .from('ad_blueprints')
      .insert({
        id: blueprint.id,
        video_id: blueprint.source_video_id,
        blueprint,
        predicted_roas: blueprint.predicted_roas,
        confidence_score: blueprint.confidence_score,
        rank: blueprint.rank,
      });
    
    if (error) {
      console.error('Error saving blueprint:', error);
      return false;
    }
    
    return true;
  },

  // ==========================================
  // Stats & Aggregations
  // ==========================================

  async getDashboardStats(): Promise<{
    totalCampaigns: number;
    totalSpend: number;
    totalRevenue: number;
    avgRoas: number;
    analyzedVideos: number;
    generatedBlueprints: number;
  }> {
    const [campaigns, videos, blueprints] = await Promise.all([
      this.getHistoricalCampaigns(1000),
      this.getAnalyzedVideos(1000),
      this.getBlueprints(undefined, 1000),
    ]);

    const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);

    return {
      totalCampaigns: campaigns.length,
      totalSpend,
      totalRevenue,
      avgRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
      analyzedVideos: videos.length,
      generatedBlueprints: blueprints.length,
    };
  },
};

export default memoryService;
