/**
 * PredictionPanel Component
 * Displays 8-engine ensemble prediction results
 */

import React from 'react';
import { predictionService, PredictionDisplayData } from '../services/predictionService';

interface PredictionPanelProps {
  prediction: PredictionDisplayData;
  compact?: boolean;
}

const ScoreBar: React.FC<{ score: number; label: string; max?: number }> = ({ score, label, max = 10 }) => {
  const percentage = (score / max) * 100;
  const color = percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold">{score.toFixed(1)}/{max}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

const EngineCard: React.FC<{ engine: PredictionDisplayData['engines'][0] }> = ({ engine }) => (
  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
    <div className="flex items-center justify-between mb-2">
      <span className="font-medium text-sm" style={{ color: engine.color }}>{engine.name}</span>
      <span className="text-xs text-gray-500">{predictionService.getEngineTypeLabel(engine.type)}</span>
    </div>
    <div className="flex items-end justify-between">
      <div className="text-2xl font-bold">{engine.score}%</div>
      <div className="text-xs text-gray-400">
        {engine.confidence}% conf.
      </div>
    </div>
    <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-500" 
        style={{ width: `${engine.score}%`, backgroundColor: engine.color }} 
      />
    </div>
  </div>
);

export const PredictionPanel: React.FC<PredictionPanelProps> = ({ prediction, compact = false }) => {
  const summary = predictionService.getSummary({ final_score: prediction.finalScore } as any);
  
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-indigo-900/30 to-purple-900/30">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            🔮 Oracle Prediction
            <span className={`text-xs px-2 py-0.5 rounded-full ${predictionService.getConfidenceColor(prediction.confidenceLevel)}`}>
              {prediction.confidenceLevel.toUpperCase()} CONFIDENCE
            </span>
          </h3>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-400">{prediction.finalScore}</div>
            <div className="text-xs text-gray-400">Virality Score</div>
          </div>
        </div>
      </div>

      {/* Main Scores */}
      <div className="p-4 grid grid-cols-2 gap-4 border-b border-gray-700/50">
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-400 mb-1">Predicted ROAS</div>
          <div className="text-3xl font-bold text-green-400">
            {predictionService.formatRoas(prediction.predictedRoas)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Range: {prediction.confidenceRange.lower.toFixed(2)}x - {prediction.confidenceRange.upper.toFixed(2)}x
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-400 mb-1">vs Historical Avg</div>
          <div className={`text-3xl font-bold ${prediction.comparedToAvg >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {prediction.comparedToAvg >= 0 ? '+' : ''}{prediction.comparedToAvg.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {prediction.comparedToAvgLabel}
          </div>
        </div>
      </div>

      {/* Sub-Scores */}
      <div className="p-4 border-b border-gray-700/50">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Performance Breakdown</h4>
        <div className="grid grid-cols-2 gap-4">
          <ScoreBar score={prediction.hookScore} label="Hook Effectiveness" />
          <ScoreBar score={prediction.ctaScore} label="CTA Strength" />
          <ScoreBar score={prediction.engagementScore} label="Engagement Potential" />
          <ScoreBar score={prediction.conversionScore} label="Conversion Likelihood" />
        </div>
      </div>

      {!compact && (
        <>
          {/* Engine Breakdown */}
          <div className="p-4 border-b border-gray-700/50">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">8-Engine Ensemble</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {prediction.engines.map(engine => (
                <EngineCard key={engine.name} engine={engine} />
              ))}
            </div>
          </div>

          {/* Reasoning */}
          <div className="p-4 border-b border-gray-700/50">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">AI Reasoning</h4>
            <p className="text-sm text-gray-300">{prediction.reasoning}</p>
          </div>

          {/* Recommendations */}
          {prediction.recommendations.length > 0 && (
            <div className="p-4 border-b border-gray-700/50">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Recommendations</h4>
              <ul className="space-y-2">
                {prediction.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-yellow-400 mt-0.5">💡</span>
                    <span className="text-gray-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Similar Campaigns */}
          {prediction.similarCampaigns.length > 0 && (
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Similar Top Campaigns</h4>
              <div className="space-y-2">
                {prediction.similarCampaigns.map((campaign, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-800/30 rounded-lg p-2">
                    <span className="text-sm">{campaign.name}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-green-400">{campaign.roas.toFixed(2)}x ROAS</span>
                      <span className="text-gray-500">{campaign.similarity}% similar</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary Badge */}
      <div className="p-4 bg-gray-800/30">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{summary.icon}</span>
          <div>
            <div className="font-semibold capitalize">{summary.status} Potential</div>
            <div className="text-sm text-gray-400">{summary.message}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionPanel;
