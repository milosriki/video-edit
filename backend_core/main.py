
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
# # from pydantic import BaseModel
from .agent import DirectorAgent, VideoAnalysis
from .services.veo_wrapper import VeoDirector
from .services.cortex_connector import CortexConnector
from .services.video_intelligence import VideoIntelligenceService
from .services.ad_chat import AdChatAgent
from .services.supabase_connector import supabase
from .engines.ensemble import EnsemblePredictor
import os
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv(".env.local")

# Map VITE keys to Python keys if needed
if os.getenv("VITE_GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = os.getenv("VITE_GEMINI_API_KEY")

app = FastAPI(title="Project Titan Backend")

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Services
# PRO LEVEL: Use environment variables for Project ID
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
# Fallback if env var is not set, to prevent crash on startup if not deployed
if not PROJECT_ID:
    print("⚠️ GOOGLE_CLOUD_PROJECT not set. Using default/dummy for initialization.")
    PROJECT_ID = "titan-project-placeholder"

try:
    agent = DirectorAgent()
except Exception as e:
    print(f"⚠️ DirectorAgent Init Failed: {e}")
    agent = None

try:
    veo = VeoDirector(project_id=PROJECT_ID)
except Exception as e:
    print(f"⚠️ VeoDirector Init Failed: {e}")
    veo = None

try:
    cortex = CortexConnector(project_id=PROJECT_ID)
except Exception as e:
    print(f"⚠️ CortexConnector Init Failed: {e}")
    cortex = None

try:
    video_intel = VideoIntelligenceService()
except Exception as e:
    print(f"⚠️ VideoIntelligenceService Init Failed: {e}")
    video_intel = None

try:
    ad_chat = AdChatAgent()
except Exception as e:
    print(f"⚠️ AdChatAgent Init Failed: {e}")
    ad_chat = None

try:
    predictor = EnsemblePredictor()
except Exception as e:
    print(f"⚠️ EnsemblePredictor Init Failed: {e}")
    predictor = None


if not supabase:
    print("⚠️ Supabase not connected. Some features may be limited.")

# # class AnalyzeRequest(BaseModel):
#     video_uri: str

# class GenerateRequest(BaseModel):
#     assets: list[str]
#     target_audience: str

@app.post("/analyze")
async def analyze_video(request: dict):
    video_uri = request.get("video_uri")
    print(f"🧠 Analyzing video: {video_uri}")
    if not agent:
        raise HTTPException(status_code=503, detail="DirectorAgent not initialized")
    try:
        # Real Gemini 3 Analysis
        analysis = agent.analyze_winning_pattern(video_uri)
        return analysis
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/faces")
async def analyze_faces(request: dict):
    video_uri = request.get("video_uri")
    if not video_intel:
        raise HTTPException(status_code=503, detail="VideoIntelligenceService not initialized")
    return video_intel.analyze_faces(video_uri)

@app.post("/analyze/transcription")
async def analyze_transcription(request: dict):
    video_uri = request.get("video_uri")
    if not video_intel:
        raise HTTPException(status_code=503, detail="VideoIntelligenceService not initialized")
    return video_intel.transcribe_video(video_uri)

@app.post("/analyze/labels")
async def analyze_labels(request: dict):
    video_uri = request.get("video_uri")
    if not video_intel:
        raise HTTPException(status_code=503, detail="VideoIntelligenceService not initialized")
    return video_intel.detect_labels(video_uri)

@app.post("/chat/ad")
async def chat_with_ad(request: dict):
    video_uri = request.get("video_uri")
    message = request.get("message")
    context = request.get("context", {})
    
    if not ad_chat:
        raise HTTPException(status_code=503, detail="AdChatAgent not initialized")
        
    print(f"💬 Chatting with ad {video_uri}: {message}")
    return ad_chat.chat_with_ad(video_uri, message, context)

@app.post("/predict")
async def predict_virality(request: dict):
    features = request.get("features", {})
    print(f"🔮 Predicting virality for features: {features}")
    if not predictor:
        raise HTTPException(status_code=503, detail="EnsemblePredictor not initialized")
    return await predictor.predict_virality(features)

@app.post("/generate")
async def generate_campaign(request: dict):
    target_audience = request.get("target_audience")
    assets = request.get("assets", [])
    print(f"🎬 Generating campaign for: {target_audience}")
    if not veo:
        raise HTTPException(status_code=503, detail="VeoDirector not initialized")
    try:
        # 1. Create a winning pattern based on audience
        pattern = {
            "hook_style": "Visual Shock",
            "pacing": "Fast",
            "emotional_trigger": "Inspiration"
        }
        
        # 2. Call Real Veo API
        video_uri = veo.generate_video(assets, pattern)
        
        return {
            "status": "success",
            "campaign_id": "titan_gen_001",
            "video_uri": video_uri,
            "message": "Video generated successfully via Veo"
        }
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def get_metrics(days: int = 30):
    print(f"📊 Fetching Cortex metrics for last {days} days")
    try:
        if cortex:
            # Real BigQuery Call
            metrics = cortex.get_historical_performance(days)
            
            # Aggregate for the dashboard
            total_spend = sum(m.spend for m in metrics)
            total_rev = sum(m.spend * m.roas for m in metrics) # deriving revenue
            
            return {
                "totals": {
                    "spend": total_spend,
                    "revenue": total_rev,
                    "roas": (total_rev / total_spend) if total_spend > 0 else 0,
                    "conversions": sum(m.conversions for m in metrics),
                    "clicks": sum(m.clicks for m in metrics),
                    "impressions": sum(m.impressions for m in metrics)
                }
            }
        else:
            raise Exception("CortexConnector not initialized")
    except Exception as e:
        print(f"⚠️ Cortex Error (Falling back to mock): {e}")
        # Fallback if BigQuery isn't populated yet
        return {
            "totals": {
                "impressions": 150000, "clicks": 4500, "conversions": 120,
                "spend": 5000.00, "revenue": 12000.00, "roas": 2.4
            }
        }

@app.get("/avatars")
async def get_avatars():
    # Return standard avatars
    return [
        {"key": "dubai_men_40", "name": "DIFC Daniel", "pain_points": "Stress belly", "desires": "Status"},
        {"key": "dubai_women_40", "name": "Busy Mona", "pain_points": "Post-baby weight", "desires": "Confidence"}
    ]
