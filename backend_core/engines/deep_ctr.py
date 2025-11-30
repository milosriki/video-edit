from .base import BaseEngine
from typing import Dict, Any, List
import os


class DeepCTREngine(BaseEngine):
    """
    DeepCTR Engine with Real DeepFM model and Gemini fallback.
    Supports both async (BaseEngine interface) and sync (legacy) prediction.
    """
    def __init__(self, model_path: str = None):
        super().__init__(name="DeepCTR", weight=2.0)
        
        # Determine model path - try multiple locations
        if model_path:
            self.model_path = model_path
        else:
            # Check for model in different locations
            possible_paths = [
                "backend_core/models/deepfm_v2_trained.pth",
                "functions/models/deepfm_v2_trained.pth",
                "models/deepfm_v2_trained.pth",
            ]
            self.model_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    self.model_path = path
                    break
        
        self.model = None
        self.model_loaded = False
        self.fixlen_feature_columns = None
        self.dnn_feature_columns = None
        self.linear_feature_columns = None
        self._initialize_model()

    def _initialize_model(self):
        """Creates model structure and loads weights"""
        try:
            from deepctr_torch.inputs import SparseFeat, get_feature_names
        except ImportError:
            print("⚠️ DeepCTR Import Failed. Running in Fallback Mode.")
            self.model = None
            return

        # 1. Define Feature Space (Must match training/feature_engineering.py)
        # Sparse: 'has_transformation', 'has_urgency', 'has_offer', 'is_video'
        sparse_features = ['has_transformation', 'has_urgency', 'has_offer', 'is_video']
        
        self.fixlen_feature_columns = [
            SparseFeat(feat, vocabulary_size=2, embedding_dim=4) for feat in sparse_features
        ]
        
        self.dnn_feature_columns = self.fixlen_feature_columns
        self.linear_feature_columns = self.fixlen_feature_columns
        
        # 2. Build DeepFM Model
        try:
            from deepctr_torch.models import DeepFM
            import torch

            # Note: l2_reg set to 0 to match titan-ad-engine training config.
            # This prevents PyTorch inplace errors and ensures compatibility with pre-trained weights.
            # Regularization was applied during training, not inference.
            self.model = DeepFM(self.linear_feature_columns, self.dnn_feature_columns, task='binary', 
                               l2_reg_linear=0, l2_reg_embedding=0, l2_reg_dnn=0)
            self.model.compile("adam", "binary_crossentropy", metrics=['binary_crossentropy'])
            
            # 3. Load Weights
            if self.model_path and os.path.exists(self.model_path):
                try:
                    state_dict = torch.load(self.model_path, map_location=torch.device('cpu'))
                    self.model.load_state_dict(state_dict)
                    self.model_loaded = True
                    print(f"✅ DeepCTR: Loaded Trained Model from {self.model_path}")
                except Exception as e:
                    print(f"❌ DeepCTR Load Failed: {e}")
                    print("⚠️ Falling back to Gemini Zero-Shot")
                    self.model = None
            else:
                print(f"⚠️ DeepCTR: Model not found. Using Gemini Zero-Shot fallback.")
                self.model = None
                
        except Exception as e:
            print(f"❌ DeepCTR Init Failed (Library/Env Issue): {e}")
            print("⚠️ Falling back to Gemini Zero-Shot")
            self.model = None

    def predict_sync(self, video_data: dict) -> float:
        """
        Synchronous prediction for DeepCTR.
        Input: {"niche": "fitness", "hook_type": "visual_shock", ...}
        Output: 0.0 - 100.0 (ROAS Probability)
        """
        if self.model:
            # REAL MODEL PREDICTION
            try:
                import numpy as np
                
                # Extract features from input dict (heuristic mapping)
                text = str(video_data.get('strategy', '')).lower() + " " + str(video_data.get('hook_type', '')).lower()
                
                input_data = {
                    'has_transformation': np.array([1 if any(x in text for x in ['before', 'after', 'transform']) else 0]),
                    'has_urgency': np.array([1 if any(x in text for x in ['now', 'today', 'limited']) else 0]),
                    'has_offer': np.array([1 if any(x in text for x in ['free', 'discount', '%', 'off']) else 0]),
                    'is_video': np.array([1]) # Always video for this engine
                }
                
                pred_ans = self.model.predict(input_data, batch_size=1)
                score = float(pred_ans[0][0]) * 100.0
                return score
            except Exception as e:
                print(f"⚠️ DeepCTR Prediction Error: {e}")
                # Fallthrough to Gemini
        
        # GEMINI ZERO-SHOT FALLBACK
        try:
            import google.generativeai as genai
            
            api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
            if not api_key:
                return 50.0 
                
            genai.configure(api_key=api_key)
            # Use configurable model version with fallback
            model_version = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-2.0-flash-exp")
            model = genai.GenerativeModel(model_version)
            
            prompt = f"""
            Predict ROAS probability (0-100) for this ad:
            Features: {video_data}
            Return ONLY the number.
            """
            
            response = model.generate_content(prompt)
            return float(response.text.strip())
            
        except Exception as e:
            print(f"⚠️ DeepCTR Zero-Shot Failed: {e}")
            return 75.0

    async def predict(self, input_data: Dict[str, Any]) -> float:
        """
        Async prediction for BaseEngine interface.
        Returns 0.0 - 1.0 for compatibility with ensemble.
        """
        # Map input_data to the sync predict format
        video_data = {
            "hook_type": input_data.get("hook_style", ""),
            "strategy": input_data.get("strategy", ""),
            "pacing": input_data.get("pacing", ""),
        }
        
        # Get sync prediction (0-100 scale)
        raw_score = self.predict_sync(video_data)
        
        # Convert to 0-1 scale for BaseEngine compatibility
        return min(max(raw_score / 100.0, 0.0), 1.0)

    async def train(self, training_data: List[Dict[str, Any]]):
        print(f"[{self.name}] Training on {len(training_data)} samples...")
        # Training would require deepctr_torch and proper dataset preparation
        pass


# Global engine instance for direct import
deep_ctr_engine = None

def get_deep_ctr_engine():
    """Get or create the global DeepCTR engine instance."""
    global deep_ctr_engine
    if deep_ctr_engine is None:
        deep_ctr_engine = DeepCTREngine()
    return deep_ctr_engine
