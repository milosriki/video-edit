from typing import List, Dict, Any
from .base import BaseEngine

# Import engines with graceful fallback for missing dependencies
engines_available = []

try:
    from .deep_ctr import DeepCTREngine
    engines_available.append(("DeepCTR", DeepCTREngine))
except ImportError as e:
    print(f"⚠️ DeepCTREngine not available: {e}")

try:
    from .claude import ClaudeEngine
    engines_available.append(("Claude", ClaudeEngine))
except ImportError as e:
    print(f"⚠️ ClaudeEngine not available: {e}")

try:
    from .gpt import GPTEngine
    engines_available.append(("GPT", GPTEngine))
except ImportError as e:
    print(f"⚠️ GPTEngine not available: {e}")

try:
    from .llama import LlamaEngine
    engines_available.append(("LLaMA", LlamaEngine))
except ImportError as e:
    print(f"⚠️ LlamaEngine not available: {e}")

try:
    from .video_agent import VideoAgentEngine
    engines_available.append(("VideoAgent", VideoAgentEngine))
except ImportError as e:
    print(f"⚠️ VideoAgentEngine not available: {e}")

try:
    from .vertex_vision import VertexVisionEngine
    engines_available.append(("VertexVision", VertexVisionEngine))
except ImportError as e:
    print(f"⚠️ VertexVisionEngine not available: {e}")

try:
    from .google_ads import GoogleAdsEngine
    engines_available.append(("GoogleAds", GoogleAdsEngine))
except ImportError as e:
    print(f"⚠️ GoogleAdsEngine not available: {e}")

try:
    from .ga4 import GA4Engine
    engines_available.append(("GA4", GA4Engine))
except ImportError as e:
    print(f"⚠️ GA4Engine not available: {e}")

try:
    from .fitness_form import FitnessFormEngine
    engines_available.append(("FitnessForm", FitnessFormEngine))
except ImportError as e:
    print(f"⚠️ FitnessFormEngine not available: {e}")

try:
    from .transformation import TransformationEngine
    engines_available.append(("Transformation", TransformationEngine))
except ImportError as e:
    print(f"⚠️ TransformationEngine not available: {e}")

try:
    from .roas import ROASEngine
    engines_available.append(("ROAS", ROASEngine))
except ImportError as e:
    print(f"⚠️ ROASEngine not available: {e}")


class EnsemblePredictor:
    def __init__(self):
        self.engines: List[BaseEngine] = []
        
        # Initialize only available engines
        for name, EngineClass in engines_available:
            try:
                engine = EngineClass()
                self.engines.append(engine)
                print(f"✅ {name} engine initialized")
            except Exception as e:
                print(f"⚠️ {name} engine init failed: {e}")
        
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
