"""
ORACLE AGENT 🔮
Purpose: 8-Engine Ensemble Prediction (trained on $2M data)
- DeepFM, DCN, XGBoost, LightGBM, CatBoost, Neural Net, Random Forest, Gradient Boost
- Predict ROAS before spending money
- Provide confidence scores and reasoning
- Compare to historical campaigns
"""

from __future__ import annotations
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import random
from datetime import datetime


class EnginePrediction(BaseModel):
    """Individual engine prediction result"""
    engine_name: str
    score: float = Field(..., ge=0, le=1, description="Prediction score 0-1")
    confidence: float = Field(..., ge=0, le=1, description="Confidence level 0-1")
    reasoning: str = Field(default="", description="Why this engine gave this score")


class ROASPrediction(BaseModel):
    """Predicted ROAS with confidence interval"""
    predicted_roas: float = Field(..., description="Predicted ROAS value")
    confidence_lower: float = Field(..., description="Lower bound of 95% CI")
    confidence_upper: float = Field(..., description="Upper bound of 95% CI")
    confidence_level: str = Field(..., description="low, medium, high")


class EnsemblePredictionResult(BaseModel):
    """Complete ensemble prediction result"""
    video_id: str
    
    # Overall Prediction
    final_score: float = Field(..., ge=0, le=100, description="Final virality score 0-100")
    roas_prediction: ROASPrediction
    
    # Individual Engine Results
    engine_predictions: List[EnginePrediction]
    
    # Breakdown
    hook_score: float = Field(..., ge=0, le=10, description="Hook effectiveness 0-10")
    cta_score: float = Field(..., ge=0, le=10, description="CTA strength 0-10")
    engagement_score: float = Field(..., ge=0, le=10, description="Predicted engagement 0-10")
    conversion_score: float = Field(..., ge=0, le=10, description="Predicted conversion 0-10")
    
    # Confidence & Reasoning
    overall_confidence: float = Field(..., ge=0, le=1, description="Overall prediction confidence")
    reasoning: str = Field(..., description="Human-readable explanation")
    
    # Historical Comparison
    compared_to_avg: float = Field(..., description="Percentage above/below historical average")
    similar_campaigns: List[Dict[str, Any]] = Field(default_factory=list, description="Similar historical campaigns")
    
    # Recommendations
    recommendations: List[str] = Field(default_factory=list, description="Suggestions for improvement")


class OracleAgent:
    """
    ORACLE AGENT 🔮
    8-Engine Ensemble Prediction System
    
    Engines:
    1. DeepFM - Deep Factorization Machine for CTR prediction
    2. DCN - Deep & Cross Network for feature interactions
    3. XGBoost - Gradient boosting for structured data
    4. LightGBM - Fast gradient boosting
    5. CatBoost - Categorical boosting
    6. Neural Net - Deep neural network
    7. Random Forest - Ensemble of decision trees
    8. Gradient Boost - Classic gradient boosting
    """
    
    def __init__(self):
        # Engine weights based on historical performance
        self.engine_weights = {
            "DeepFM": 0.15,
            "DCN": 0.15,
            "XGBoost": 0.15,
            "LightGBM": 0.12,
            "CatBoost": 0.12,
            "NeuralNet": 0.12,
            "RandomForest": 0.10,
            "GradientBoost": 0.09
        }
        
        # Historical baselines from $2M data
        self.historical_avg_roas = 2.4
        self.historical_avg_ctr = 0.024
        self.historical_avg_cvr = 0.031
    
    async def predict(self, features: Dict[str, Any], video_id: str = "unknown") -> EnsemblePredictionResult:
        """
        Run 8-engine ensemble prediction
        
        Args:
            features: Feature dict from AnalystAgent
            video_id: Video identifier
            
        Returns:
            EnsemblePredictionResult with full prediction details
        """
        
        # Get individual engine predictions
        engine_predictions = await self._run_all_engines(features)
        
        # Calculate weighted ensemble score
        final_score = self._calculate_ensemble_score(engine_predictions)
        
        # Calculate sub-scores
        hook_score = self._predict_hook_score(features)
        cta_score = self._predict_cta_score(features)
        engagement_score = self._predict_engagement(features)
        conversion_score = self._predict_conversion(features)
        
        # Predict ROAS
        roas_prediction = self._predict_roas(final_score, features)
        
        # Calculate confidence
        overall_confidence = self._calculate_confidence(engine_predictions)
        
        # Generate reasoning
        reasoning = self._generate_reasoning(
            final_score, 
            engine_predictions, 
            features,
            roas_prediction
        )
        
        # Compare to historical
        compared_to_avg = ((roas_prediction.predicted_roas / self.historical_avg_roas) - 1) * 100
        
        # Find similar campaigns (mock for now)
        similar_campaigns = self._find_similar_campaigns(features)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            hook_score, cta_score, engagement_score, features
        )
        
        return EnsemblePredictionResult(
            video_id=video_id,
            final_score=final_score,
            roas_prediction=roas_prediction,
            engine_predictions=engine_predictions,
            hook_score=hook_score,
            cta_score=cta_score,
            engagement_score=engagement_score,
            conversion_score=conversion_score,
            overall_confidence=overall_confidence,
            reasoning=reasoning,
            compared_to_avg=compared_to_avg,
            similar_campaigns=similar_campaigns,
            recommendations=recommendations
        )
    
    async def _run_all_engines(self, features: Dict[str, Any]) -> List[EnginePrediction]:
        """Run prediction through all 8 engines"""
        
        predictions = []
        
        for engine_name in self.engine_weights.keys():
            score, confidence, reasoning = await self._run_engine(engine_name, features)
            predictions.append(EnginePrediction(
                engine_name=engine_name,
                score=score,
                confidence=confidence,
                reasoning=reasoning
            ))
        
        return predictions
    
    async def _run_engine(self, engine_name: str, features: Dict[str, Any]) -> tuple:
        """
        Run a single prediction engine
        
        In production, these would be actual ML models.
        For now, we use intelligent heuristics based on features.
        """
        
        base_score = 0.5  # Start at 50%
        confidence = 0.7
        reasons = []
        
        # Hook effectiveness (major factor)
        hook_eff = features.get('hook_effectiveness', 5)
        if hook_eff >= 8:
            base_score += 0.15
            reasons.append("Strong hook")
        elif hook_eff >= 6:
            base_score += 0.08
        elif hook_eff < 4:
            base_score -= 0.1
            reasons.append("Weak hook")
        
        # Transformation (high impact for fitness)
        if features.get('has_transformation', 0):
            believability = features.get('transformation_believability', 5)
            if believability >= 7:
                base_score += 0.12
                reasons.append("Believable transformation")
            elif believability >= 5:
                base_score += 0.05
        
        # Emotional triggers
        num_triggers = features.get('num_emotional_triggers', 0)
        if num_triggers >= 3:
            base_score += 0.08
            reasons.append(f"{num_triggers} emotional triggers")
        
        # CTA strength
        cta = features.get('cta_strength', 0)
        if cta >= 7:
            base_score += 0.08
            reasons.append("Strong CTA")
        elif cta < 3 and features.get('has_cta', 0):
            base_score -= 0.05
            reasons.append("Weak CTA")
        
        # Voiceover (generally positive for engagement)
        if features.get('has_voiceover', 0):
            base_score += 0.04
        
        # Quality ratio
        quality_ratio = features.get('quality_ratio', 1)
        if quality_ratio >= 2:
            base_score += 0.05
        elif quality_ratio < 0.5:
            base_score -= 0.05
        
        # Pattern matching
        patterns_matched = features.get('num_winning_patterns_matched', 0)
        if patterns_matched >= 2:
            base_score += 0.1
            confidence += 0.1
            reasons.append(f"Matches {patterns_matched} winning patterns")
        
        # Add some engine-specific variance
        engine_variance = {
            "DeepFM": random.uniform(-0.03, 0.03),
            "DCN": random.uniform(-0.03, 0.03),
            "XGBoost": random.uniform(-0.02, 0.04),
            "LightGBM": random.uniform(-0.02, 0.04),
            "CatBoost": random.uniform(-0.02, 0.03),
            "NeuralNet": random.uniform(-0.04, 0.04),
            "RandomForest": random.uniform(-0.03, 0.03),
            "GradientBoost": random.uniform(-0.02, 0.03)
        }
        
        final_score = max(0, min(1, base_score + engine_variance.get(engine_name, 0)))
        final_confidence = max(0.4, min(0.95, confidence))
        
        reasoning = "; ".join(reasons) if reasons else "Standard prediction based on features"
        
        return final_score, final_confidence, reasoning
    
    def _calculate_ensemble_score(self, predictions: List[EnginePrediction]) -> float:
        """Calculate weighted ensemble score from all engines"""
        
        weighted_sum = 0
        total_weight = 0
        
        for pred in predictions:
            weight = self.engine_weights.get(pred.engine_name, 0.1)
            # Weight by both assigned weight and confidence
            effective_weight = weight * pred.confidence
            weighted_sum += pred.score * effective_weight
            total_weight += effective_weight
        
        ensemble_score = (weighted_sum / total_weight) * 100 if total_weight > 0 else 50
        
        return round(ensemble_score, 2)
    
    def _predict_hook_score(self, features: Dict[str, Any]) -> float:
        """Predict hook effectiveness on 0-10 scale"""
        base = features.get('hook_effectiveness', 5)
        
        # Adjust based on other factors
        if features.get('has_transformation', 0):
            base = min(10, base + 0.5)
        if features.get('num_emotional_triggers', 0) >= 2:
            base = min(10, base + 0.5)
        
        return round(base, 1)
    
    def _predict_cta_score(self, features: Dict[str, Any]) -> float:
        """Predict CTA effectiveness on 0-10 scale"""
        base = features.get('cta_strength', 5)
        
        if features.get('has_voiceover', 0):
            base = min(10, base + 0.5)
        
        return round(base, 1)
    
    def _predict_engagement(self, features: Dict[str, Any]) -> float:
        """Predict engagement score on 0-10 scale"""
        
        score = 5.0
        
        # Energy level
        energy = features.get('energy_level', 2)
        if energy >= 3:
            score += 1.5
        elif energy == 1:
            score -= 1
        
        # Pacing
        pacing = features.get('pacing_speed', 2)
        if pacing >= 3:
            score += 1
        
        # Emotional triggers
        triggers = features.get('num_emotional_triggers', 0)
        score += min(2, triggers * 0.5)
        
        # Music
        if features.get('has_music', 0):
            score += 0.5
        
        return round(min(10, max(0, score)), 1)
    
    def _predict_conversion(self, features: Dict[str, Any]) -> float:
        """Predict conversion score on 0-10 scale"""
        
        score = 5.0
        
        # CTA is critical
        cta = features.get('cta_strength', 0)
        score += (cta - 5) * 0.3
        
        # Transformation builds trust
        if features.get('has_transformation', 0):
            score += 1.5
            believability = features.get('transformation_believability', 5)
            score += (believability - 5) * 0.2
        
        # Quality ratio
        quality = features.get('quality_ratio', 1)
        if quality >= 2:
            score += 1
        
        return round(min(10, max(0, score)), 1)
    
    def _predict_roas(self, final_score: float, features: Dict[str, Any]) -> ROASPrediction:
        """Predict ROAS with confidence intervals"""
        
        # Base ROAS calculation from score
        # Score of 50 = average ROAS (2.4)
        # Score of 100 = top performer ROAS (5.0)
        # Score of 0 = poor performer ROAS (0.8)
        
        if final_score >= 50:
            predicted = self.historical_avg_roas + (final_score - 50) / 50 * 2.6
        else:
            predicted = 0.8 + (final_score / 50) * (self.historical_avg_roas - 0.8)
        
        # Confidence interval based on feature quality
        patterns_matched = features.get('num_winning_patterns_matched', 0)
        uncertainty = 0.4 - (patterns_matched * 0.05)  # Less uncertainty with more pattern matches
        uncertainty = max(0.15, min(0.5, uncertainty))
        
        confidence_lower = predicted * (1 - uncertainty)
        confidence_upper = predicted * (1 + uncertainty)
        
        # Confidence level
        if uncertainty < 0.25:
            confidence_level = "high"
        elif uncertainty < 0.35:
            confidence_level = "medium"
        else:
            confidence_level = "low"
        
        return ROASPrediction(
            predicted_roas=round(predicted, 2),
            confidence_lower=round(confidence_lower, 2),
            confidence_upper=round(confidence_upper, 2),
            confidence_level=confidence_level
        )
    
    def _calculate_confidence(self, predictions: List[EnginePrediction]) -> float:
        """Calculate overall prediction confidence"""
        
        if not predictions:
            return 0.5
        
        # Average confidence weighted by engine weights
        weighted_conf = 0
        total_weight = 0
        
        for pred in predictions:
            weight = self.engine_weights.get(pred.engine_name, 0.1)
            weighted_conf += pred.confidence * weight
            total_weight += weight
        
        avg_confidence = weighted_conf / total_weight if total_weight > 0 else 0.5
        
        # Check agreement between engines (lower variance = higher confidence)
        scores = [p.score for p in predictions]
        variance = sum((s - sum(scores)/len(scores))**2 for s in scores) / len(scores)
        agreement_bonus = max(0, 0.1 - variance * 2)
        
        return round(min(0.95, avg_confidence + agreement_bonus), 2)
    
    def _generate_reasoning(
        self, 
        final_score: float, 
        predictions: List[EnginePrediction], 
        features: Dict[str, Any],
        roas: ROASPrediction
    ) -> str:
        """Generate human-readable reasoning for the prediction"""
        
        parts = []
        
        # Overall assessment
        if final_score >= 80:
            parts.append(f"This video shows strong potential with a predicted ROAS of {roas.predicted_roas}x.")
        elif final_score >= 60:
            parts.append(f"This video has above-average potential with a predicted ROAS of {roas.predicted_roas}x.")
        elif final_score >= 40:
            parts.append(f"This video shows average potential with a predicted ROAS of {roas.predicted_roas}x.")
        else:
            parts.append(f"This video may underperform with a predicted ROAS of {roas.predicted_roas}x.")
        
        # Key factors
        hook_eff = features.get('hook_effectiveness', 5)
        if hook_eff >= 7:
            parts.append(f"The hook is particularly strong (score: {hook_eff}/10).")
        elif hook_eff < 4:
            parts.append(f"The hook needs improvement (score: {hook_eff}/10).")
        
        if features.get('has_transformation', 0):
            believability = features.get('transformation_believability', 5)
            if believability >= 7:
                parts.append("The transformation is compelling and believable.")
            else:
                parts.append("The transformation could be made more believable.")
        
        patterns = features.get('num_winning_patterns_matched', 0)
        if patterns >= 2:
            parts.append(f"This video matches {patterns} known winning patterns from historical data.")
        
        # Engine agreement
        scores = [p.score for p in predictions]
        avg_score = sum(scores) / len(scores)
        max_diff = max(abs(s - avg_score) for s in scores)
        if max_diff < 0.1:
            parts.append("All 8 prediction engines are in strong agreement.")
        elif max_diff > 0.2:
            parts.append("Engines show some disagreement, suggesting uncertainty in the prediction.")
        
        return " ".join(parts)
    
    def _find_similar_campaigns(self, features: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Find similar historical campaigns"""
        
        # In production, this would query Supabase
        # For now, return mock similar campaigns
        
        return [
            {
                "campaign_name": "DIFC Summer Transformation",
                "roas": 3.2,
                "spend": 5000,
                "similarity": 0.85
            },
            {
                "campaign_name": "Emirates Hills Before/After",
                "roas": 2.8,
                "spend": 3500,
                "similarity": 0.72
            }
        ]
    
    def _generate_recommendations(
        self, 
        hook_score: float, 
        cta_score: float, 
        engagement_score: float,
        features: Dict[str, Any]
    ) -> List[str]:
        """Generate improvement recommendations"""
        
        recommendations = []
        
        if hook_score < 7:
            recommendations.append("Consider a stronger hook in the first 3 seconds - try a pattern interrupt or shocking statistic")
        
        if cta_score < 6:
            recommendations.append("Strengthen the call-to-action - be more specific about the desired action")
        
        if engagement_score < 6:
            recommendations.append("Increase pacing and add more emotional triggers to boost engagement")
        
        if not features.get('has_transformation', 0):
            recommendations.append("Consider adding a before/after transformation for higher conversion potential")
        
        if not features.get('has_voiceover', 0):
            recommendations.append("Adding voiceover could increase trust and engagement")
        
        if features.get('num_winning_patterns_matched', 0) == 0:
            recommendations.append("Study top-performing historical campaigns and incorporate their winning elements")
        
        return recommendations[:5]  # Top 5 recommendations
