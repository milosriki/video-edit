"""
Extract Historical Ad Data from Meta/Supabase
=============================================
This script extracts historical ad performance data for DeepCTR training.
Run this locally or on a server with access to your Meta Business account.

Usage:
    python -m backend_core.scripts.extract_historical_data

Output:
    backend_core/data/historical_ads.csv
"""

import os
import sys
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

load_dotenv(".env.local")

def extract_from_supabase():
    """Extract historical ad data from Supabase."""
    try:
        from backend_core.services.supabase_connector import supabase
        
        if not supabase:
            print("❌ Supabase not connected. Cannot extract data.")
            return []
        
        # Query historical ad performance data
        result = supabase.table("ad_performance").select("*").execute()
        
        if result.data:
            print(f"✅ Extracted {len(result.data)} records from Supabase")
            return result.data
        else:
            print("⚠️ No data found in ad_performance table")
            return []
            
    except Exception as e:
        print(f"❌ Error extracting from Supabase: {e}")
        return []


def extract_from_meta_api():
    """
    Extract historical ad data from Meta Marketing API.
    Requires Meta Business credentials.
    """
    meta_access_token = os.getenv("META_ACCESS_TOKEN")
    meta_ad_account_id = os.getenv("META_AD_ACCOUNT_ID")
    
    if not meta_access_token or not meta_ad_account_id:
        print("⚠️ Meta API credentials not configured. Skipping Meta extraction.")
        return []
    
    try:
        import requests
        
        # Meta Marketing API endpoint
        base_url = f"https://graph.facebook.com/v18.0/act_{meta_ad_account_id}/insights"
        
        # Get last 4 years of data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365 * 4)
        
        params = {
            "access_token": meta_access_token,
            "time_range": json.dumps({
                "since": start_date.strftime("%Y-%m-%d"),
                "until": end_date.strftime("%Y-%m-%d")
            }),
            "level": "ad",
            "fields": ",".join([
                "ad_id",
                "ad_name",
                "campaign_name",
                "impressions",
                "clicks",
                "spend",
                "conversions",
                "ctr",
                "cpc",
                "cpm",
                "reach",
                "frequency",
                "date_start",
                "date_stop"
            ]),
            "time_increment": 1  # Daily breakdown
        }
        
        response = requests.get(base_url, params=params)
        
        if response.status_code == 200:
            data = response.json().get("data", [])
            print(f"✅ Extracted {len(data)} records from Meta API")
            return data
        else:
            print(f"❌ Meta API Error: {response.status_code} - {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error extracting from Meta API: {e}")
        return []


def generate_synthetic_data():
    """
    Generate synthetic training data for development/testing.
    Use this when real data is not available.
    """
    import random
    
    print("📊 Generating synthetic training data...")
    
    data = []
    
    # Hook styles and their typical performance
    hook_styles = {
        "Visual Shock": {"base_ctr": 0.045, "base_roas": 2.8},
        "Question": {"base_ctr": 0.038, "base_roas": 2.2},
        "Story": {"base_ctr": 0.042, "base_roas": 2.5},
        "Testimonial": {"base_ctr": 0.035, "base_roas": 3.1},
        "Pattern Interrupt": {"base_ctr": 0.052, "base_roas": 2.4},
    }
    
    pacing_options = ["Fast", "Medium", "Slow"]
    emotional_triggers = ["Fear", "Aspiration", "Urgency", "FOMO", "Trust", "Inspiration"]
    
    for i in range(5000):  # Generate 5000 synthetic records
        hook_style = random.choice(list(hook_styles.keys()))
        base = hook_styles[hook_style]
        
        pacing = random.choice(pacing_options)
        emotion = random.choice(emotional_triggers)
        
        # Add variance based on features
        ctr_multiplier = 1.0
        roas_multiplier = 1.0
        
        if pacing == "Fast":
            ctr_multiplier *= 1.1
        elif pacing == "Slow":
            ctr_multiplier *= 0.85
            
        if emotion in ["Fear", "Urgency", "FOMO"]:
            ctr_multiplier *= 1.15
            roas_multiplier *= 0.95
        elif emotion in ["Trust", "Testimonial"]:
            roas_multiplier *= 1.2
            
        # Add random variance
        ctr = base["base_ctr"] * ctr_multiplier * random.uniform(0.7, 1.4)
        roas = base["base_roas"] * roas_multiplier * random.uniform(0.6, 1.5)
        
        impressions = random.randint(5000, 500000)
        clicks = int(impressions * ctr)
        spend = random.uniform(50, 5000)
        conversions = max(1, int(clicks * random.uniform(0.02, 0.15)))
        revenue = spend * roas
        
        data.append({
            "ad_id": f"synthetic_{i:05d}",
            "hook_style": hook_style,
            "pacing": pacing,
            "emotional_trigger": emotion,
            "impressions": impressions,
            "clicks": clicks,
            "conversions": conversions,
            "spend": round(spend, 2),
            "revenue": round(revenue, 2),
            "ctr": round(ctr, 4),
            "roas": round(roas, 2),
            "video_duration": random.randint(15, 120),
            "has_cta_overlay": random.choice([True, False]),
            "has_subtitles": random.choice([True, False]),
        })
    
    print(f"✅ Generated {len(data)} synthetic records")
    return data


def save_to_csv(data, filename="historical_ads.csv"):
    """Save extracted data to CSV file."""
    import csv
    
    output_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data",
        filename
    )
    
    if not data:
        print("❌ No data to save")
        return
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Get all unique keys from data
    fieldnames = set()
    for record in data:
        fieldnames.update(record.keys())
    fieldnames = sorted(list(fieldnames))
    
    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    
    print(f"✅ Data saved to {output_path}")
    return output_path


def main():
    print("=" * 60)
    print("📊 Historical Ad Data Extraction")
    print("=" * 60)
    
    all_data = []
    
    # Try to extract from Supabase
    supabase_data = extract_from_supabase()
    all_data.extend(supabase_data)
    
    # Try to extract from Meta API
    meta_data = extract_from_meta_api()
    all_data.extend(meta_data)
    
    # If no real data, generate synthetic data for training
    if not all_data:
        print("\n⚠️ No real data found. Generating synthetic data for training...")
        synthetic_data = generate_synthetic_data()
        all_data.extend(synthetic_data)
    
    # Save to CSV
    if all_data:
        output_path = save_to_csv(all_data)
        print(f"\n✅ Extraction complete! {len(all_data)} records saved.")
        print(f"   Output: {output_path}")
    else:
        print("\n❌ No data extracted. Check your configurations.")


if __name__ == "__main__":
    main()
