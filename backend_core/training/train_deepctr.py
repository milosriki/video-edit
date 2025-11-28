"""
Train DeepFM Model for Ad Performance Prediction
=================================================
Trains a DeepFM/DeepCTR model on historical ad data.

Usage:
    python -m backend_core.training.train_deepctr

Input:
    backend_core/data/training_data.csv

Output:
    backend_core/models/deepfm_v2_trained.pth
"""

import os
import sys
import csv
import json
import math
import random
from typing import Dict, List, Tuple, Any

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


def load_csv(filepath: str) -> List[Dict[str, Any]]:
    """Load data from CSV file."""
    with open(filepath, "r", newline="") as f:
        reader = csv.DictReader(f)
        return list(reader)


def prepare_data(data: List[Dict]) -> Tuple[List, List, List[str]]:
    """Prepare features and labels for training."""
    
    # Feature columns (exclude id and target columns)
    feature_cols = [
        "hook_style_encoded",
        "pacing_encoded",
        "emotional_trigger_encoded",
        "impressions_log",
        "ctr",
        "cvr",
        "cpc",
        "cpm",
        "video_duration_bucket",
        "has_cta_overlay",
        "has_subtitles"
    ]
    
    X = []
    y = []
    
    for row in data:
        features = []
        for col in feature_cols:
            try:
                features.append(float(row.get(col, 0)))
            except (ValueError, TypeError):
                features.append(0.0)
        
        X.append(features)
        
        # Target: binary classification for high performer
        try:
            target = int(float(row.get("target_high_performer", 0)))
        except (ValueError, TypeError):
            target = 0
        y.append(target)
    
    return X, y, feature_cols


def train_test_split(X: List, y: List, test_size: float = 0.2) -> Tuple:
    """Split data into training and test sets."""
    combined = list(zip(X, y))
    random.shuffle(combined)
    
    split_idx = int(len(combined) * (1 - test_size))
    
    train = combined[:split_idx]
    test = combined[split_idx:]
    
    X_train = [x for x, _ in train]
    y_train = [y for _, y in train]
    X_test = [x for x, _ in test]
    y_test = [y for _, y in test]
    
    return X_train, X_test, y_train, y_test


def sigmoid(x: float) -> float:
    """Sigmoid activation function."""
    try:
        return 1 / (1 + math.exp(-max(-500, min(500, x))))
    except OverflowError:
        return 0.0 if x < 0 else 1.0


def relu(x: float) -> float:
    """ReLU activation function."""
    return max(0, x)


class SimpleDeepFM:
    """
    Simplified DeepFM implementation in pure Python.
    For production, replace with actual DeepCTR library.
    """
    
    def __init__(self, n_features: int, embedding_dim: int = 8, hidden_dims: List[int] = [32, 16]):
        self.n_features = n_features
        self.embedding_dim = embedding_dim
        self.hidden_dims = hidden_dims
        
        # Initialize weights randomly
        random.seed(42)
        
        # Linear (FM first-order)
        self.w_linear = [random.gauss(0, 0.01) for _ in range(n_features)]
        self.b_linear = 0.0
        
        # Embeddings (FM second-order)
        self.embeddings = [
            [random.gauss(0, 0.01) for _ in range(embedding_dim)]
            for _ in range(n_features)
        ]
        
        # Deep network
        layer_sizes = [n_features * embedding_dim] + hidden_dims + [1]
        self.deep_weights = []
        self.deep_biases = []
        
        for i in range(len(layer_sizes) - 1):
            w = [
                [random.gauss(0, 0.01) for _ in range(layer_sizes[i + 1])]
                for _ in range(layer_sizes[i])
            ]
            b = [0.0 for _ in range(layer_sizes[i + 1])]
            self.deep_weights.append(w)
            self.deep_biases.append(b)
    
    def _embed(self, x: List[float]) -> List[float]:
        """Get embeddings for input."""
        result = []
        for i, val in enumerate(x):
            for j in range(self.embedding_dim):
                result.append(val * self.embeddings[i][j])
        return result
    
    def _fm_first_order(self, x: List[float]) -> float:
        """FM first-order term."""
        return sum(w * v for w, v in zip(self.w_linear, x)) + self.b_linear
    
    def _fm_second_order(self, x: List[float]) -> float:
        """FM second-order term (simplified)."""
        embedded = self._embed(x)
        
        # Sum of squares - square of sums (simplified pairwise interaction)
        sum_sq = sum(v ** 2 for v in embedded)
        sq_sum = sum(embedded) ** 2
        
        return 0.5 * (sq_sum - sum_sq)
    
    def _deep_forward(self, x: List[float]) -> float:
        """Deep network forward pass."""
        current = self._embed(x)
        
        for i, (w, b) in enumerate(zip(self.deep_weights, self.deep_biases)):
            # Matrix multiplication
            next_layer = list(b)
            for j, row in enumerate(w):
                for k, weight in enumerate(row):
                    next_layer[k] += current[j] * weight
            
            # Activation (ReLU for hidden, none for output)
            if i < len(self.deep_weights) - 1:
                current = [relu(v) for v in next_layer]
            else:
                current = next_layer
        
        return current[0]
    
    def predict_proba(self, x: List[float]) -> float:
        """Predict probability of high performer."""
        fm1 = self._fm_first_order(x)
        fm2 = self._fm_second_order(x)
        deep = self._deep_forward(x)
        
        logit = fm1 + 0.1 * fm2 + deep
        return sigmoid(logit)
    
    def train(self, X: List[List[float]], y: List[int], epochs: int = 10, lr: float = 0.01):
        """Train the model using simple SGD."""
        print(f"\n🎓 Training DeepFM for {epochs} epochs...")
        
        for epoch in range(epochs):
            total_loss = 0.0
            correct = 0
            
            for xi, yi in zip(X, y):
                # Forward pass
                pred = self.predict_proba(xi)
                
                # Binary cross-entropy loss
                eps = 1e-7
                loss = -(yi * math.log(pred + eps) + (1 - yi) * math.log(1 - pred + eps))
                total_loss += abs(loss)
                
                # Simple accuracy
                if (pred > 0.5) == yi:
                    correct += 1
                
                # Gradient descent (simplified - update linear weights only)
                error = pred - yi
                for i in range(len(self.w_linear)):
                    self.w_linear[i] -= lr * error * xi[i]
                self.b_linear -= lr * error
            
            accuracy = correct / len(X)
            avg_loss = total_loss / len(X)
            
            if (epoch + 1) % 2 == 0:
                print(f"   Epoch {epoch + 1}/{epochs}: Loss = {avg_loss:.4f}, Accuracy = {accuracy:.4f}")
        
        print("✅ Training complete!")
    
    def evaluate(self, X: List[List[float]], y: List[int]) -> Dict[str, float]:
        """Evaluate model on test data."""
        correct = 0
        true_positives = 0
        false_positives = 0
        false_negatives = 0
        
        for xi, yi in zip(X, y):
            pred = self.predict_proba(xi)
            pred_class = 1 if pred > 0.5 else 0
            
            if pred_class == yi:
                correct += 1
            
            if pred_class == 1 and yi == 1:
                true_positives += 1
            elif pred_class == 1 and yi == 0:
                false_positives += 1
            elif pred_class == 0 and yi == 1:
                false_negatives += 1
        
        accuracy = correct / len(X)
        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        return {
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1": f1
        }
    
    def save(self, filepath: str):
        """Save model weights to JSON file."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        model_data = {
            "n_features": self.n_features,
            "embedding_dim": self.embedding_dim,
            "hidden_dims": self.hidden_dims,
            "w_linear": self.w_linear,
            "b_linear": self.b_linear,
            "embeddings": self.embeddings,
            "deep_weights": self.deep_weights,
            "deep_biases": self.deep_biases
        }
        
        with open(filepath, "w") as f:
            json.dump(model_data, f)
        
        print(f"✅ Model saved to {filepath}")
    
    @classmethod
    def load(cls, filepath: str) -> "SimpleDeepFM":
        """Load model from JSON file."""
        with open(filepath, "r") as f:
            model_data = json.load(f)
        
        model = cls(
            n_features=model_data["n_features"],
            embedding_dim=model_data["embedding_dim"],
            hidden_dims=model_data["hidden_dims"]
        )
        
        model.w_linear = model_data["w_linear"]
        model.b_linear = model_data["b_linear"]
        model.embeddings = model_data["embeddings"]
        model.deep_weights = model_data["deep_weights"]
        model.deep_biases = model_data["deep_biases"]
        
        return model


def main():
    print("=" * 60)
    print("🧠 DeepFM Training for Ad Performance Prediction")
    print("=" * 60)
    
    # Paths
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
    
    input_path = os.path.join(data_dir, "training_data.csv")
    output_path = os.path.join(models_dir, "deepfm_v2_trained.json")
    
    # Load data
    if not os.path.exists(input_path):
        print(f"❌ Training data not found: {input_path}")
        print("   Run feature_engineering.py first.")
        return
    
    data = load_csv(input_path)
    print(f"✅ Loaded {len(data)} training records")
    
    # Prepare features
    X, y, feature_cols = prepare_data(data)
    print(f"✅ Prepared {len(feature_cols)} features")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
    print(f"✅ Train: {len(X_train)}, Test: {len(X_test)}")
    
    # Initialize model
    model = SimpleDeepFM(
        n_features=len(feature_cols),
        embedding_dim=8,
        hidden_dims=[32, 16]
    )
    
    # Train
    model.train(X_train, y_train, epochs=10, lr=0.01)
    
    # Evaluate
    print("\n📊 Evaluation on test set:")
    metrics = model.evaluate(X_test, y_test)
    for metric, value in metrics.items():
        print(f"   {metric.capitalize()}: {value:.4f}")
    
    # Save model
    model.save(output_path)
    
    # Summary
    print("\n" + "=" * 60)
    print("🎉 Training Complete!")
    print("=" * 60)
    print(f"   Model saved to: {output_path}")
    print(f"   Features: {len(feature_cols)}")
    print(f"   Test Accuracy: {metrics['accuracy']:.2%}")
    print(f"   F1 Score: {metrics['f1']:.2%}")
    
    # Save feature list for inference
    features_path = os.path.join(models_dir, "feature_columns.json")
    with open(features_path, "w") as f:
        json.dump(feature_cols, f)
    print(f"   Features saved to: {features_path}")


if __name__ == "__main__":
    main()
