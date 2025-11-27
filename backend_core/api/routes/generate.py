"""
Generation Routes
POST /api/generate/blueprints - Generate 50 ad variations
POST /api/generate/hooks - Generate hook variations
POST /api/generate/cuts - Get AI cut suggestions
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from ...agents.director_agent import DirectorAgentV2, BlueprintGenerationRequest, AdBlueprint
from ...agents.oracle_agent import OracleAgent
from ...memory.supabase_client import titan_db
from ...memory.knowledge_store import knowledge_store

router = APIRouter(prefix="/api", tags=["generation"])

# Initialize agents
try:
    director = DirectorAgentV2()
except Exception as e:
    print(f"⚠️ DirectorAgentV2 init failed: {e}")
    director = None

try:
    oracle = OracleAgent()
except Exception as e:
    print(f"⚠️ OracleAgent init failed: {e}")
    oracle = None


class GenerateBlueprintsRequest(BaseModel):
    product_name: str
    offer: str
    target_avatar: str
    target_pain_points: List[str] = []
    target_desires: List[str] = []
    platform: str = "reels"
    tone: str = "direct"
    duration_seconds: int = 30
    num_variations: int = 10
    source_video_id: Optional[str] = None


class GenerateHooksRequest(BaseModel):
    base_hook: str
    target_avatar: str
    num_variations: int = 50


class GenerateCutsRequest(BaseModel):
    video_id: str
    target_durations: List[int] = [15, 30, 60]


class CutSuggestion(BaseModel):
    duration: int
    start_time: float
    end_time: float
    key_moments: List[Dict[str, Any]]
    reasoning: str


@router.post("/generate/blueprints")
async def generate_blueprints(request: GenerateBlueprintsRequest):
    """
    Generate multiple ad blueprint variations
    
    - Uses Director Agent with Reflexion Loop
    - Generates N variations ranked by predicted ROAS
    - Each blueprint includes full script, scenes, CTAs
    """
    
    if not director:
        raise HTTPException(status_code=503, detail="DirectorAgent not initialized")
    
    try:
        # Get source video analysis if provided
        source_analysis = None
        if request.source_video_id:
            video_data = await titan_db.get_video_analysis(request.source_video_id)
            if video_data:
                source_analysis = video_data.get("analysis")
        
        # Get historical winners for RAG
        historical_winners = await titan_db.get_top_performers(limit=10)
        
        # Build generation request
        gen_request = BlueprintGenerationRequest(
            product_name=request.product_name,
            offer=request.offer,
            target_avatar=request.target_avatar,
            target_pain_points=request.target_pain_points,
            target_desires=request.target_desires,
            platform=request.platform,
            tone=request.tone,
            duration_seconds=request.duration_seconds,
            num_variations=request.num_variations,
            source_video_analysis=source_analysis,
            historical_winners=historical_winners
        )
        
        print(f"🎬 Generating {request.num_variations} blueprints for {request.target_avatar}")
        
        # Generate blueprints
        blueprints = await director.generate_blueprints(gen_request)
        
        # Run predictions for each blueprint (if Oracle available)
        if oracle:
            for bp in blueprints:
                # Create feature dict from blueprint
                features = {
                    "hook_effectiveness": 7,  # Base score, would be refined
                    "hook_type": bp.hook_type,
                    "has_transformation": 1 if bp.emotional_triggers and "transformation" in str(bp.emotional_triggers) else 0,
                    "num_emotional_triggers": len(bp.emotional_triggers),
                    "num_scenes": len(bp.scenes),
                    "has_voiceover": 1,
                    "has_music": 1,
                    "cta_strength": 7,
                    "has_cta": 1,
                    "num_winning_patterns_matched": 1 if bp.based_on_pattern else 0
                }
                
                prediction = await oracle.predict(features, bp.id)
                bp.predicted_roas = prediction.roas_prediction.predicted_roas
                bp.confidence_score = prediction.overall_confidence
        
        # Re-rank by predicted ROAS
        blueprints.sort(key=lambda x: x.predicted_roas or 0, reverse=True)
        for i, bp in enumerate(blueprints):
            bp.rank = i + 1
        
        # Save blueprints to database
        saved = await titan_db.save_blueprints([bp.model_dump() for bp in blueprints])
        print(f"💾 Saved {saved} blueprints to database")
        
        return {
            "generated": len(blueprints),
            "saved": saved,
            "blueprints": [bp.model_dump() for bp in blueprints]
        }
        
    except Exception as e:
        print(f"❌ Blueprint generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/hooks")
async def generate_hooks(request: GenerateHooksRequest):
    """
    Generate 50+ hook variations from a base hook
    
    Uses RAG with historical winners
    """
    
    if not director:
        raise HTTPException(status_code=503, detail="DirectorAgent not initialized")
    
    try:
        print(f"🎬 Generating {request.num_variations} hook variations")
        
        hooks = await director.generate_hook_variations(
            base_hook=request.base_hook,
            target_avatar=request.target_avatar,
            num_variations=request.num_variations
        )
        
        return {
            "base_hook": request.base_hook,
            "generated": len(hooks),
            "variations": hooks
        }
        
    except Exception as e:
        print(f"❌ Hook generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate/cuts")
async def generate_cut_suggestions(request: GenerateCutsRequest):
    """
    Get AI-powered cut suggestions for different durations
    
    Analyzes video and suggests optimal cuts for 15s, 30s, 60s versions
    """
    
    # Get video analysis
    video_data = await titan_db.get_video_analysis(request.video_id)
    
    if not video_data:
        raise HTTPException(status_code=404, detail="Video analysis not found")
    
    analysis = video_data.get("analysis", {})
    scenes = analysis.get("scenes", [])
    key_moments = analysis.get("key_moments", [])
    
    # Generate cut suggestions for each duration
    suggestions = []
    
    for duration in request.target_durations:
        # Find optimal cut points
        # Priority: Hook (0-3s) + Key moments + CTA
        
        if len(scenes) < 2:
            # Not enough scenes for smart cutting
            suggestions.append(CutSuggestion(
                duration=duration,
                start_time=0,
                end_time=float(duration),
                key_moments=[],
                reasoning="Not enough scene data for intelligent cutting"
            ))
            continue
        
        # For short cuts (15s), focus on hook + one key moment + CTA
        if duration <= 15:
            suggestion = CutSuggestion(
                duration=duration,
                start_time=0,
                end_time=15,
                key_moments=[
                    {"time": 0, "type": "hook", "note": "Opening hook"},
                    {"time": 12, "type": "cta", "note": "Call to action"}
                ],
                reasoning="Short format: Strong hook directly to CTA for immediate impact"
            )
        
        # For medium cuts (30s), include problem + solution
        elif duration <= 30:
            suggestion = CutSuggestion(
                duration=duration,
                start_time=0,
                end_time=30,
                key_moments=[
                    {"time": 0, "type": "hook", "note": "Opening hook"},
                    {"time": 5, "type": "problem", "note": "Pain point"},
                    {"time": 15, "type": "solution", "note": "Solution intro"},
                    {"time": 27, "type": "cta", "note": "Call to action"}
                ],
                reasoning="Standard format: Hook-Problem-Solution-CTA arc"
            )
        
        # For longer cuts (60s+), include full story arc
        else:
            suggestion = CutSuggestion(
                duration=duration,
                start_time=0,
                end_time=float(duration),
                key_moments=[
                    {"time": 0, "type": "hook", "note": "Opening hook"},
                    {"time": 5, "type": "problem", "note": "Pain point deep dive"},
                    {"time": 20, "type": "solution", "note": "Solution introduction"},
                    {"time": 35, "type": "proof", "note": "Social proof/testimonial"},
                    {"time": 50, "type": "transformation", "note": "Transformation reveal"},
                    {"time": 55, "type": "cta", "note": "Call to action"}
                ],
                reasoning="Full story arc: Complete transformation journey"
            )
        
        suggestions.append(suggestion)
    
    return {
        "video_id": request.video_id,
        "suggestions": [s.model_dump() for s in suggestions]
    }


@router.get("/generate/blueprints/{video_id}")
async def get_video_blueprints(video_id: str):
    """
    Get all blueprints generated for a video
    """
    
    blueprints = await titan_db.get_blueprints(video_id=video_id)
    
    return {
        "video_id": video_id,
        "count": len(blueprints),
        "blueprints": blueprints
    }


@router.get("/generate/blueprints/top")
async def get_top_blueprints(limit: int = 10):
    """
    Get top-ranked blueprints by predicted ROAS
    """
    
    blueprints = await titan_db.get_top_blueprints(limit=limit)
    
    return {
        "count": len(blueprints),
        "blueprints": blueprints
    }
