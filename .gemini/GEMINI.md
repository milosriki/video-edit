# PTD COMMAND CENTER: ARCHITECTURAL_STATE_SNAPSHOT

## 🧠 Core Goal
Unified "Super-Intelligence Command Center" integrating Meta Ads, HubSpot CRM revenue data, and Bayesian ML Scaling models.

## 🛠️ Stack Status
- **Frontend:** React 19 (Desktop/video-edit). Deployed to Cloud Run: `ptd-command-center-pro`.
- **Backend:** FastAPI (ad_alpha_mcp). Deployed to Cloud Run: `ad-alpha-mcp`.
- **MCP Mesh:** Manifest live at `/.well-known/agent.json`.
- **Primary Tools:** `fetch_facebook_insights`, `get_hubspot_roi`, `verify_winning_ad`.

## 🛰️ Production Endpoints
- **UI:** https://ptd-command-center-pro-489769736562.us-central1.run.app
- **API:** https://ad-alpha-mcp-489769736562.us-central1.run.app

## 📋 Operational Context
- **Truth ROAS:** Calculated by joining Facebook Ad IDs with HubSpot Deal revenue.
- **Scaling:** Uses Thompson Sampling (Bayesian winning probability).
- **Environment:** Node 22, Vite 6, Tailwind CSS.

## 🎯 Current Plan
1. [DONE] Consolidated all tools into unified MCP.
2. [DONE] Fixed Port 8080 binding for Cloud Run.
3. [DONE] Renamed Desktop folder to 'video-edit' for GitHub sync.
4. [TODO] Initialize 'Thinking Mode' scaling test in AI Studio.
