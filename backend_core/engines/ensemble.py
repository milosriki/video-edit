from typing import List, Dict, Any
from .base import BaseEngine
from .deep_ctr import DeepCTREngine
from .claude import ClaudeEngine
from .gpt import GPTEngine
from .llama import LlamaEngine
from .video_agent import VideoAgentEngine
from .vertex_vision import VertexVisionEngine
from .google_ads import GoogleAdsEngine
from .ga4 import GA4Engine
from .fitness_form import FitnessFormEngine
from .transformation import TransformationEngine
from .roas import ROASEngine

class EnsemblePredictor:
    def __init__(self):
        self.engines: List[BaseEngine] = [
            DeepCTREngine(),
            ClaudeEngine(),
            GPTEngine(),
            LlamaEngine(),
            VideoAgentEngine(),
            VertexVisionEngine(),
            GoogleAdsEngine(),
            GA4Engine(),
            FitnessFormEngine(),
            TransformationEngine(),
            ROASEngine(),
            # Add other engines here (e.g., GeminiJudge, TrendSpotter, etc.)
        ]
        
    async def predict_virality(self, video_features: Dict[str, Any]) -> Dict[str, Any]:
        total_score = 0.0
        total_weight = 0.0
        
        engine_scores = {}
        
        for engine in self.engines:
            score = await engine.predict(video_features)
            weight = engine.weight
            
            total_score += score * weight
            total_weight += weight
            
            engine_scores[engine.name] = score
            
        final_score = total_score / total_weight if total_weight > 0 else 0.0
        
        return {
            "final_virality_score": final_score,
            "engine_breakdown": engine_scores
        }
