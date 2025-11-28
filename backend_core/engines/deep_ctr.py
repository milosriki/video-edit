from .base import BaseEngine
from typing import Dict, Any, List
import os
import json

class DeepCTREngine(BaseEngine):
    def __init__(self):
        super().__init__(name="DeepCTR", weight=2.0)
        self.model = None
        self.feature_columns = None
        self.encoders = {}
        self._load_trained_model()

    def _load_trained_model(self):
        """Load pre-trained DeepFM model if available."""
        models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
        model_path = os.path.join(models_dir, "deepfm_v2_trained.json")
        features_path = os.path.join(models_dir, "feature_columns.json")
        encoders_path = os.path.join(os.path.dirname(models_dir), "data", "label_encoders.csv")
        
        # Try to load trained model
        if os.path.exists(model_path):
            try:
                from ..training.train_deepctr import SimpleDeepFM
                self.model = SimpleDeepFM.load(model_path)
                print(f"✅ [DeepCTR] Loaded trained model from {model_path}")
            except Exception as e:
                print(f"⚠️ [DeepCTR] Failed to load trained model: {e}")
                self.model = None
        else:
            print(f"ℹ️ [DeepCTR] No trained model found at {model_path}. Using heuristic prediction.")
        
        # Load feature columns
        if os.path.exists(features_path):
            try:
                with open(features_path, "r") as f:
                    self.feature_columns = json.load(f)
                print(f"✅ [DeepCTR] Loaded {len(self.feature_columns)} feature columns")
            except Exception as e:
                print(f"⚠️ [DeepCTR] Failed to load feature columns: {e}")
        
        # Load label encoders
        if os.path.exists(encoders_path):
            try:
                import csv
                with open(encoders_path, "r") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        col = row["column"]
                        if col not in self.encoders:
                            self.encoders[col] = {}
                        self.encoders[col][row["value"]] = int(row["encoded"])
                print(f"✅ [DeepCTR] Loaded label encoders for {len(self.encoders)} columns")
            except Exception as e:
                print(f"⚠️ [DeepCTR] Failed to load encoders: {e}")

    def _prepare_features(self, input_data: Dict[str, Any]) -> List[float]:
        """Convert input data to feature vector for model prediction."""
        import math
        
        features = []
        
        # Categorical features (encoded)
        for col in ["hook_style", "pacing", "emotional_trigger"]:
            value = input_data.get(col, "unknown")
            encoder = self.encoders.get(col, {})
            features.append(float(encoder.get(value, 0)))
        
        # Numerical features
        impressions = float(input_data.get("impressions", 10000))
        features.append(math.log1p(impressions) if impressions > 0 else 0)
        
        features.append(float(input_data.get("ctr", 0.03)))
        features.append(float(input_data.get("cvr", 0.05)))
        features.append(float(input_data.get("cpc", 0.5)))
        features.append(float(input_data.get("cpm", 10.0)))
        
        # Video duration bucket
        duration = int(input_data.get("video_duration", 30))
        features.append(float(min(duration // 15, 8)))
        
        # Boolean features
        features.append(1.0 if input_data.get("has_cta_overlay") else 0.0)
        features.append(1.0 if input_data.get("has_subtitles") else 0.0)
        
        return features

    async def predict(self, input_data: Dict[str, Any]) -> float:
        """
        Predict virality score using trained model or heuristic fallback.
        Returns a score between 0 and 1.
        """
        
        # If trained model is available, use it
        if self.model is not None:
            try:
                features = self._prepare_features(input_data)
                score = self.model.predict_proba(features)
                return min(max(score, 0.0), 1.0)
            except Exception as e:
                print(f"⚠️ [DeepCTR] Model prediction failed: {e}")
        
        # Fallback to heuristic prediction
        return await self._heuristic_predict(input_data)

    async def _heuristic_predict(self, input_data: Dict[str, Any]) -> float:
        """
        Heuristic prediction based on domain knowledge.
        Used when no trained model is available.
        """
        score = 0.5
        
        # Hook style impact
        hook_style = input_data.get("hook_style", "")
        hook_scores = {
            "Visual Shock": 0.3,
            "Pattern Interrupt": 0.28,
            "Story": 0.22,
            "Question": 0.2,
            "Testimonial": 0.18
        }
        score += hook_scores.get(hook_style, 0.15)
        
        # Pacing impact
        pacing = input_data.get("pacing", "")
        if pacing == "Fast":
            score += 0.1
        elif pacing == "Medium":
            score += 0.05
        
        # Emotional trigger impact
        emotion = input_data.get("emotional_trigger", "")
        if emotion in ["Fear", "Urgency", "FOMO"]:
            score += 0.08
        elif emotion in ["Inspiration", "Aspiration"]:
            score += 0.06
        
        # Video features impact
        if input_data.get("has_cta_overlay"):
            score += 0.05
        if input_data.get("has_subtitles"):
            score += 0.03
        
        return min(max(score, 0.0), 1.0)

    async def train(self, training_data: List[Dict[str, Any]]):
        """Train the engine with new data."""
        print(f"[{self.name}] Training on {len(training_data)} samples...")
        print(f"[{self.name}] Note: For full training, use the training scripts in backend_core/training/")

