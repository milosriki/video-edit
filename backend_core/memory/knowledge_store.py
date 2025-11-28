"""
Knowledge Store
Higher-level interface for accessing and managing the knowledge base
"""

from __future__ import annotations
from typing import Dict, Any, List, Optional
from datetime import datetime
from .supabase_client import titan_db


class KnowledgeStore:
    """
    Knowledge Store - Higher-level interface for pattern management
    
    Pattern Types:
    - hook: Opening hooks that work
    - trigger: Emotional triggers
    - structure: Ad structure patterns
    - cta: Call-to-action patterns
    - transformation: Before/after patterns
    - avatar: Target audience patterns
    """
    
    def __init__(self, db=None):
        self.db = db or titan_db
    
    # ==================
    # PATTERN RETRIEVAL
    # ==================
    
    async def get_winning_hooks(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get top performing hook patterns"""
        
        hooks = await self.db.get_patterns(pattern_type="hook", limit=limit)
        
        # Sort by effectiveness
        hooks.sort(
            key=lambda x: x.get("performance_data", {}).get("effectiveness", 0),
            reverse=True
        )
        
        return hooks
    
    async def get_emotional_triggers(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get effective emotional triggers"""
        
        return await self.db.get_patterns(pattern_type="trigger", limit=limit)
    
    async def get_ad_structures(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get proven ad structure patterns"""
        
        return await self.db.get_patterns(pattern_type="structure", limit=limit)
    
    async def get_cta_patterns(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get effective CTA patterns"""
        
        return await self.db.get_patterns(pattern_type="cta", limit=limit)
    
    async def get_all_patterns(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get all pattern types organized"""
        
        return {
            "hooks": await self.get_winning_hooks(),
            "triggers": await self.get_emotional_triggers(),
            "structures": await self.get_ad_structures(),
            "ctas": await self.get_cta_patterns()
        }
    
    # ==================
    # PATTERN ANALYSIS
    # ==================
    
    async def find_matching_patterns(
        self,
        video_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Find patterns that match a video analysis"""
        
        matches = []
        all_patterns = await self.db.get_patterns(limit=100)
        
        # Extract video features
        video_hook_type = video_analysis.get("hook", {}).get("hook_type", "")
        video_triggers = set(video_analysis.get("emotional_triggers", []))
        video_pacing = video_analysis.get("pacing", "")
        
        for pattern in all_patterns:
            score = 0
            reasons = []
            
            pattern_type = pattern.get("pattern_type", "")
            pattern_value = pattern.get("pattern_value", "")
            
            # Match hooks
            if pattern_type == "hook" and video_hook_type:
                if pattern_value.lower() in video_hook_type.lower():
                    score += 30
                    reasons.append("Matching hook type")
            
            # Match triggers
            if pattern_type == "trigger":
                if pattern_value.lower() in [t.lower() for t in video_triggers]:
                    score += 20
                    reasons.append(f"Uses {pattern_value} trigger")
            
            # Match structure
            if pattern_type == "structure":
                perf = pattern.get("performance_data", {})
                if perf.get("pacing", "").lower() == video_pacing.lower():
                    score += 15
                    reasons.append("Matching pacing")
            
            if score > 0:
                matches.append({
                    "pattern": pattern,
                    "match_score": score,
                    "reasons": reasons
                })
        
        # Sort by match score
        matches.sort(key=lambda x: x["match_score"], reverse=True)
        
        return matches[:10]
    
    async def get_recommendations_for_video(
        self,
        video_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get pattern-based recommendations for a video"""
        
        matches = await self.find_matching_patterns(video_analysis)
        all_patterns = await self.get_all_patterns()
        
        recommendations = {
            "matched_patterns": matches,
            "suggested_improvements": []
        }
        
        # Suggest hooks if current hook is weak
        hook = video_analysis.get("hook", {})
        if hook.get("effectiveness_score", 10) < 7:
            top_hooks = all_patterns.get("hooks", [])[:3]
            recommendations["suggested_improvements"].append({
                "area": "hook",
                "current_score": hook.get("effectiveness_score"),
                "suggestions": [h.get("pattern_value") for h in top_hooks],
                "reason": "Hook could be stronger based on historical data"
            })
        
        # Suggest triggers
        video_triggers = video_analysis.get("emotional_triggers", [])
        if len(video_triggers) < 2:
            top_triggers = all_patterns.get("triggers", [])[:5]
            recommendations["suggested_improvements"].append({
                "area": "emotional_triggers",
                "current": video_triggers,
                "suggestions": [t.get("pattern_value") for t in top_triggers],
                "reason": "Adding emotional triggers typically improves engagement"
            })
        
        return recommendations
    
    # ==================
    # PATTERN LEARNING
    # ==================
    
    async def learn_from_campaign(
        self,
        campaign_data: Dict[str, Any]
    ) -> int:
        """Learn patterns from a successful campaign"""
        
        patterns_added = 0
        
        roas = campaign_data.get("roas", 0)
        
        # Only learn from successful campaigns
        if roas < 2.0:
            return 0
        
        # Extract and save hook pattern
        hook_text = campaign_data.get("hook_text")
        if hook_text:
            await self.db.add_pattern(
                pattern_type="hook",
                pattern_value=hook_text,
                performance_data={
                    "roas": roas,
                    "effectiveness": campaign_data.get("hook_score", 7),
                    "campaign_id": campaign_data.get("id")
                },
                source="campaign"
            )
            patterns_added += 1
        
        # Extract emotional triggers
        triggers = campaign_data.get("emotional_triggers", [])
        for trigger in triggers:
            await self.db.add_pattern(
                pattern_type="trigger",
                pattern_value=trigger,
                performance_data={
                    "roas": roas,
                    "campaign_id": campaign_data.get("id")
                },
                source="campaign"
            )
            patterns_added += 1
        
        # Extract CTA pattern
        cta = campaign_data.get("cta_text")
        if cta:
            await self.db.add_pattern(
                pattern_type="cta",
                pattern_value=cta,
                performance_data={
                    "roas": roas,
                    "cta_score": campaign_data.get("cta_score", 7),
                    "campaign_id": campaign_data.get("id")
                },
                source="campaign"
            )
            patterns_added += 1
        
        print(f"📚 KNOWLEDGE: Learned {patterns_added} patterns from campaign")
        return patterns_added
    
    async def add_custom_insight(
        self,
        pattern_type: str,
        pattern_value: str,
        notes: str = ""
    ) -> bool:
        """Add a custom insight to the knowledge base"""
        
        result = await self.db.add_pattern(
            pattern_type=pattern_type,
            pattern_value=pattern_value,
            performance_data={
                "notes": notes,
                "added_at": datetime.utcnow().isoformat()
            },
            source="manual"
        )
        
        return result is not None
    
    # ==================
    # HISTORICAL ANALYSIS
    # ==================
    
    async def get_historical_insights(self) -> Dict[str, Any]:
        """Get insights from historical data"""
        
        campaigns = await self.db.get_historical_campaigns(limit=100)
        
        if not campaigns:
            return {"error": "No historical data available"}
        
        # Calculate aggregates
        total_spend = sum(c.get("spend", 0) for c in campaigns)
        total_revenue = sum(c.get("revenue", 0) for c in campaigns)
        avg_roas = total_revenue / total_spend if total_spend > 0 else 0
        
        # Find best performers
        top_campaigns = sorted(
            campaigns, 
            key=lambda x: x.get("roas", 0), 
            reverse=True
        )[:5]
        
        # Analyze patterns in top performers
        hook_types = {}
        triggers = {}
        
        for campaign in top_campaigns:
            hook = campaign.get("hook_type", "unknown")
            hook_types[hook] = hook_types.get(hook, 0) + 1
            
            for trigger in campaign.get("emotional_triggers", []):
                triggers[trigger] = triggers.get(trigger, 0) + 1
        
        return {
            "summary": {
                "total_campaigns": len(campaigns),
                "total_spend": total_spend,
                "total_revenue": total_revenue,
                "avg_roas": round(avg_roas, 2)
            },
            "top_campaigns": top_campaigns,
            "patterns": {
                "most_common_hooks": sorted(
                    hook_types.items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )[:5],
                "most_common_triggers": sorted(
                    triggers.items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )[:5]
            }
        }
    
    async def compare_to_historical(
        self,
        video_analysis: Dict[str, Any],
        prediction: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Compare a video to historical performance"""
        
        insights = await self.get_historical_insights()
        
        if "error" in insights:
            return insights
        
        predicted_roas = prediction.get("roas_prediction", {}).get("predicted_roas", 0)
        avg_roas = insights["summary"]["avg_roas"]
        
        performance_vs_avg = ((predicted_roas / avg_roas) - 1) * 100 if avg_roas > 0 else 0
        
        return {
            "predicted_roas": predicted_roas,
            "historical_avg_roas": avg_roas,
            "performance_vs_avg": f"{performance_vs_avg:+.1f}%",
            "top_similar_campaigns": insights["top_campaigns"][:3],
            "matching_patterns": await self.find_matching_patterns(video_analysis)
        }


# Singleton instance
knowledge_store = KnowledgeStore()
