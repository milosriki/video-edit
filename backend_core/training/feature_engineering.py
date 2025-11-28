"""
Feature Engineering for DeepCTR Training
=========================================
Transforms raw ad data into features suitable for DeepFM/DeepCTR models.

Usage:
    python -m backend_core.training.feature_engineering

Input:
    backend_core/data/historical_ads.csv

Output:
    backend_core/data/training_data.csv
"""

import os
import sys
import csv
from collections import Counter
from typing import Dict, List, Any

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))


def load_csv(filepath: str) -> List[Dict[str, Any]]:
    """Load data from CSV file."""
    with open(filepath, "r", newline="") as f:
        reader = csv.DictReader(f)
        return list(reader)


def save_csv(data: List[Dict[str, Any]], filepath: str):
    """Save data to CSV file."""
    if not data:
        print("❌ No data to save")
        return
    
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    fieldnames = sorted(data[0].keys())
    
    with open(filepath, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    
    print(f"✅ Saved {len(data)} records to {filepath}")


def create_label_encoders(data: List[Dict], categorical_cols: List[str]) -> Dict[str, Dict]:
    """Create label encoders for categorical columns."""
    encoders = {}
    
    for col in categorical_cols:
        unique_values = list(set(row.get(col, "unknown") for row in data))
        encoders[col] = {val: idx for idx, val in enumerate(unique_values)}
    
    return encoders


def engineer_features(row: Dict, encoders: Dict[str, Dict]) -> Dict:
    """Engineer features from a single row of data."""
    
    features = {}
    
    # =========================================
    # CATEGORICAL FEATURES (Sparse)
    # =========================================
    
    categorical_cols = ["hook_style", "pacing", "emotional_trigger"]
    
    for col in categorical_cols:
        value = row.get(col, "unknown")
        encoder = encoders.get(col, {})
        features[f"{col}_encoded"] = encoder.get(value, 0)
    
    # =========================================
    # NUMERICAL FEATURES (Dense)
    # =========================================
    
    # Parse numeric fields with defaults
    def safe_float(val, default=0.0):
        try:
            return float(val) if val else default
        except (ValueError, TypeError):
            return default
    
    def safe_int(val, default=0):
        try:
            return int(float(val)) if val else default
        except (ValueError, TypeError):
            return default
    
    impressions = safe_int(row.get("impressions"), 0)
    clicks = safe_int(row.get("clicks"), 0)
    conversions = safe_int(row.get("conversions"), 0)
    spend = safe_float(row.get("spend"), 0.0)
    revenue = safe_float(row.get("revenue"), 0.0)
    
    # Derived metrics
    ctr = clicks / impressions if impressions > 0 else 0.0
    cvr = conversions / clicks if clicks > 0 else 0.0
    roas = revenue / spend if spend > 0 else 0.0
    cpc = spend / clicks if clicks > 0 else 0.0
    cpm = (spend / impressions) * 1000 if impressions > 0 else 0.0
    
    features["impressions_log"] = safe_float(row.get("impressions"), 1.0)
    if features["impressions_log"] > 0:
        import math
        features["impressions_log"] = math.log1p(features["impressions_log"])
    
    features["ctr"] = ctr
    features["cvr"] = cvr
    features["cpc"] = cpc
    features["cpm"] = cpm
    
    # Video features
    video_duration = safe_int(row.get("video_duration"), 30)
    features["video_duration_bucket"] = min(video_duration // 15, 8)  # 0-8 buckets
    
    # Boolean features
    features["has_cta_overlay"] = 1 if str(row.get("has_cta_overlay", "")).lower() in ["true", "1", "yes"] else 0
    features["has_subtitles"] = 1 if str(row.get("has_subtitles", "")).lower() in ["true", "1", "yes"] else 0
    
    # =========================================
    # TARGET VARIABLE
    # =========================================
    
    # ROAS as primary target (normalized to 0-1 range for binary classification threshold)
    # High performer = ROAS > 2.0
    features["target_roas"] = roas
    features["target_high_performer"] = 1 if roas > 2.0 else 0
    
    # Copy original ID for tracking
    features["ad_id"] = row.get("ad_id", "")
    
    return features


def compute_statistics(data: List[Dict]) -> Dict:
    """Compute dataset statistics for normalization."""
    stats = {}
    
    numeric_cols = ["ctr", "cvr", "cpc", "cpm", "impressions_log", "target_roas"]
    
    for col in numeric_cols:
        values = [float(row.get(col, 0)) for row in data]
        if values:
            mean_val = sum(values) / len(values)
            variance = sum((x - mean_val) ** 2 for x in values) / len(values)
            std_val = variance ** 0.5
            
            stats[col] = {
                "mean": mean_val,
                "std": std_val if std_val > 0 else 1.0,
                "min": min(values),
                "max": max(values)
            }
    
    return stats


def main():
    print("=" * 60)
    print("🔧 Feature Engineering for DeepCTR")
    print("=" * 60)
    
    # Paths
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    input_path = os.path.join(data_dir, "historical_ads.csv")
    output_path = os.path.join(data_dir, "training_data.csv")
    stats_path = os.path.join(data_dir, "feature_stats.csv")
    
    # Load raw data
    if not os.path.exists(input_path):
        print(f"❌ Input file not found: {input_path}")
        print("   Run extract_historical_data.py first.")
        return
    
    raw_data = load_csv(input_path)
    print(f"✅ Loaded {len(raw_data)} records from {input_path}")
    
    # Create label encoders for categorical columns
    categorical_cols = ["hook_style", "pacing", "emotional_trigger"]
    encoders = create_label_encoders(raw_data, categorical_cols)
    
    # Save encoders for inference
    encoders_path = os.path.join(data_dir, "label_encoders.csv")
    encoder_rows = []
    for col, mapping in encoders.items():
        for value, idx in mapping.items():
            encoder_rows.append({"column": col, "value": value, "encoded": idx})
    save_csv(encoder_rows, encoders_path)
    
    # Engineer features
    print("\n🔧 Engineering features...")
    processed_data = []
    
    for row in raw_data:
        features = engineer_features(row, encoders)
        processed_data.append(features)
    
    # Compute and save statistics
    stats = compute_statistics(processed_data)
    stats_rows = []
    for col, stat in stats.items():
        stats_rows.append({
            "column": col,
            "mean": stat["mean"],
            "std": stat["std"],
            "min": stat["min"],
            "max": stat["max"]
        })
    save_csv(stats_rows, stats_path)
    
    # Save processed data
    save_csv(processed_data, output_path)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Feature Engineering Complete!")
    print("=" * 60)
    print(f"   Records processed: {len(processed_data)}")
    print(f"   Features created: {len(processed_data[0]) if processed_data else 0}")
    print(f"   Output file: {output_path}")
    print(f"   Statistics file: {stats_path}")
    print(f"   Encoders file: {encoders_path}")
    
    # Show target distribution
    high_performers = sum(1 for row in processed_data if row.get("target_high_performer") == 1)
    print(f"\n   High performers (ROAS > 2.0): {high_performers} ({100*high_performers/len(processed_data):.1f}%)")


if __name__ == "__main__":
    main()
