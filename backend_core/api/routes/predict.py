"""
Prediction Routes
POST /api/predict - Get 8-engine ensemble prediction
GET /api/predict/explain/{video_id} - Get detailed reasoning
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uuid

from ...agents.oracle_agent import OracleAgent, EnsemblePredictionResult
from ...memory.supabase_client import titan_db

router = APIRouter(prefix="/api", tags=["prediction"])

# Initialize Oracle
try:
    oracle = OracleAgent()
except Exception as e:
    print(f"⚠️ OracleAgent init failed: {e}")
    oracle = None


class PredictRequest(BaseModel):
    features: Dict[str, Any]
    video_id: Optional[str] = None


class PredictResponse(BaseModel):
    video_id: str
    final_score: float
    predicted_roas: float
    confidence_level: str
    hook_score: float
    cta_score: float
    engagement_score: float
    conversion_score: float
    compared_to_avg: float
    engine_breakdown: Dict[str, float]
    reasoning: str
    recommendations: List[str]


@router.post("/predict", response_model=PredictResponse)
async def predict_performance(request: PredictRequest):
    """
    Run 8-engine ensemble prediction
    
    Takes extracted features and returns:
    - Final virality score (0-100)
    - Predicted ROAS with confidence
    - Individual engine scores
    - Recommendations for improvement
    """
    
    if not oracle:
        raise HTTPException(status_code=503, detail="OracleAgent not initialized")
    
    video_id = request.video_id or str(uuid.uuid4())
    
    try:
        print(f"🔮 Running prediction for features: {len(request.features)} attributes")
        
        result = await oracle.predict(request.features, video_id)
        
        # Extract engine breakdown
        engine_breakdown = {
            pred.engine_name: pred.score 
            for pred in result.engine_predictions
        }
        
        return PredictResponse(
            video_id=video_id,
            final_score=result.final_score,
            predicted_roas=result.roas_prediction.predicted_roas,
            confidence_level=result.roas_prediction.confidence_level,
            hook_score=result.hook_score,
            cta_score=result.cta_score,
            engagement_score=result.engagement_score,
            conversion_score=result.conversion_score,
            compared_to_avg=result.compared_to_avg,
            engine_breakdown=engine_breakdown,
            reasoning=result.reasoning,
            recommendations=result.recommendations
        )
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict/explain/{video_id}")
async def explain_prediction(video_id: str):
    """
    Get detailed explanation for a prediction
    
    Returns full breakdown of how prediction was made
    """
    
    # Get stored prediction
    video_data = await titan_db.get_video_analysis(video_id)
    
    if not video_data:
        raise HTTPException(status_code=404, detail="Video analysis not found")
    
    prediction = video_data.get("prediction")
    analysis = video_data.get("analysis")
    
    if not prediction:
        raise HTTPException(status_code=404, detail="No prediction found for this video")
    
    # Build detailed explanation
    explanation = {
        "video_id": video_id,
        "filename": video_data.get("filename"),
        "prediction_summary": {
            "final_score": prediction.get("final_score"),
            "predicted_roas": prediction.get("roas_prediction", {}).get("predicted_roas"),
            "confidence": prediction.get("roas_prediction", {}).get("confidence_level")
        },
        "engine_breakdown": prediction.get("engine_predictions", []),
        "feature_analysis": {
            "hook_analysis": {
                "score": prediction.get("hook_score"),
                "details": analysis.get("hook") if analysis else None
            },
            "cta_analysis": {
                "score": prediction.get("cta_score"),
                "type": analysis.get("cta_type") if analysis else None
            },
            "engagement_factors": {
                "score": prediction.get("engagement_score"),
                "emotional_triggers": analysis.get("emotional_triggers") if analysis else []
            },
            "conversion_factors": {
                "score": prediction.get("conversion_score"),
                "transformation": analysis.get("transformation") if analysis else None
            }
        },
        "reasoning": prediction.get("reasoning"),
        "recommendations": prediction.get("recommendations", []),
        "similar_campaigns": prediction.get("similar_campaigns", []),
        "compared_to_avg": prediction.get("compared_to_avg")
    }
    
    return explanation


@router.get("/predict/engines")
async def get_engine_info():
    """
    Get information about the 8 prediction engines
    """
    
    if not oracle:
        return {"error": "OracleAgent not initialized"}
    
    return {
        "engines": [
            {
                "name": "DeepFM",
                "description": "Deep Factorization Machine for CTR prediction",
                "weight": oracle.engine_weights.get("DeepFM", 0),
                "type": "deep_learning"
            },
            {
                "name": "DCN",
                "description": "Deep & Cross Network for feature interactions",
                "weight": oracle.engine_weights.get("DCN", 0),
                "type": "deep_learning"
            },
            {
                "name": "XGBoost",
                "description": "Gradient boosting for structured data",
                "weight": oracle.engine_weights.get("XGBoost", 0),
                "type": "gradient_boosting"
            },
            {
                "name": "LightGBM",
                "description": "Fast gradient boosting",
                "weight": oracle.engine_weights.get("LightGBM", 0),
                "type": "gradient_boosting"
            },
            {
                "name": "CatBoost",
                "description": "Categorical boosting",
                "weight": oracle.engine_weights.get("CatBoost", 0),
                "type": "gradient_boosting"
            },
            {
                "name": "NeuralNet",
                "description": "Deep neural network",
                "weight": oracle.engine_weights.get("NeuralNet", 0),
                "type": "deep_learning"
            },
            {
                "name": "RandomForest",
                "description": "Ensemble of decision trees",
                "weight": oracle.engine_weights.get("RandomForest", 0),
                "type": "ensemble"
            },
            {
                "name": "GradientBoost",
                "description": "Classic gradient boosting",
                "weight": oracle.engine_weights.get("GradientBoost", 0),
                "type": "gradient_boosting"
            }
        ],
        "historical_baselines": {
            "avg_roas": oracle.historical_avg_roas,
            "avg_ctr": oracle.historical_avg_ctr,
            "avg_cvr": oracle.historical_avg_cvr
        }
    }


@router.post("/predict/batch")
async def predict_batch(requests: List[PredictRequest]):
    """
    Run predictions for multiple videos
    """
    
    if not oracle:
        raise HTTPException(status_code=503, detail="OracleAgent not initialized")
    
    results = []
    
    for req in requests:
        try:
            result = await predict_performance(req)
            results.append({"success": True, "result": result})
        except Exception as e:
            results.append({
                "success": False, 
                "video_id": req.video_id,
                "error": str(e)
            })
    
    return {
        "total": len(requests),
        "successful": sum(1 for r in results if r.get("success")),
        "results": results
    }
