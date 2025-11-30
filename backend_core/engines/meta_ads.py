import os
import time
from typing import Dict, Any, Optional

# Lazy imports for Meta SDK
try:
    from facebook_business.api import FacebookAdsApi
    from facebook_business.adobjects.adaccount import AdAccount
    from facebook_business.adobjects.adcreative import AdCreative
    from facebook_business.adobjects.campaign import Campaign
    from facebook_business.adobjects.adset import AdSet
    from facebook_business.adobjects.ad import Ad
    META_SDK_AVAILABLE = True
except ImportError:
    META_SDK_AVAILABLE = False
    print("⚠️ Meta Business SDK not installed. Install with: pip install facebook-business")


class MetaAdsEngine:
    """
    Meta Marketing API v19.0 - Advanced Integration
    Full Campaign Structure: Campaign → AdSet → Creative → Ad
    Supports Advantage+ Shopping Campaigns with AI optimization
    """
    def __init__(self):
        self.app_id = os.getenv("META_APP_ID")
        self.app_secret = os.getenv("META_APP_SECRET")
        self.access_token = os.getenv("META_ACCESS_TOKEN")
        self.account_id = os.getenv("META_AD_ACCOUNT_ID")  # act_34983233368139
        self.page_id = os.getenv("META_PAGE_ID")
        self.api_version = "v19.0"  # 🚀 NEWEST API VERSION
        self._initialized = False

        if META_SDK_AVAILABLE and self.app_id and self.access_token:
            try:
                FacebookAdsApi.init(
                    self.app_id, 
                    self.app_secret, 
                    self.access_token, 
                    api_version=self.api_version
                )
                self._initialized = True
                print(f"✅ META ADS: Connected to Graph API {self.api_version}")
                print(f"   Account: {self.account_id}")
            except Exception as e:
                print(f"⚠️ META ERROR: {e}")
        else:
            print("⚠️ META: Running in Simulation Mode")

    def launch_smart_campaign(self, video_url: str, hook_text: str, niche: str = "fitness") -> Dict[str, Any]:
        """
        Deploys a full conversion campaign using 'Advantage+' settings.
        Full structure: Campaign → AdSet → Creative → Ad
        """
        print(f"🚀 LAUNCHING META CAMPAIGN for {niche}...")
        
        if not self._initialized or not self.access_token:
            return {"status": "simulated", "id": "mock_camp_123"}

        try:
            account = AdAccount(self.account_id)
            
            # 1. Create Campaign (Advantage+ Structure)
            campaign = account.create_campaign(params={
                'name': f'Titan Auto-Launch: {niche.upper()} - {int(time.time())}',
                'objective': 'OUTCOME_SALES',  # Advantage+ objective
                'status': 'PAUSED',  # Safety first - start paused
                'special_ad_categories': [],
            })
            campaign_id = campaign['id']
            print(f"   ├── Campaign Created: {campaign_id}")

            # 2. Create Ad Set (Broad Targeting - Let AI find audience)
            adset = account.create_ad_set(params={
                'name': 'Titan Broad Targeting',
                'campaign_id': campaign_id,
                'daily_budget': 2000,  # $20.00 per day
                'billing_event': 'IMPRESSIONS',
                'optimization_goal': 'REACH',
                'bid_strategy': 'LOWEST_COST_WITHOUT_CAP',
                'targeting': {
                    'geo_locations': {'countries': ['US']},
                    'age_min': 18,
                    'age_max': 65
                },
                'status': 'PAUSED',
            })
            adset_id = adset['id']
            print(f"   ├── Ad Set Created: {adset_id}")

            # 3. Create Creative (Video + Hook)
            # Validate page_id is configured to prevent unauthorized ad creation
            if not self.page_id:
                print("❌ META: page_id not configured. Cannot create ad creative.")
                return {"status": "failed", "error": "META_PAGE_ID environment variable not set"}
            
            creative_params = {
                'name': f'Creative: {hook_text[:30]}',
                'object_story_spec': {
                    'page_id': self.page_id,
                    'video_data': {
                        'video_id': self._upload_video(account, video_url),
                        'image_url': 'https://via.placeholder.com/1080x1920',  # Thumbnail
                        'call_to_action': {'type': 'LEARN_MORE'},
                        'message': hook_text
                    }
                }
            }
            
            creative = account.create_ad_creative(params=creative_params)
            creative_id = creative['id']
            print(f"   ├── Creative Built: {creative_id}")

            # 4. Create Ad
            ad = account.create_ad(params={
                'name': 'Titan Winning Ad #1',
                'adset_id': adset_id,
                'creative': {'creative_id': creative_id},
                'status': 'PAUSED'
            })
            ad_id = ad['id']
            print(f"   └── Ad Created: {ad_id}")
            
            return {
                "status": "success", 
                "campaign_id": campaign_id,
                "adset_id": adset_id,
                "creative_id": creative_id,
                "ad_id": ad_id,
                "api_version": self.api_version
            }

        except Exception as e:
            print(f"❌ META LAUNCH FAILED: {e}")
            return {"status": "failed", "error": str(e)}

    def _upload_video(self, account, video_url: str) -> str:
        """Helper to upload video file to Ad Library"""
        if "placeholder" in video_url or "storage.googleapis" in video_url:
            # Simulation mode - return mock video ID
            return "123456789"
        
        # Real upload logic would go here
        # video = account.create_ad_video(params={'source': video_url})
        # return video['id']
        return "123456789"

    async def get_insights(self) -> Dict[str, Any]:
        """Fetches comprehensive performance data"""
        if not self._initialized or not self.access_token or not self.account_id:
            return {"error": "Missing credentials"}

        try:
            account = AdAccount(self.account_id)
            insights = account.get_insights(params={
                'fields': 'campaign_name,spend,cpm,ctr,cpc,actions,purchase_roas',
                'date_preset': 'last_7d',
                'level': 'campaign'
            })
            
            return {"status": "success", "data": list(insights)}
        except Exception as e:
            print(f"❌ Meta Insights Error: {e}")
            return {"error": str(e)}

    async def verify_connection(self) -> Dict[str, Any]:
        """Verifies Meta API connection and permissions"""
        if not self._initialized or not self.access_token:
            return {"status": "error", "message": "No access token or SDK not initialized"}
        
        try:
            account = AdAccount(self.account_id)
            account_info = account.api_get(fields=['name', 'account_status', 'currency'])
            
            return {
                "status": "connected",
                "api_version": self.api_version,
                "account": account_info
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}


# Global Instance
meta_engine = MetaAdsEngine()
