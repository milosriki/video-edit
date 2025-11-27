"""
Knowledge Routes
GET /api/knowledge/patterns - Get winning patterns
POST /api/knowledge/add - Add custom insight
GET /api/knowledge/compare/{video_id} - Compare to historical
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from ...memory.supabase_client import titan_db
from ...memory.knowledge_store import knowledge_store

router = APIRouter(prefix="/api", tags=["knowledge"])


class AddPatternRequest(BaseModel):
    pattern_type: str  # hook, trigger, structure, cta, transformation
    pattern_value: str
    notes: Optional[str] = ""


class AddInsightRequest(BaseModel):
    pattern_type: str
    pattern_value: str
    notes: str = ""


@router.get("/knowledge/patterns")
async def get_winning_patterns(
    pattern_type: Optional[str] = None,
    limit: int = 50
):
    """
    Get winning patterns from the knowledge base
    
    Optionally filter by pattern type:
    - hook: Opening hooks
    - trigger: Emotional triggers
    - structure: Ad structure patterns
    - cta: Call-to-action patterns
    - transformation: Before/after patterns
    """
    
    if pattern_type:
        patterns = await titan_db.get_patterns(pattern_type=pattern_type, limit=limit)
    else:
        patterns = await knowledge_store.get_all_patterns()
    
    return {
        "pattern_type": pattern_type or "all",
        "count": len(patterns) if isinstance(patterns, list) else sum(len(v) for v in patterns.values()),
        "patterns": patterns
    }


@router.get("/knowledge/hooks")
async def get_winning_hooks(limit: int = 20):
    """
    Get top performing hook patterns
    """
    
    hooks = await knowledge_store.get_winning_hooks(limit=limit)
    
    return {
        "count": len(hooks),
        "hooks": hooks
    }


@router.get("/knowledge/triggers")
async def get_emotional_triggers(limit: int = 20):
    """
    Get effective emotional trigger patterns
    """
    
    triggers = await knowledge_store.get_emotional_triggers(limit=limit)
    
    return {
        "count": len(triggers),
        "triggers": triggers
    }


@router.get("/knowledge/structures")
async def get_ad_structures(limit: int = 10):
    """
    Get proven ad structure patterns
    """
    
    structures = await knowledge_store.get_ad_structures(limit=limit)
    
    return {
        "count": len(structures),
        "structures": structures
    }


@router.get("/knowledge/ctas")
async def get_cta_patterns(limit: int = 20):
    """
    Get effective CTA patterns
    """
    
    ctas = await knowledge_store.get_cta_patterns(limit=limit)
    
    return {
        "count": len(ctas),
        "ctas": ctas
    }


@router.post("/knowledge/add")
async def add_custom_insight(request: AddInsightRequest):
    """
    Add a custom insight to the knowledge base
    """
    
    success = await knowledge_store.add_custom_insight(
        pattern_type=request.pattern_type,
        pattern_value=request.pattern_value,
        notes=request.notes
    )
    
    return {
        "success": success,
        "pattern_type": request.pattern_type,
        "pattern_value": request.pattern_value
    }


@router.get("/knowledge/compare/{video_id}")
async def compare_to_historical(video_id: str):
    """
    Compare a video's analysis to historical top performers
    """
    
    # Get video data
    video_data = await titan_db.get_video_analysis(video_id)
    
    if not video_data:
        raise HTTPException(status_code=404, detail="Video analysis not found")
    
    analysis = video_data.get("analysis", {})
    prediction = video_data.get("prediction", {})
    
    # Run comparison
    comparison = await knowledge_store.compare_to_historical(analysis, prediction)
    
    return {
        "video_id": video_id,
        "comparison": comparison
    }


@router.get("/knowledge/recommendations/{video_id}")
async def get_recommendations(video_id: str):
    """
    Get pattern-based recommendations for improving a video
    """
    
    # Get video analysis
    video_data = await titan_db.get_video_analysis(video_id)
    
    if not video_data:
        raise HTTPException(status_code=404, detail="Video analysis not found")
    
    analysis = video_data.get("analysis", {})
    
    # Get recommendations
    recommendations = await knowledge_store.get_recommendations_for_video(analysis)
    
    return {
        "video_id": video_id,
        "recommendations": recommendations
    }


@router.get("/knowledge/historical")
async def get_historical_insights():
    """
    Get aggregated insights from historical data
    """
    
    insights = await knowledge_store.get_historical_insights()
    
    return insights


@router.get("/knowledge/top-performers")
async def get_top_performers(limit: int = 10):
    """
    Get top performing historical campaigns
    """
    
    top = await titan_db.get_top_performers(limit=limit)
    
    return {
        "count": len(top),
        "campaigns": top
    }


@router.post("/knowledge/learn")
async def learn_from_campaign(campaign_data: Dict[str, Any]):
    """
    Learn patterns from a successful campaign
    
    Extracts and stores patterns for future use
    """
    
    patterns_added = await knowledge_store.learn_from_campaign(campaign_data)
    
    return {
        "success": patterns_added > 0,
        "patterns_learned": patterns_added
    }


@router.get("/knowledge/stats")
async def get_knowledge_stats():
    """
    Get statistics about the knowledge base
    """
    
    all_patterns = await knowledge_store.get_all_patterns()
    
    stats = {
        "total_patterns": 0,
        "by_type": {}
    }
    
    if isinstance(all_patterns, dict):
        for pattern_type, patterns in all_patterns.items():
            count = len(patterns) if isinstance(patterns, list) else 0
            stats["by_type"][pattern_type] = count
            stats["total_patterns"] += count
    
    # Get campaign stats
    campaigns = await titan_db.get_historical_campaigns(limit=1000)
    stats["total_campaigns"] = len(campaigns)
    
    if campaigns:
        stats["avg_roas"] = sum(c.get("roas", 0) for c in campaigns) / len(campaigns)
        stats["total_spend"] = sum(c.get("spend", 0) for c in campaigns)
        stats["total_revenue"] = sum(c.get("revenue", 0) for c in campaigns)
    
    return stats
