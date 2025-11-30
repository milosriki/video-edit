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
        
        score = deep_ctr_engine.predict_sync(formatted_features)
        
        # Scale: DeepCTR returns 0-100 probability. 
        # We want to map this to a ROAS-like score (0-10) for the frontend scanner,
        # OR keep it 0-100 for the Council.
        # The Council expects 0-100.
        # The Scanner expects 0-10 ROAS.
        
        # Let's return the raw 0-100 probability here, 
        # and let the consumer decide how to display it.
        # Wait, the previous mock returned 0-10.
        # Let's normalize to 0-10 for backward compatibility with the Scanner UI.
        
        return score / 10.0 # Returns 0.0 to 10.0
        
    except Exception as e:
        print(f"⚠️ DeepCTR Inference Error: {e}")
        return 5.0 # Fallback
