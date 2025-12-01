"""
DIRECTOR AGENT 🎬
Purpose: Create winning ad scripts
- Use Gemini 2.0 Flash Thinking with Reflexion Loop
- Generate 50+ hook variations using RAG
- Rank variations by predicted ROAS
- Create complete ad blueprints with scenes, captions, CTAs
"""

from __future__ import annotations
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
from ..config import GEMINI_MODEL_ID, GEMINI_FLASH_MODEL_ID, API_VERSION


class SceneBlueprint(BaseModel):
    """Individual scene in an ad blueprint"""
    scene_number: int = Field(..., description="Scene number")
    duration_seconds: float = Field(..., description="Duration in seconds")
    visual_description: str = Field(..., description="What's shown visually")
    audio_description: str = Field(..., description="Voiceover/music")
    text_overlay: Optional[str] = Field(None, description="On-screen text")
    transition: Optional[str] = Field(None, description="Transition to next scene")


class AdBlueprint(BaseModel):
    """Complete ad blueprint with full script"""
    id: str = Field(..., description="Unique blueprint ID")
    title: str = Field(..., description="Blueprint title/variation name")
    
    # Hook
    hook_text: str = Field(..., description="Opening hook text")
    hook_type: str = Field(..., description="Hook type: pattern_interrupt, question, statistic, story, transformation")
    
    # Full Script
    scenes: List[SceneBlueprint] = Field(..., description="Scene-by-scene breakdown")
    
    # CTA
    cta_text: str = Field(..., description="Call-to-action text")
    cta_type: str = Field(..., description="CTA type: book_call, download, buy_now, learn_more")
    
    # Captions
    caption: str = Field(..., description="Social media caption")
    hashtags: List[str] = Field(default_factory=list, description="Suggested hashtags")
    
    # Targeting
    target_avatar: str = Field(..., description="Target avatar this is designed for")
    emotional_triggers: List[str] = Field(default_factory=list, description="Emotional triggers used")
    
    # Predictions (filled by Oracle)
    predicted_roas: Optional[float] = Field(None, description="Predicted ROAS from Oracle")
    confidence_score: Optional[float] = Field(None, description="Prediction confidence")
    rank: Optional[int] = Field(None, description="Rank among all variations")
    
    # Source
    source_video_id: Optional[str] = Field(None, description="Source video if based on existing")
    based_on_pattern: Optional[str] = Field(None, description="Historical pattern this is based on")


class BlueprintGenerationRequest(BaseModel):
    """Request for generating ad blueprints"""
    product_name: str
    offer: str
    target_avatar: str
    target_pain_points: List[str]
    target_desires: List[str]
    platform: str = "reels"
    tone: str = "direct"
    duration_seconds: int = 30
    num_variations: int = 10
    source_video_analysis: Optional[Dict[str, Any]] = None
    historical_winners: Optional[List[Dict[str, Any]]] = None


class DirectorAgentV2:
    """
    DIRECTOR AGENT 🎬
    Creates winning ad scripts with Reflexion Loop
    """
    
    def __init__(self):
        self.client = genai.Client(http_options={'api_version': API_VERSION})
        self.thinking_model = GEMINI_MODEL_ID  # Pro for deep thinking
        self.fast_model = GEMINI_FLASH_MODEL_ID  # Flash for variations
        
        # Hook templates from historical winners
        self.hook_templates = [
            {"type": "pattern_interrupt", "template": "STOP scrolling if you {pain_point}"},
            {"type": "pattern_interrupt", "template": "This is exactly why {pain_point}"},
            {"type": "question", "template": "What if you could {desire} in just {timeframe}?"},
            {"type": "question", "template": "Why do {avatar} always {pain_point}?"},
            {"type": "statistic", "template": "{stat_number}% of {avatar} struggle with {pain_point}"},
            {"type": "statistic", "template": "In just {timeframe}, {outcome}"},
            {"type": "story", "template": "I used to {pain_point}. Then I discovered..."},
            {"type": "story", "template": "Meet {name}. {timeframe} ago, {name} was {pain_point}..."},
            {"type": "transformation", "template": "From {before} to {after} in {timeframe}"},
            {"type": "transformation", "template": "Watch what happened when {avatar} finally {action}"},
            {"type": "authority", "template": "As a {credential}, I've seen {observation}"},
            {"type": "urgency", "template": "Only {number} spots left for {offer}"},
        ]
    
    async def generate_blueprints(
        self, 
        request: BlueprintGenerationRequest
    ) -> List[AdBlueprint]:
        """
        Generate multiple ad blueprint variations
        Uses Reflexion Loop for quality improvement
        """
        
        # Step 1: Generate initial variations with Gemini
        initial_blueprints = await self._generate_initial_variations(request)
        
        # Step 2: Reflexion Loop - Self-critique and improve
        improved_blueprints = await self._reflexion_loop(initial_blueprints, request)
        
        # Step 3: Rank by predicted performance
        # Note: Actual ROAS prediction happens in Oracle
        ranked_blueprints = self._rank_blueprints(improved_blueprints)
        
        return ranked_blueprints
    
    async def _generate_initial_variations(
        self, 
        request: BlueprintGenerationRequest
    ) -> List[AdBlueprint]:
        """Generate initial blueprint variations"""
        
        # Build RAG context from historical winners
        winners_context = ""
        if request.historical_winners:
            winners_context = f"""
            
            Historical winning campaigns to draw inspiration from:
            {json.dumps(request.historical_winners[:5], indent=2)}
            
            Use these patterns as inspiration but create original variations.
            """
        
        # Build source video context
        source_context = ""
        if request.source_video_analysis:
            source_context = f"""
            
            Source video analysis to base blueprints on:
            Hook: {request.source_video_analysis.get('hook', {})}
            Strengths: {request.source_video_analysis.get('strengths', [])}
            Emotional triggers: {request.source_video_analysis.get('emotional_triggers', [])}
            
            Create variations that build on these strengths.
            """
        
        prompt = f"""
        Create {request.num_variations} unique ad blueprint variations for:
        
        PRODUCT: {request.product_name}
        OFFER: {request.offer}
        TARGET AVATAR: {request.target_avatar}
        PAIN POINTS: {', '.join(request.target_pain_points)}
        DESIRES: {', '.join(request.target_desires)}
        PLATFORM: {request.platform}
        TONE: {request.tone}
        DURATION: {request.duration_seconds} seconds
        
        {winners_context}
        {source_context}
        
        For each variation, create:
        1. A unique hook (use different hook types: pattern_interrupt, question, statistic, story, transformation)
        2. 4-6 scenes with specific visuals and audio
        3. A compelling CTA
        4. Social media caption with hashtags
        
        Make each variation distinctly different in approach while targeting the same avatar.
        Focus on emotional triggers and psychological persuasion techniques.
        
        Return as JSON array of {request.num_variations} complete blueprints.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.thinking_model,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            
            if not response.text:
                raise ValueError("Empty response from Gemini")
            
            # Parse response
            data = json.loads(response.text)
            
            blueprints = []
            if isinstance(data, list):
                for i, item in enumerate(data):
                    bp = self._parse_blueprint(item, i + 1, request)
                    if bp:
                        blueprints.append(bp)
            
            print(f"🎬 DIRECTOR: Generated {len(blueprints)} initial variations")
            return blueprints
            
        except Exception as e:
            print(f"❌ DIRECTOR ERROR in initial generation: {e}")
            # Fallback to template-based generation
            return self._generate_template_variations(request)
    
    def _parse_blueprint(
        self, 
        item: Dict[str, Any], 
        index: int,
        request: BlueprintGenerationRequest
    ) -> Optional[AdBlueprint]:
        """Parse a blueprint from Gemini response"""
        
        try:
            # Parse scenes
            scenes = []
            raw_scenes = item.get('scenes', [])
            for i, scene in enumerate(raw_scenes):
                scenes.append(SceneBlueprint(
                    scene_number=i + 1,
                    duration_seconds=scene.get('duration_seconds', 5),
                    visual_description=scene.get('visual_description', scene.get('visual', '')),
                    audio_description=scene.get('audio_description', scene.get('audio', '')),
                    text_overlay=scene.get('text_overlay'),
                    transition=scene.get('transition')
                ))
            
            return AdBlueprint(
                id=f"bp_{index:03d}",
                title=item.get('title', f"Variation {index}"),
                hook_text=item.get('hook_text', item.get('hook', '')),
                hook_type=item.get('hook_type', 'pattern_interrupt'),
                scenes=scenes,
                cta_text=item.get('cta_text', item.get('cta', request.offer)),
                cta_type=item.get('cta_type', 'book_call'),
                caption=item.get('caption', ''),
                hashtags=item.get('hashtags', []),
                target_avatar=request.target_avatar,
                emotional_triggers=item.get('emotional_triggers', []),
                source_video_id=request.source_video_analysis.get('video_id') if request.source_video_analysis else None,
                based_on_pattern=item.get('based_on_pattern')
            )
        except Exception as e:
            print(f"Failed to parse blueprint: {e}")
            return None
    
    def _generate_template_variations(
        self, 
        request: BlueprintGenerationRequest
    ) -> List[AdBlueprint]:
        """Fallback template-based generation"""
        
        blueprints = []
        
        for i, template in enumerate(self.hook_templates[:request.num_variations]):
            # Fill template
            hook_text = template["template"]
            hook_text = hook_text.replace("{pain_point}", request.target_pain_points[0] if request.target_pain_points else "struggle")
            hook_text = hook_text.replace("{desire}", request.target_desires[0] if request.target_desires else "succeed")
            hook_text = hook_text.replace("{avatar}", request.target_avatar)
            hook_text = hook_text.replace("{timeframe}", "12 weeks")
            hook_text = hook_text.replace("{offer}", request.offer)
            hook_text = hook_text.replace("{outcome}", "complete transformation")
            hook_text = hook_text.replace("{before}", "tired and stressed")
            hook_text = hook_text.replace("{after}", "energized and confident")
            hook_text = hook_text.replace("{stat_number}", "73")
            hook_text = hook_text.replace("{name}", "Alex")
            hook_text = hook_text.replace("{credential}", "performance coach")
            hook_text = hook_text.replace("{observation}", "what separates those who succeed")
            hook_text = hook_text.replace("{number}", "5")
            hook_text = hook_text.replace("{action}", "committed to change")
            
            # Create blueprint
            bp = AdBlueprint(
                id=f"bp_{i + 1:03d}",
                title=f"{template['type'].replace('_', ' ').title()} Variation",
                hook_text=hook_text,
                hook_type=template['type'],
                scenes=[
                    SceneBlueprint(
                        scene_number=1,
                        duration_seconds=3,
                        visual_description="Hook - attention grabbing opening",
                        audio_description="Punchy voiceover with hook",
                        text_overlay=hook_text[:50] + "..."
                    ),
                    SceneBlueprint(
                        scene_number=2,
                        duration_seconds=7,
                        visual_description="Problem - show the pain point",
                        audio_description="Describe the struggle"
                    ),
                    SceneBlueprint(
                        scene_number=3,
                        duration_seconds=10,
                        visual_description="Solution - introduce the offer",
                        audio_description=f"Introduce {request.product_name}"
                    ),
                    SceneBlueprint(
                        scene_number=4,
                        duration_seconds=7,
                        visual_description="Proof - testimonial or transformation",
                        audio_description="Show results"
                    ),
                    SceneBlueprint(
                        scene_number=5,
                        duration_seconds=3,
                        visual_description="CTA - clear call to action",
                        audio_description=request.offer,
                        text_overlay=request.offer
                    )
                ],
                cta_text=request.offer,
                cta_type="book_call",
                caption=f"Ready to transform? 💪 {request.offer} - Link in bio!",
                hashtags=["#transformation", "#fitness", "#motivation", "#dubai"],
                target_avatar=request.target_avatar,
                emotional_triggers=["inspiration", "urgency", "social_proof"]
            )
            
            blueprints.append(bp)
        
        return blueprints
    
    async def _reflexion_loop(
        self, 
        blueprints: List[AdBlueprint],
        request: BlueprintGenerationRequest
    ) -> List[AdBlueprint]:
        """
        Reflexion Loop: Self-critique and improve blueprints
        """
        
        if not blueprints:
            return blueprints
        
        # Critique prompt
        critique_prompt = f"""
        You are an expert ad creative director. Critique these ad blueprints for {request.target_avatar}.
        
        Product: {request.product_name}
        Platform: {request.platform}
        
        Blueprints to critique:
        {json.dumps([bp.model_dump() for bp in blueprints[:5]], indent=2)}
        
        For each blueprint, identify:
        1. What's working well
        2. What could be stronger
        3. Specific improvement suggestions
        
        Return JSON with improved versions of each blueprint.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.fast_model,
                contents=[critique_prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            
            if response.text:
                improved_data = json.loads(response.text)
                
                # Merge improvements
                if isinstance(improved_data, list):
                    for i, improvement in enumerate(improved_data):
                        if i < len(blueprints) and isinstance(improvement, dict):
                            # Update hook if improved
                            if 'hook_text' in improvement:
                                blueprints[i].hook_text = improvement['hook_text']
                            if 'cta_text' in improvement:
                                blueprints[i].cta_text = improvement['cta_text']
                
                print(f"🎬 DIRECTOR: Reflexion loop completed, improved {len(blueprints)} blueprints")
        
        except Exception as e:
            print(f"⚠️ DIRECTOR: Reflexion loop failed, using original: {e}")
        
        return blueprints
    
    def _rank_blueprints(self, blueprints: List[AdBlueprint]) -> List[AdBlueprint]:
        """
        Rank blueprints by predicted performance
        Note: Actual ROAS prediction is done by Oracle
        """
        
        # Simple heuristic ranking based on hook type effectiveness
        hook_type_scores = {
            "pattern_interrupt": 9,
            "transformation": 8.5,
            "story": 8,
            "question": 7.5,
            "statistic": 7,
            "authority": 6.5,
            "urgency": 6
        }
        
        for bp in blueprints:
            score = hook_type_scores.get(bp.hook_type, 5)
            # Bonus for emotional triggers
            score += len(bp.emotional_triggers) * 0.2
            # Bonus for more scenes (more content)
            score += len(bp.scenes) * 0.1
            bp.rank = int(score * 10)  # Temporary score
        
        # Sort by rank descending
        blueprints.sort(key=lambda x: x.rank or 0, reverse=True)
        
        # Assign actual ranks
        for i, bp in enumerate(blueprints):
            bp.rank = i + 1
        
        return blueprints
    
    async def generate_hook_variations(
        self,
        base_hook: str,
        target_avatar: str,
        num_variations: int = 50
    ) -> List[Dict[str, str]]:
        """
        Generate 50+ hook variations from a base hook
        Uses RAG with historical winners
        """
        
        prompt = f"""
        Generate {num_variations} unique hook variations based on this template:
        
        BASE HOOK: "{base_hook}"
        TARGET: {target_avatar}
        
        Create variations using different:
        1. Opening words (Stop, Wait, Warning, This is why, What if, etc.)
        2. Emotional triggers
        3. Specificity levels
        4. Question vs statement format
        5. Numbers and statistics
        
        Return as JSON array with: hook_text, hook_type, predicted_effectiveness (1-10)
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.fast_model,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            
            if response.text:
                variations = json.loads(response.text)
                print(f"🎬 DIRECTOR: Generated {len(variations)} hook variations")
                return variations
        
        except Exception as e:
            print(f"❌ DIRECTOR: Hook generation failed: {e}")
        
        return []
