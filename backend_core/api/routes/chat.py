"""
Chat Routes
POST /api/chat - Send message, get response with memory
GET /api/chat/history/{video_id} - Get conversation history
POST /api/chat/proactive - Get proactive suggestions
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid

from ...agents.chat_agent import ChatAgentV2, ChatResponse, ProactiveInsight
from ...memory.supabase_client import titan_db

router = APIRouter(prefix="/api", tags=["chat"])

# Initialize Chat Agent
try:
    chat_agent = ChatAgentV2(memory_store=titan_db)
except Exception as e:
    print(f"⚠️ ChatAgentV2 init failed: {e}")
    chat_agent = None


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    video_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ChatMessageResponse(BaseModel):
    conversation_id: str
    response: str
    suggested_actions: List[str]
    insights: List[Dict[str, Any]]


class ProactiveRequest(BaseModel):
    user_id: str = "default"
    include_historical: bool = True


@router.post("/chat", response_model=ChatMessageResponse)
async def send_message(request: ChatRequest):
    """
    Send a message to the AI assistant
    
    - Maintains conversation memory
    - Context-aware responses
    - Returns suggested actions and insights
    """
    
    if not chat_agent:
        raise HTTPException(status_code=503, detail="ChatAgent not initialized")
    
    # Generate conversation ID if not provided
    conversation_id = request.conversation_id or str(uuid.uuid4())
    
    # Get video analysis if video_id provided
    video_analysis = None
    if request.video_id:
        video_data = await titan_db.get_video_analysis(request.video_id)
        if video_data:
            video_analysis = video_data.get("analysis")
    
    try:
        print(f"💬 Chat message: {request.message[:50]}...")
        
        response = await chat_agent.chat(
            message=request.message,
            conversation_id=conversation_id,
            video_id=request.video_id,
            video_analysis=video_analysis,
            user_context=request.context
        )
        
        return ChatMessageResponse(
            conversation_id=conversation_id,
            response=response.response,
            suggested_actions=response.suggested_actions,
            insights=[i.model_dump() for i in response.insights]
        )
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/history/{conversation_id}")
async def get_chat_history(conversation_id: str, limit: int = 50):
    """
    Get conversation history
    """
    
    if not chat_agent:
        # Fallback to direct database query
        history = await titan_db.get_chat_history(conversation_id)
        return {
            "conversation_id": conversation_id,
            "messages": history[-limit:]
        }
    
    history = await chat_agent.get_conversation_history(conversation_id, limit)
    
    return {
        "conversation_id": conversation_id,
        "messages": [msg.model_dump() if hasattr(msg, 'model_dump') else msg for msg in history]
    }


@router.get("/chat/video/{video_id}")
async def get_video_conversations(video_id: str):
    """
    Get all conversations about a specific video
    """
    
    conversations = await titan_db.get_video_conversations(video_id)
    
    return {
        "video_id": video_id,
        "count": len(conversations),
        "conversations": conversations
    }


@router.post("/chat/proactive")
async def get_proactive_suggestions(request: ProactiveRequest):
    """
    Get proactive insights and suggestions
    
    Called on dashboard load to provide useful intelligence
    """
    
    if not chat_agent:
        return {
            "insights": [],
            "error": "ChatAgent not initialized"
        }
    
    try:
        # Gather historical data for analysis
        historical_data = {}
        
        if request.include_historical:
            # Get recent campaigns
            campaigns = await titan_db.get_historical_campaigns(limit=20)
            historical_data["recent_campaigns"] = campaigns
            
            # Get recent analyses
            analyses = await titan_db.get_recent_analyses(limit=10)
            historical_data["recent_analyses"] = analyses
            
            # Get top patterns
            from ...memory.knowledge_store import knowledge_store
            insights = await knowledge_store.get_historical_insights()
            historical_data["pattern_insights"] = insights
        
        # Generate proactive insights
        suggestions = await chat_agent.get_proactive_insights(
            user_id=request.user_id,
            historical_data=historical_data
        )
        
        return {
            "user_id": request.user_id,
            "insights": [s.model_dump() for s in suggestions]
        }
        
    except Exception as e:
        print(f"❌ Proactive suggestions error: {e}")
        return {
            "insights": [],
            "error": str(e)
        }


@router.post("/chat/learn")
async def learn_preference(
    conversation_id: str,
    preference_type: str,
    preference_value: str
):
    """
    Learn a user preference from the conversation
    """
    
    if not chat_agent:
        raise HTTPException(status_code=503, detail="ChatAgent not initialized")
    
    success = await chat_agent.learn_preferences(
        conversation_id=conversation_id,
        preference_type=preference_type,
        preference_value=preference_value
    )
    
    return {
        "success": success,
        "preference_type": preference_type
    }


@router.get("/chat/summary/{conversation_id}")
async def get_conversation_summary(conversation_id: str):
    """
    Get an AI-generated summary of a conversation
    """
    
    if not chat_agent:
        raise HTTPException(status_code=503, detail="ChatAgent not initialized")
    
    summary = await chat_agent.summarize_conversation(conversation_id)
    
    if not summary:
        return {
            "conversation_id": conversation_id,
            "summary": None,
            "note": "Not enough messages to summarize"
        }
    
    return {
        "conversation_id": conversation_id,
        "summary": summary
    }
