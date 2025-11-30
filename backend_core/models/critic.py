from backend_core.engines.deep_ctr import DeepCTREngine, get_deep_ctr_engine

# Initialize the engine once
try:
    deep_ctr_engine = get_deep_ctr_engine()
except Exception as e:
    print(f"❌ Critic Init Failed: {e}")
    class DummyDeepCTR:
        def predict_sync(self, *args, **kwargs): return 50.0
    deep_ctr_engine = DummyDeepCTR()

def predict_deep_ctr(features: dict) -> float:
    """
    Wrapper that calls the REAL DeepFM model.
    
    Args:
        features: Dict with keys like 'niche', 'hook_type', 'dominant_emotion', etc.
    
    Returns:
        float: Score in 0-10 range for backward compatibility with Scanner UI.
               Note: The Council (ensemble.py) multiplies this by 10 to get 0-100 scale.
    """
    try:
        # Map the loose features from Gemini/Scanner to the strict schema of DeepCTR
        formatted_features = {
            "niche": features.get("niche", "general"),
            "hook_type": features.get("hook_type", "other"),
            "platform": "meta", # Default to Meta for now
            "emotion": features.get("dominant_emotion", "neutral"),
            "duration": features.get("duration_sec", 15),
            "text_density": 0.8 if features.get("text_density") == "high" else 0.3
        }
        
        # DeepCTREngine.predict_sync() returns 0-100 probability
        score = deep_ctr_engine.predict_sync(formatted_features)
        
        # Scale to 0-10 for backward compatibility with Scanner UI
        # The Council (ensemble.py) will multiply by 10 to normalize to 0-100
        return score / 10.0
        
    except Exception as e:
        print(f"⚠️ DeepCTR Inference Error: {e}")
        return 5.0 # Fallback (middle of 0-10 range)
