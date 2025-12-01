/**
 * Prediction Service
 * Handles 8-engine ensemble prediction calls and visualization
 */

import { titanApi, EnsemblePrediction, EnginePrediction } from './titanApi';

export interface PredictionDisplayData {
  // Main scores
  finalScore: number;
  predictedRoas: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  confidenceRange: { lower: number; upper: number };
  
  // Sub-scores
  hookScore: number;
  ctaScore: number;
  engagementScore: number;
  conversionScore: number;
  
  // Comparison
  comparedToAvg: number;
  comparedToAvgLabel: string;
  
  // Engine breakdown
  engines: EngineDisplayData[];
  
  // Insights
  reasoning: string;
  recommendations: string[];
  similarCampaigns: { name: string; roas: number; similarity: number }[];
}

export interface EngineDisplayData {
  name: string;
  score: number;
  confidence: number;
  type: 'deep_learning' | 'gradient_boosting' | 'ensemble';
  color: string;
}

const ENGINE_COLORS: Record<string, string> = {
  DeepFM: '#6366f1',      // Indigo
  DCN: '#8b5cf6',         // Purple
  XGBoost: '#10b981',     // Emerald
  LightGBM: '#14b8a6',    // Teal
  CatBoost: '#f59e0b',    // Amber
  NeuralNet: '#ec4899',   // Pink
  RandomForest: '#3b82f6', // Blue
  GradientBoost: '#84cc16', // Lime
};

const ENGINE_TYPES: Record<string, 'deep_learning' | 'gradient_boosting' | 'ensemble'> = {
  DeepFM: 'deep_learning',
  DCN: 'deep_learning',
  XGBoost: 'gradient_boosting',
  LightGBM: 'gradient_boosting',
  CatBoost: 'gradient_boosting',
  NeuralNet: 'deep_learning',
  RandomForest: 'ensemble',
  GradientBoost: 'gradient_boosting',
};

export const predictionService = {
  /**
   * Transform raw prediction data for display
   */
  transformForDisplay(prediction: EnsemblePrediction): PredictionDisplayData {
    const engines: EngineDisplayData[] = prediction.engine_predictions.map(ep => ({
      name: ep.engine_name,
      score: Math.round(ep.score * 100),
      confidence: Math.round(ep.confidence * 100),
      type: ENGINE_TYPES[ep.engine_name] || 'ensemble',
      color: ENGINE_COLORS[ep.engine_name] || '#6b7280',
    }));

    const comparedToAvg = prediction.compared_to_avg;
    const comparedToAvgLabel = comparedToAvg >= 0
      ? `${Math.abs(comparedToAvg).toFixed(1)}% above average`
      : `${Math.abs(comparedToAvg).toFixed(1)}% below average`;

    return {
      finalScore: Math.round(prediction.final_score),
      predictedRoas: prediction.roas_prediction.predicted_roas,
      confidenceLevel: prediction.roas_prediction.confidence_level as 'low' | 'medium' | 'high',
      confidenceRange: {
        lower: prediction.roas_prediction.confidence_lower,
        upper: prediction.roas_prediction.confidence_upper,
      },
      hookScore: prediction.hook_score,
      ctaScore: prediction.cta_score,
      engagementScore: prediction.engagement_score,
      conversionScore: prediction.conversion_score,
      comparedToAvg,
      comparedToAvgLabel,
      engines,
      reasoning: prediction.reasoning,
      recommendations: prediction.recommendations,
      similarCampaigns: prediction.similar_campaigns.map(c => ({
        name: c.campaign_name,
        roas: c.roas,
        similarity: Math.round(c.similarity * 100),
      })),
    };
  },

  /**
   * Get score color based on value
   */
  getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  },

  /**
   * Get score background color based on value
   */
  getScoreBgColor(score: number): string {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  },

  /**
   * Get confidence badge color
   */
  getConfidenceColor(level: string): string {
    switch (level) {
      case 'high': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  },

  /**
   * Format ROAS for display
   */
  formatRoas(roas: number): string {
    return `${roas.toFixed(2)}x`;
  },

  /**
   * Get engine type label
   */
  getEngineTypeLabel(type: string): string {
    switch (type) {
      case 'deep_learning': return 'Deep Learning';
      case 'gradient_boosting': return 'Gradient Boosting';
      case 'ensemble': return 'Ensemble';
      default: return type;
    }
  },

  /**
   * Calculate feature importance from prediction
   */
  calculateFeatureImportance(prediction: EnsemblePrediction): { feature: string; importance: number }[] {
    const features = [
      { feature: 'Hook', importance: prediction.hook_score / 10 },
      { feature: 'CTA', importance: prediction.cta_score / 10 },
      { feature: 'Engagement', importance: prediction.engagement_score / 10 },
      { feature: 'Conversion', importance: prediction.conversion_score / 10 },
    ];

    return features.sort((a, b) => b.importance - a.importance);
  },

  /**
   * Get prediction summary for quick display
   */
  getSummary(prediction: EnsemblePrediction): {
    status: 'excellent' | 'good' | 'average' | 'poor';
    icon: string;
    message: string;
  } {
    const score = prediction.final_score;

    if (score >= 80) {
      return {
        status: 'excellent',
        icon: '🚀',
        message: 'High potential ad with strong predicted performance',
      };
    }
    if (score >= 60) {
      return {
        status: 'good',
        icon: '✅',
        message: 'Good potential with room for optimization',
      };
    }
    if (score >= 40) {
      return {
        status: 'average',
        icon: '⚠️',
        message: 'Average performance expected, consider improvements',
      };
    }
    return {
      status: 'poor',
      icon: '❌',
      message: 'Low predicted performance, significant changes recommended',
    };
  },

  /**
   * Run prediction from features
   */
  async predict(features: Record<string, any>, videoId?: string): Promise<PredictionDisplayData> {
    const prediction = await titanApi.predict(features, videoId);
    return this.transformForDisplay(prediction);
  },

  /**
   * Get engine information
   */
  async getEngineInfo(): Promise<{
    engines: { name: string; description: string; weight: number; type: string }[];
    baselines: { avg_roas: number; avg_ctr: number; avg_cvr: number };
  }> {
    const info = await titanApi.getEngineInfo();
    return {
      engines: info.engines,
      baselines: info.historical_baselines,
    };
  },
};

export default predictionService;
