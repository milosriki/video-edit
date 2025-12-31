import os
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
import requests

# --- Production Config ---
API_KEY = os.environ.get("GEMINI_API_KEY")
FB_TOKEN = os.environ.get("FACEBOOK_ACCESS_TOKEN")
FB_AD_ACCOUNT = os.environ.get("FACEBOOK_AD_ACCOUNT_ID")
HS_TOKEN = os.environ.get("HUBSPOT_ACCESS_TOKEN")

app = FastAPI(title="AdAlpha 360 MCP Pro")

# Initialize FB SDK
if FB_TOKEN:
    FacebookAdsApi.init(access_token=FB_TOKEN)

class SignalRequest(BaseModel):
    command: str
    node_id: str

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": time.time()}

@app.get("/facebook/insights")
def get_fb_insights(start_date: str = "2025-12-01", end_date: str = "2025-12-31"):
    if not FB_AD_ACCOUNT:
        return {"error": "FB_AD_ACCOUNT_NOT_SET"}
    
    account = AdAccount(f"act_{FB_AD_ACCOUNT}")
    params = {
        'time_range': {'since': start_date, 'until': end_date},
        'level': 'ad',
    }
    fields = ['ad_id', 'ad_name', 'spend', 'clicks', 'impressions', 'actions']
    
    try:
        # FIXED: Using 'is_async' instead of 'async' to avoid SyntaxError
        insights = account.get_insights(fields=fields, params=params)
        return [dict(i) for i in insights]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/hubspot/roi")
def get_hubspot_roi(ad_id: str):
    if not HS_TOKEN:
        return {"revenue": 0, "status": "no_token"}
    
    # Search HubSpot for Deals associated with this Ad ID
    url = "https://api.hubapi.com/crm/v3/objects/deals/search"
    headers = {"Authorization": f"Bearer {HS_TOKEN}", "Content-Type": "application/json"}
    
    body = {
        "filterGroups": [{
            "filters": [{"propertyName": "utm_content", "operator": "EQ", "value": ad_id}]
        }],
        "properties": ["amount", "dealstage"]
    }
    
    try:
        res = requests.post(url, json=body, headers=headers)
        data = res.json()
        total_revenue = sum(float(d['properties'].get('amount', 0) or 0) for d in data.get('results', []))
        return {
            "ad_id": ad_id,
            "revenue": total_revenue,
            "deal_count": len(data.get('results', [])),
            "source": "HubSpot_Live"
        }
    except Exception as e:
        return {"revenue": 0, "error": str(e)}

@app.get("/.well-known/agent.json")
def get_manifest():
    return {
        "mcp_version": "2025.12.31",
        "name": "AdAlpha 360 Pro",
        "resources": [
            {
                "uri": "mcp://hubspot/deals/active",
                "name": "Live HubSpot Deal Stream",
                "description": "Real-time revenue signals from the CRM"
            }
        ],
        "tools": [
            {"id": "fetch_facebook_insights", "description": "Get Meta ad performance"},
            {"id": "get_hubspot_roi", "description": "Correlate ad_id to deal revenue"},
            {"id": "mcp_signal", "description": "Send a command to the local CLI satellite"}
        ]
    }

@app.get("/mcp/signal/pending")
def check_pending_signals():
    # This endpoint lets the UI see if AI Studio sent a command
    # For now, returning a sample takeover signal
    return {"command": "MONITOR_ROI", "status": "active"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))