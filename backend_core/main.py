from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .agent import DirectorAgent, VideoAnalysis
import os

app = FastAPI(title="Project Titan Backend")

# Initialize Agent
# We initialize it here. In a real app, we might use lifespan events.
try:
    agent = DirectorAgent()
except Exception as e:
    print(f"Warning: Failed to initialize DirectorAgent. Check GOOGLE_API_KEY. Error: {e}")
    agent = None

class AnalyzeRequest(BaseModel):
    video_uri: str

@app.post("/analyze", response_model=VideoAnalysis)
async def analyze_video(request: AnalyzeRequest):
    if not agent:
        raise HTTPException(status_code=503, detail="DirectorAgent not initialized")
    
    try:
        analysis = agent.analyze_winning_pattern(request.video_uri)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class GenerateRequest(BaseModel):
    assets: list[str]
    target_audience: str

@app.post("/generate")
async def generate_campaign(request: GenerateRequest):
    # In a real app, we would use VeoDirector here
    # from .services.veo_wrapper import VeoDirector
    # director = VeoDirector(project_id="...")
    # video_uri = director.generate_video(request.assets, {"hook_style": "Viral", "pacing": "Fast"})
    
    # For now, return a mock response to satisfy the frontend
    return {
        "status": "success",
        "campaign_id": "camp_123",
        "video_uri": "gs://cortex-marketing-data/generated/video_123.mp4",
        "message": "Campaign generation started"
    }

@app.get("/metrics")
async def get_metrics(days: int = 30):
    # In a real app, we would use CortexConnector here
    # from .services.cortex_connector import CortexConnector
    # connector = CortexConnector()
    # metrics = connector.get_historical_performance(days)
    
    # Mock response for frontend dashboard
    return {
        "totals": {
            "impressions": 150000,
            "clicks": 4500,
            "conversions": 120,
            "spend": 5000.00,
            "revenue": 12000.00,
            "ctr": 0.03,
            "cvr": 0.026,
            "cpa": 41.66,
            "roas": 2.4
        }
    }


@app.get("/")
async def root():
    return {"message": "Project Titan Backend is running"}
