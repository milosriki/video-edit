
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import requests
import uvicorn

# --- Configuration ---
# In production, use os.environ.get() for these keys
CREATIFY_KEY = os.environ.get("CREATIFY_API_KEY", "mock_creatify_key")
FB_ACCESS_TOKEN = os.environ.get("FACEBOOK_ACCESS_TOKEN", "mock_fb_token")
HUBSPOT_ACCESS_TOKEN = os.environ.get("HUBSPOT_ACCESS_TOKEN", "mock_hubspot_token")
LTV = 1000.0  # Lifetime Value assumption

app = FastAPI(title="AdAlpha 360 MCP Server")

# --- Mock Data / API Clients ---
# In a real deployment, replace these classes with actual SDK calls (facebook-business, hubspot-api-client)

class FacebookAPI:
    def get_insights(self, ad_id, fields):
        print(f"Fetching Facebook insights for ad_id: {ad_id}")
        # Mock logic: odd IDs are losers, even IDs are winners
        if int(ad_id) % 2 == 0:
            return {"spend": 500.0, "clicks": 150, "video_avg_time_watched": 15}
        else:
            return {"spend": 800.0, "clicks": 500, "video_avg_time_watched": 3}

class HubSpotAPI:
    def search_contacts(self, query):
        print(f"Searching HubSpot contacts with query: {query}")
        # Mock logic: "winner" query returns customers
        if "winner" in query or "even" in query: 
             return {"results": [{"id": "123", "properties": {"lifecyclestage": "customer"}}] * 5}
        return {"results": []}

fb_api = FacebookAPI()
hubspot = HubSpotAPI()

# --- Request Models ---

class AdVerificationRequest(BaseModel):
    ad_id: str
    date_range: str = "last_30d"

class CreativeVariationRequest(BaseModel):
    base_script: str
    hook_style: str

class MarketResearchRequest(BaseModel):
    query: str

# --- Tools (Endpoints) ---

@app.post("/verify_winning_ad")
async def verify_winning_ad(request: AdVerificationRequest):
    """
    Tool 1: The Truth Checker
    Cross-references FB Ad clicks with HubSpot Deal Stages to find REAL ROAS.
    """
    # 1. Get FB Stats
    fb_data = fb_api.get_insights(request.ad_id, fields=['spend', 'clicks', 'video_avg_time_watched'])
    
    # 2. Check HubSpot for Contacts from this Ad Campaign
    # Real logic would use the HubSpot Search API with filters
    hs_leads = hubspot.search_contacts(
        query=f"contacts from ad campaign {request.ad_id} who are customers"
    )
    
    customer_count = len(hs_leads['results'])
    revenue = customer_count * LTV
    real_roi = revenue - fb_data['spend']
    
    return {
        "ad_id": request.ad_id,
        "spend": fb_data['spend'],
        "revenue": revenue,
        "real_roi": real_roi,
        "customer_count": customer_count,
        "winning_pattern": "high_pace_intro" if real_roi > 0 else "none"
    }

@app.post("/generate_creative_variations")
async def generate_creative_variations(request: CreativeVariationRequest):
    """
    Tool 2: The Remixer
    Generates new video ads using Creatify API based on winning script patterns.
    """
    # Call Creatify to generate video
    # In production, this makes a real HTTP POST to Creatify
    
    if CREATIFY_KEY == "mock_creatify_key":
        # Return a mock response if no key is set
        return {
            "status": "success",
            "video_url": "https://mock-creatify-url.com/video_123.mp4",
            "message": "Mock video generated. Set CREATIFY_API_KEY for real generation."
        }

    try:
        response = requests.post(
            "https://api.creatify.ai/api/product_to_videos/gen_video/",
            json={
                "script": request.base_script,
                "style": request.hook_style,
                "aspect_ratio": "9:16"
            },
            headers={"X-API-KEY": CREATIFY_KEY}
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Creatify API Error: {str(e)}")

@app.post("/research_market_trends")
async def research_market_trends(request: MarketResearchRequest):
    """
    Tool 3: The Trend Hunter
    Uses Google Search (simulated or via Gemini) to find current ad trends.
    """
    # In a real implementation, this might call the Custom Search JSON API 
    # or rely on Gemini's built-in grounding if running inside Vertex AI.
    # For this MCP server, we'll simulate a "Trend Report" return.
    
    return {
        "query": request.query,
        "trends": [
            "UGC style testimonials are outperforming polished ads by 40%.",
            "Hooks starting with 'Stop doing this...' are trending in the fitness niche.",
            "ASMR unboxing videos have seen a 20% drop in ROAS."
        ],
        "source": "Google Search (Simulated)"
    }

@app.get("/")
def read_root():
    return {"message": "AdAlpha 360 MCP Server is running. Use /docs for API definition."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
