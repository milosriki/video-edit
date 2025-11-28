"""
Supabase Client Wrapper for TITAN
Handles all database operations for the memory layer
"""

from __future__ import annotations
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
from dotenv import load_dotenv

load_dotenv(".env.local")

# Import supabase client
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("⚠️ Supabase not installed. Memory features will be limited.")


class TitanSupabaseClient:
    """
    Supabase client wrapper for TITAN memory layer
    
    Tables:
    - historical_campaigns: Campaign performance data
    - analyzed_videos: Video analysis results
    - chat_memory: Conversation history
    - knowledge_base: Learned patterns
    - ad_blueprints: Generated blueprints
    """
    
    def __init__(self):
        self.client: Optional[Client] = None
        self._initialize()
    
    def _initialize(self):
        """Initialize Supabase client"""
        
        if not SUPABASE_AVAILABLE:
            print("⚠️ Supabase client not available")
            return
        
        url = os.environ.get("VITE_SUPABASE_URL")
        key = os.environ.get("VITE_SUPABASE_ANON_KEY")
        
        if not url or not key:
            print("⚠️ Supabase URL or Key missing")
            return
        
        try:
            self.client = create_client(url, key)
            print("✅ Supabase client initialized")
        except Exception as e:
            print(f"❌ Supabase init failed: {e}")
    
    @property
    def is_connected(self) -> bool:
        return self.client is not None
    
    # ==================
    # HISTORICAL CAMPAIGNS
    # ==================
    
    async def get_historical_campaigns(
        self,
        limit: int = 100,
        min_roas: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """Get historical campaign data"""
        
        if not self.client:
            return []
        
        try:
            query = self.client.table("historical_campaigns").select("*")
            
            if min_roas:
                query = query.gte("roas", min_roas)
            
            query = query.order("roas", desc=True).limit(limit)
            
            result = query.execute()
            return result.data if result.data else []
        
        except Exception as e:
            print(f"❌ Failed to get campaigns: {e}")
            return []
    
    async def get_top_performers(
        self,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top performing campaigns by ROAS"""
        
        return await self.get_historical_campaigns(limit=limit, min_roas=2.0)
    
    async def insert_campaign(
        self,
        campaign_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Insert a new campaign record"""
        
        if not self.client:
            return None
        
        try:
            campaign_data["created_at"] = datetime.utcnow().isoformat()
            result = self.client.table("historical_campaigns").insert(campaign_data).execute()
            return result.data[0] if result.data else None
        
        except Exception as e:
            print(f"❌ Failed to insert campaign: {e}")
            return None
    
    # ==================
    # ANALYZED VIDEOS
    # ==================
    
    async def save_video_analysis(
        self,
        video_id: str,
        filename: str,
        analysis: Dict[str, Any],
        prediction: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Save video analysis results"""
        
        if not self.client:
            return None
        
        try:
            data = {
                "id": video_id,
                "filename": filename,
                "analysis": json.dumps(analysis) if isinstance(analysis, dict) else analysis,
                "prediction": json.dumps(prediction) if prediction else None,
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table("analyzed_videos").upsert(data).execute()
            return result.data[0] if result.data else None
        
        except Exception as e:
            print(f"❌ Failed to save analysis: {e}")
            return None
    
    async def get_video_analysis(
        self,
        video_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get analysis for a specific video"""
        
        if not self.client:
            return None
        
        try:
            result = self.client.table("analyzed_videos").select("*").eq("id", video_id).execute()
            if result.data:
                data = result.data[0]
                # Parse JSON fields
                if isinstance(data.get("analysis"), str):
                    data["analysis"] = json.loads(data["analysis"])
                if isinstance(data.get("prediction"), str):
                    data["prediction"] = json.loads(data["prediction"])
                return data
            return None
        
        except Exception as e:
            print(f"❌ Failed to get analysis: {e}")
            return None
    
    async def get_recent_analyses(
        self,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get recent video analyses"""
        
        if not self.client:
            return []
        
        try:
            result = self.client.table("analyzed_videos") \
                .select("*") \
                .order("created_at", desc=True) \
                .limit(limit) \
                .execute()
            
            return result.data if result.data else []
        
        except Exception as e:
            print(f"❌ Failed to get analyses: {e}")
            return []
    
    # ==================
    # CHAT MEMORY
    # ==================
    
    async def save_conversation(
        self,
        conversation_id: str,
        context: Dict[str, Any]
    ) -> bool:
        """Save conversation context"""
        
        if not self.client:
            return False
        
        try:
            data = {
                "id": conversation_id,
                "video_id": context.get("video_id"),
                "messages": json.dumps(context.get("messages", [])),
                "context": json.dumps({
                    "user_preferences": context.get("user_preferences", {}),
                    "historical_context": context.get("historical_context", {}),
                    "video_analysis": context.get("video_analysis")
                }),
                "created_at": context.get("created_at", datetime.utcnow().isoformat()),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            self.client.table("chat_memory").upsert(data).execute()
            return True
        
        except Exception as e:
            print(f"❌ Failed to save conversation: {e}")
            return False
    
    async def get_conversation(
        self,
        conversation_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get conversation context"""
        
        if not self.client:
            return None
        
        try:
            result = self.client.table("chat_memory") \
                .select("*") \
                .eq("id", conversation_id) \
                .execute()
            
            if result.data:
                data = result.data[0]
                # Parse JSON fields
                if isinstance(data.get("messages"), str):
                    data["messages"] = json.loads(data["messages"])
                if isinstance(data.get("context"), str):
                    context = json.loads(data["context"])
                    data["user_preferences"] = context.get("user_preferences", {})
                    data["historical_context"] = context.get("historical_context", {})
                    data["video_analysis"] = context.get("video_analysis")
                return data
            
            return None
        
        except Exception as e:
            print(f"❌ Failed to get conversation: {e}")
            return None
    
    async def get_chat_history(
        self,
        conversation_id: str
    ) -> List[Dict[str, Any]]:
        """Get chat history for a conversation"""
        
        context = await self.get_conversation(conversation_id)
        if context:
            return context.get("messages", [])
        return []
    
    async def get_video_conversations(
        self,
        video_id: str
    ) -> List[Dict[str, Any]]:
        """Get all conversations about a video"""
        
        if not self.client:
            return []
        
        try:
            result = self.client.table("chat_memory") \
                .select("*") \
                .eq("video_id", video_id) \
                .order("created_at", desc=True) \
                .execute()
            
            return result.data if result.data else []
        
        except Exception as e:
            print(f"❌ Failed to get video conversations: {e}")
            return []
    
    # ==================
    # KNOWLEDGE BASE
    # ==================
    
    async def add_pattern(
        self,
        pattern_type: str,
        pattern_value: str,
        performance_data: Dict[str, Any],
        source: str = "historical"
    ) -> Optional[Dict[str, Any]]:
        """Add a pattern to the knowledge base"""
        
        if not self.client:
            return None
        
        try:
            data = {
                "pattern_type": pattern_type,
                "pattern_value": pattern_value,
                "performance_data": json.dumps(performance_data),
                "source": source,
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table("knowledge_base").insert(data).execute()
            return result.data[0] if result.data else None
        
        except Exception as e:
            print(f"❌ Failed to add pattern: {e}")
            return None
    
    async def get_patterns(
        self,
        pattern_type: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get patterns from knowledge base"""
        
        if not self.client:
            return []
        
        try:
            query = self.client.table("knowledge_base").select("*")
            
            if pattern_type:
                query = query.eq("pattern_type", pattern_type)
            
            query = query.order("created_at", desc=True).limit(limit)
            
            result = query.execute()
            
            # Parse JSON fields
            patterns = []
            for item in (result.data or []):
                if isinstance(item.get("performance_data"), str):
                    item["performance_data"] = json.loads(item["performance_data"])
                patterns.append(item)
            
            return patterns
        
        except Exception as e:
            print(f"❌ Failed to get patterns: {e}")
            return []
    
    async def get_winning_patterns(
        self,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get top performing patterns"""
        
        patterns = await self.get_patterns(limit=limit * 2)
        
        # Sort by performance (ROAS if available)
        patterns.sort(
            key=lambda x: x.get("performance_data", {}).get("avg_roas", 0),
            reverse=True
        )
        
        return patterns[:limit]
    
    # ==================
    # AD BLUEPRINTS
    # ==================
    
    async def save_blueprint(
        self,
        blueprint: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Save an ad blueprint"""
        
        if not self.client:
            return None
        
        try:
            data = {
                "id": blueprint.get("id"),
                "video_id": blueprint.get("source_video_id"),
                "blueprint": json.dumps(blueprint),
                "predicted_roas": blueprint.get("predicted_roas"),
                "rank": blueprint.get("rank"),
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = self.client.table("ad_blueprints").insert(data).execute()
            return result.data[0] if result.data else None
        
        except Exception as e:
            print(f"❌ Failed to save blueprint: {e}")
            return None
    
    async def save_blueprints(
        self,
        blueprints: List[Dict[str, Any]]
    ) -> int:
        """Save multiple blueprints"""
        
        saved = 0
        for bp in blueprints:
            result = await self.save_blueprint(bp)
            if result:
                saved += 1
        
        return saved
    
    async def get_blueprints(
        self,
        video_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get blueprints, optionally filtered by video"""
        
        if not self.client:
            return []
        
        try:
            query = self.client.table("ad_blueprints").select("*")
            
            if video_id:
                query = query.eq("video_id", video_id)
            
            query = query.order("rank").limit(limit)
            
            result = query.execute()
            
            # Parse JSON fields
            blueprints = []
            for item in (result.data or []):
                if isinstance(item.get("blueprint"), str):
                    bp = json.loads(item["blueprint"])
                    bp["predicted_roas"] = item.get("predicted_roas")
                    bp["rank"] = item.get("rank")
                    blueprints.append(bp)
                else:
                    blueprints.append(item)
            
            return blueprints
        
        except Exception as e:
            print(f"❌ Failed to get blueprints: {e}")
            return []
    
    async def get_top_blueprints(
        self,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top ranked blueprints by predicted ROAS"""
        
        if not self.client:
            return []
        
        try:
            result = self.client.table("ad_blueprints") \
                .select("*") \
                .order("predicted_roas", desc=True) \
                .limit(limit) \
                .execute()
            
            blueprints = []
            for item in (result.data or []):
                if isinstance(item.get("blueprint"), str):
                    bp = json.loads(item["blueprint"])
                    bp["predicted_roas"] = item.get("predicted_roas")
                    bp["rank"] = item.get("rank")
                    blueprints.append(bp)
            
            return blueprints
        
        except Exception as e:
            print(f"❌ Failed to get top blueprints: {e}")
            return []


# Singleton instance
titan_db = TitanSupabaseClient()
