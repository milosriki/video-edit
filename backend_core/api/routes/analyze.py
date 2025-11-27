"""
Analysis Routes
POST /api/analyze - Analyze video, return features + prediction
POST /api/analyze/batch - Analyze multiple videos
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid

from ...agents.analyst_agent import AnalystAgent, VideoDeepAnalysis
from ...agents.oracle_agent import OracleAgent, EnsemblePredictionResult
from ...memory.supabase_client import titan_db

router = APIRouter(prefix="/api", tags=["analysis"])

# Initialize agents
try:
    analyst = AnalystAgent()
except Exception as e:
    print(f"⚠️ AnalystAgent init failed: {e}")
    analyst = None

try:
    oracle = OracleAgent()
except Exception as e:
    print(f"⚠️ OracleAgent init failed: {e}")
    oracle = None


class AnalyzeRequest(BaseModel):
    video_uri: str
    filename: Optional[str] = None
    include_prediction: bool = True


class BatchAnalyzeRequest(BaseModel):
    videos: List[AnalyzeRequest]


class AnalysisResponse(BaseModel):
    video_id: str
    filename: str
    analysis: Dict[str, Any]
    prediction: Optional[Dict[str, Any]] = None
    features: Optional[Dict[str, Any]] = None
    status: str = "analyzed"


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_video(request: AnalyzeRequest):
    """
    Analyze a video and optionally predict performance
    
    - Extracts frames, transcription, scenes
    - Identifies hooks and emotional triggers
    - Optionally runs 8-engine prediction
    """
    
    if not analyst:
        raise HTTPException(status_code=503, detail="AnalystAgent not initialized")
    
    video_id = str(uuid.uuid4())
    filename = request.filename or request.video_uri.split('/')[-1]
    
    try:
        # Get historical patterns for comparison
        top_performers = await titan_db.get_top_performers(limit=5)
        
        # Run deep analysis
        print(f"🔬 Analyzing video: {filename}")
        analysis = analyst.analyze_video(
            request.video_uri, 
            historical_patterns=top_performers
        )
        
        # Extract features for prediction
        features = analyst.extract_features_for_prediction(analysis)
        
        # Run prediction if requested
        prediction = None
        if request.include_prediction and oracle:
            print(f"🔮 Running prediction for: {filename}")
            prediction_result = await oracle.predict(features, video_id)
            prediction = prediction_result.model_dump()
        
        # Save to database
        analysis_dict = analysis.model_dump()
        await titan_db.save_video_analysis(
            video_id=video_id,
            filename=filename,
            analysis=analysis_dict,
            prediction=prediction
        )
        
        return AnalysisResponse(
            video_id=video_id,
            filename=filename,
            analysis=analysis_dict,
            prediction=prediction,
            features=features,
            status="analyzed"
        )
        
    except Exception as e:
        print(f"❌ Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/batch")
async def analyze_batch(request: BatchAnalyzeRequest):
    """
    Analyze multiple videos
    
    Returns results for all videos with analysis and predictions
    """
    
    if not analyst:
        raise HTTPException(status_code=503, detail="AnalystAgent not initialized")
    
    results = []
    errors = []
    
    for video_req in request.videos:
        try:
            result = await analyze_video(video_req)
            results.append(result)
        except Exception as e:
            errors.append({
                "video_uri": video_req.video_uri,
                "error": str(e)
            })
    
    return {
        "analyzed": len(results),
        "errors": len(errors),
        "results": results,
        "error_details": errors
    }


@router.get("/analyze/{video_id}")
async def get_analysis(video_id: str):
    """
    Get existing analysis for a video
    """
    
    analysis = await titan_db.get_video_analysis(video_id)
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Video analysis not found")
    
    return analysis


@router.get("/analyze/recent")
async def get_recent_analyses(limit: int = 10):
    """
    Get recent video analyses
    """
    
    analyses = await titan_db.get_recent_analyses(limit=limit)
    return {"analyses": analyses}


@router.post("/analyze/compare/{video_id}")
async def compare_to_historical(video_id: str):
    """
    Compare a video's analysis to historical top performers
    """
    
    # Get the video analysis
    video_data = await titan_db.get_video_analysis(video_id)
    
    if not video_data:
        raise HTTPException(status_code=404, detail="Video analysis not found")
    
    # Get top performers
    top_performers = await titan_db.get_top_performers(limit=10)
    
    analysis = video_data.get("analysis", {})
    
    if analyst:
        # Use analyst to compare
        comparison = analyst.compare_to_historical(
            VideoDeepAnalysis(**analysis) if isinstance(analysis, dict) else analysis,
            top_performers
        )
        return comparison
    
    # Basic comparison without analyst
    return {
        "video_id": video_id,
        "top_performers": top_performers,
        "note": "Full comparison requires AnalystAgent"
    }
