"""
ANALYST AGENT 🔬
Purpose: Deep video intelligence
- Extract frames using FFmpeg
- Transcribe audio with Gemini
- Detect scenes, energy, transformations
- Identify hooks (first 3 seconds)
- Compare to winning patterns from historical data
"""

from __future__ import annotations
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
from ..config import GEMINI_MODEL_ID, API_VERSION


class SceneAnalysis(BaseModel):
    timestamp: str = Field(..., description="Timestamp in format MM:SS")
    description: str = Field(..., description="Description of the scene")
    energy_level: str = Field(..., description="Energy level: low, medium, high")
    key_objects: List[str] = Field(default_factory=list, description="Key objects in scene")


class HookAnalysis(BaseModel):
    hook_type: str = Field(..., description="Type of hook: Visual Shock, Question, Story, Statistic, etc.")
    hook_text: Optional[str] = Field(None, description="Text used in hook if any")
    effectiveness_score: int = Field(..., description="Score 1-10 for hook effectiveness")
    reasoning: str = Field(..., description="Why this hook works or doesn't work")


class TransformationAnalysis(BaseModel):
    before_state: str = Field(..., description="Before state description")
    after_state: str = Field(..., description="After state description")
    transformation_type: str = Field(..., description="Type: physical, emotional, lifestyle, financial")
    believability_score: int = Field(..., description="Score 1-10 for believability")


class VideoDeepAnalysis(BaseModel):
    video_id: str = Field(..., description="Video identifier")
    duration_seconds: float = Field(..., description="Video duration in seconds")
    
    # Hook Analysis (First 3 seconds)
    hook: HookAnalysis = Field(..., description="Analysis of the opening hook")
    
    # Scene Analysis
    scenes: List[SceneAnalysis] = Field(default_factory=list, description="Scene-by-scene breakdown")
    
    # Energy & Pacing
    overall_energy: str = Field(..., description="Overall energy: low, medium, high, dynamic")
    pacing: str = Field(..., description="Pacing: slow, moderate, fast, variable")
    
    # Transformation Detection
    transformation: Optional[TransformationAnalysis] = Field(None, description="Before/after transformation if present")
    
    # Content Analysis
    emotional_triggers: List[str] = Field(default_factory=list, description="Emotional triggers used")
    visual_elements: List[str] = Field(default_factory=list, description="Key visual elements")
    
    # Audio Analysis
    has_voiceover: bool = Field(..., description="Whether video has voiceover")
    has_music: bool = Field(..., description="Whether video has background music")
    transcription: Optional[str] = Field(None, description="Full transcription if available")
    key_phrases: List[str] = Field(default_factory=list, description="Key phrases from audio")
    
    # Performance Prediction Inputs
    cta_type: Optional[str] = Field(None, description="Type of call-to-action if present")
    cta_strength: int = Field(0, description="CTA strength score 1-10")
    
    # Overall Assessment
    summary: str = Field(..., description="Brief summary of video analysis")
    strengths: List[str] = Field(default_factory=list, description="Key strengths of the video")
    weaknesses: List[str] = Field(default_factory=list, description="Areas for improvement")
    
    # Comparison Data
    similar_to_winning_patterns: List[str] = Field(default_factory=list, description="Similar winning patterns identified")


class AnalystAgent:
    """
    ANALYST AGENT 🔬
    Deep video intelligence for extracting actionable insights
    """
    
    def __init__(self):
        self.client = genai.Client(http_options={'api_version': API_VERSION})
        self.model_id = GEMINI_MODEL_ID
    
    def analyze_video(self, video_uri: str, historical_patterns: Optional[List[Dict]] = None) -> VideoDeepAnalysis:
        """
        Perform deep analysis on a video
        
        Args:
            video_uri: GCS URI or URL to the video
            historical_patterns: Optional list of winning patterns to compare against
            
        Returns:
            VideoDeepAnalysis with comprehensive video insights
        """
        
        patterns_context = ""
        if historical_patterns:
            patterns_context = f"""
            
            Compare to these known winning patterns from historical campaigns:
            {json.dumps(historical_patterns[:5], indent=2)}
            
            Identify if the video matches any of these patterns.
            """
        
        prompt = f"""
        Perform a comprehensive deep analysis of this video for ad performance prediction.
        
        Focus on:
        
        1. HOOK ANALYSIS (First 3 seconds)
           - What type of hook is used? (Visual Shock, Question, Story, Statistic, etc.)
           - How effective is it at stopping the scroll?
           - Rate effectiveness 1-10
        
        2. SCENE-BY-SCENE BREAKDOWN
           - Timestamp each major scene
           - Describe key visuals
           - Note energy level changes
        
        3. ENERGY & PACING
           - Overall energy level
           - Pacing speed
           - Any dramatic shifts
        
        4. TRANSFORMATION DETECTION
           - Is there a before/after transformation?
           - What type of transformation?
           - How believable is it?
        
        5. EMOTIONAL TRIGGERS
           - What emotions does the video evoke?
           - Which triggers are strongest?
        
        6. AUDIO ANALYSIS
           - Is there voiceover?
           - Is there music?
           - What are the key phrases spoken?
        
        7. CALL-TO-ACTION
           - What is the CTA?
           - How strong is it?
        
        8. STRENGTHS & WEAKNESSES
           - What works well?
           - What could be improved?
        
        {patterns_context}
        
        Provide detailed, actionable analysis.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[
                    types.Part.from_uri(
                        file_uri=video_uri,
                        mime_type="video/mp4"
                    ),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=VideoDeepAnalysis
                )
            )
            
            if not response.text:
                raise ValueError("Empty response from Gemini")
            
            data = json.loads(response.text)
            # Ensure video_id is set
            if 'video_id' not in data or not data['video_id']:
                data['video_id'] = video_uri.split('/')[-1] if '/' in video_uri else video_uri
            
            analysis = VideoDeepAnalysis(**data)
            
            # Audit logging
            print(f"🔬 ANALYST: Analyzed {video_uri}")
            print(f"   Hook Type: {analysis.hook.hook_type} (Score: {analysis.hook.effectiveness_score}/10)")
            print(f"   Pacing: {analysis.pacing}, Energy: {analysis.overall_energy}")
            print(f"   Scenes: {len(analysis.scenes)}")
            
            return analysis
            
        except Exception as e:
            print(f"❌ ANALYST ERROR: {e}")
            raise e
    
    def extract_features_for_prediction(self, analysis: VideoDeepAnalysis) -> Dict[str, Any]:
        """
        Extract numerical features from analysis for ML prediction
        
        Returns a dict of features suitable for the Oracle's ensemble models
        """
        
        return {
            # Hook Features
            "hook_effectiveness": analysis.hook.effectiveness_score,
            "hook_type": analysis.hook.hook_type,
            
            # Energy Features
            "energy_level": {"low": 1, "medium": 2, "high": 3, "dynamic": 4}.get(analysis.overall_energy, 2),
            "pacing_speed": {"slow": 1, "moderate": 2, "fast": 3, "variable": 3}.get(analysis.pacing, 2),
            
            # Content Features
            "has_transformation": 1 if analysis.transformation else 0,
            "transformation_believability": analysis.transformation.believability_score if analysis.transformation else 0,
            "num_emotional_triggers": len(analysis.emotional_triggers),
            "num_scenes": len(analysis.scenes),
            
            # Audio Features
            "has_voiceover": 1 if analysis.has_voiceover else 0,
            "has_music": 1 if analysis.has_music else 0,
            "num_key_phrases": len(analysis.key_phrases),
            
            # CTA Features
            "cta_strength": analysis.cta_strength,
            "has_cta": 1 if analysis.cta_type else 0,
            
            # Quality Features
            "num_strengths": len(analysis.strengths),
            "num_weaknesses": len(analysis.weaknesses),
            "quality_ratio": len(analysis.strengths) / max(len(analysis.weaknesses), 1),
            
            # Pattern Matching
            "num_winning_patterns_matched": len(analysis.similar_to_winning_patterns),
        }
    
    def compare_to_historical(self, analysis: VideoDeepAnalysis, top_performers: List[Dict]) -> Dict[str, Any]:
        """
        Compare video analysis to historical top performers
        
        Returns comparison metrics and recommendations
        """
        if not top_performers:
            return {"comparison": "No historical data available"}
        
        # Calculate similarity scores
        similarities = []
        for performer in top_performers[:5]:
            score = 0
            reasons = []
            
            # Compare hook type
            if performer.get('hook_text', '').lower() in analysis.hook.hook_text.lower() if analysis.hook.hook_text else False:
                score += 20
                reasons.append("Similar hook approach")
            
            # Compare pacing
            if performer.get('pacing', '').lower() == analysis.pacing.lower():
                score += 15
                reasons.append("Matching pacing")
            
            # Compare emotional triggers
            performer_triggers = set(performer.get('emotional_triggers', []))
            analysis_triggers = set(analysis.emotional_triggers)
            trigger_overlap = len(performer_triggers & analysis_triggers)
            if trigger_overlap > 0:
                score += trigger_overlap * 10
                reasons.append(f"{trigger_overlap} shared emotional triggers")
            
            similarities.append({
                "campaign": performer.get('campaign_name', 'Unknown'),
                "roas": performer.get('roas', 0),
                "similarity_score": score,
                "reasons": reasons
            })
        
        # Sort by similarity
        similarities.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return {
            "most_similar": similarities[0] if similarities else None,
            "all_comparisons": similarities,
            "avg_roas_of_similar": sum(s['roas'] for s in similarities) / len(similarities) if similarities else 0
        }
