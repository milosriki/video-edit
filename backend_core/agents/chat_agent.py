"""
CHAT AGENT 💬
Purpose: Proactive intelligence with memory
- Chat about any video/ad
- Remember all conversations (persistent memory)
- Proactive suggestions based on user's historical data
- Learn preferences over time
"""

from __future__ import annotations
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
from ..config import GEMINI_FLASH_MODEL_ID, API_VERSION


class ChatMessage(BaseModel):
    """Individual chat message"""
    role: str = Field(..., description="user or assistant")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")


class ProactiveInsight(BaseModel):
    """Proactive suggestion from the agent"""
    insight_type: str = Field(..., description="performance, optimization, trend, warning")
    title: str = Field(..., description="Short title")
    description: str = Field(..., description="Detailed description")
    action: Optional[str] = Field(None, description="Suggested action")
    priority: str = Field(default="medium", description="low, medium, high, urgent")
    related_video_id: Optional[str] = Field(None, description="Related video if any")


class ChatResponse(BaseModel):
    """Response from the chat agent"""
    response: str = Field(..., description="Main response text")
    suggested_actions: List[str] = Field(default_factory=list, description="Suggested next steps")
    insights: List[ProactiveInsight] = Field(default_factory=list, description="Proactive insights")
    context_updated: bool = Field(default=False, description="Whether context was updated")


class ConversationContext(BaseModel):
    """Conversation context with memory"""
    conversation_id: str
    video_id: Optional[str] = None
    video_analysis: Optional[Dict[str, Any]] = None
    user_preferences: Dict[str, Any] = Field(default_factory=dict)
    historical_context: Dict[str, Any] = Field(default_factory=dict)
    messages: List[ChatMessage] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ChatAgentV2:
    """
    CHAT AGENT 💬
    Conversational AI with persistent memory and proactive intelligence
    """
    
    def __init__(self, memory_store=None):
        self.client = genai.Client(http_options={'api_version': API_VERSION})
        self.model_id = GEMINI_FLASH_MODEL_ID
        self.memory_store = memory_store  # Supabase connection
        
        # In-memory conversation cache (for active sessions)
        self.active_conversations: Dict[str, ConversationContext] = {}
    
    async def chat(
        self,
        message: str,
        conversation_id: str,
        video_id: Optional[str] = None,
        video_analysis: Optional[Dict[str, Any]] = None,
        user_context: Optional[Dict[str, Any]] = None
    ) -> ChatResponse:
        """
        Process a chat message with memory
        
        Args:
            message: User's message
            conversation_id: Unique conversation ID
            video_id: Optional video being discussed
            video_analysis: Optional video analysis data
            user_context: Optional additional context
            
        Returns:
            ChatResponse with AI response and insights
        """
        
        # Get or create conversation context
        context = await self._get_conversation_context(
            conversation_id, video_id, video_analysis
        )
        
        # Add user message to history
        user_msg = ChatMessage(role="user", content=message)
        context.messages.append(user_msg)
        
        # Build prompt with context
        prompt = self._build_prompt(message, context, user_context)
        
        # Get AI response
        response = await self._get_ai_response(prompt, context)
        
        # Add assistant message to history
        assistant_msg = ChatMessage(
            role="assistant", 
            content=response.response,
            metadata={"insights_count": len(response.insights)}
        )
        context.messages.append(assistant_msg)
        
        # Update context
        context.updated_at = datetime.utcnow()
        
        # Save to memory store
        await self._save_conversation(context)
        
        return response
    
    async def get_proactive_insights(
        self,
        user_id: str,
        historical_data: Optional[Dict[str, Any]] = None
    ) -> List[ProactiveInsight]:
        """
        Generate proactive insights based on historical data
        
        This is called on dashboard load to provide useful suggestions
        """
        
        insights = []
        
        if not historical_data:
            return insights
        
        # Analyze historical patterns
        prompt = f"""
        Analyze this user's historical ad performance data and generate proactive insights:
        
        Historical Data:
        {json.dumps(historical_data, indent=2, default=str)}
        
        Generate 3-5 actionable insights about:
        1. Performance trends
        2. Optimization opportunities
        3. Potential issues to address
        4. Recommendations based on patterns
        
        Return as JSON array with insight_type, title, description, action, priority.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            if response.text:
                data = json.loads(response.text)
                if isinstance(data, list):
                    for item in data:
                        insights.append(ProactiveInsight(**item))
        
        except Exception as e:
            print(f"⚠️ CHAT: Proactive insights generation failed: {e}")
        
        return insights
    
    async def learn_preferences(
        self,
        conversation_id: str,
        preference_type: str,
        preference_value: Any
    ) -> bool:
        """
        Learn and store user preferences from interactions
        """
        
        if conversation_id in self.active_conversations:
            context = self.active_conversations[conversation_id]
            context.user_preferences[preference_type] = preference_value
            context.updated_at = datetime.utcnow()
            
            await self._save_conversation(context)
            return True
        
        return False
    
    async def get_conversation_history(
        self,
        conversation_id: str,
        limit: int = 50
    ) -> List[ChatMessage]:
        """
        Get conversation history
        """
        
        # Check cache first
        if conversation_id in self.active_conversations:
            return self.active_conversations[conversation_id].messages[-limit:]
        
        # Load from memory store
        if self.memory_store:
            try:
                history = await self.memory_store.get_chat_history(conversation_id)
                return history[-limit:]
            except Exception as e:
                print(f"⚠️ CHAT: Failed to load history: {e}")
        
        return []
    
    async def _get_conversation_context(
        self,
        conversation_id: str,
        video_id: Optional[str],
        video_analysis: Optional[Dict[str, Any]]
    ) -> ConversationContext:
        """Get or create conversation context"""
        
        # Check cache
        if conversation_id in self.active_conversations:
            context = self.active_conversations[conversation_id]
            
            # Update video context if new video
            if video_id and video_id != context.video_id:
                context.video_id = video_id
                context.video_analysis = video_analysis
            
            return context
        
        # Try to load from memory store
        if self.memory_store:
            try:
                stored_context = await self.memory_store.get_conversation(conversation_id)
                if stored_context:
                    context = ConversationContext(**stored_context)
                    self.active_conversations[conversation_id] = context
                    return context
            except Exception as e:
                print(f"⚠️ CHAT: Failed to load context: {e}")
        
        # Create new context
        context = ConversationContext(
            conversation_id=conversation_id,
            video_id=video_id,
            video_analysis=video_analysis
        )
        
        self.active_conversations[conversation_id] = context
        return context
    
    def _build_prompt(
        self,
        message: str,
        context: ConversationContext,
        user_context: Optional[Dict[str, Any]]
    ) -> str:
        """Build the prompt with full context"""
        
        # System prompt
        system = """You are TITAN, an expert AI ad strategist with access to $2M worth of historical campaign data.
        
You help users:
- Analyze video ads for performance potential
- Generate winning ad variations
- Understand what makes ads successful
- Optimize their creative strategy

Be concise, actionable, and data-driven. Reference historical patterns when relevant.
"""
        
        # Video context
        video_ctx = ""
        if context.video_analysis:
            video_ctx = f"""
Current Video Analysis:
- Hook: {context.video_analysis.get('hook', {})}
- Pacing: {context.video_analysis.get('pacing', 'unknown')}
- Strengths: {context.video_analysis.get('strengths', [])}
- Weaknesses: {context.video_analysis.get('weaknesses', [])}
"""
        
        # Conversation history (last 10 messages)
        history = ""
        if context.messages:
            recent = context.messages[-10:]
            history = "Recent conversation:\n"
            for msg in recent:
                history += f"{msg.role.upper()}: {msg.content}\n"
        
        # User preferences
        prefs = ""
        if context.user_preferences:
            prefs = f"\nUser preferences: {json.dumps(context.user_preferences)}"
        
        # Additional context
        extra = ""
        if user_context:
            extra = f"\nAdditional context: {json.dumps(user_context)}"
        
        return f"""{system}

{video_ctx}
{history}
{prefs}
{extra}

USER: {message}

Respond helpfully. Include suggested_actions for next steps. If you notice patterns or opportunities, include them as insights.
"""
    
    async def _get_ai_response(
        self,
        prompt: str,
        context: ConversationContext
    ) -> ChatResponse:
        """Get response from Gemini"""
        
        try:
            # Use JSON schema dict for Gemini compatibility
            response_schema_dict = {
                "type": "object",
                "properties": {
                    "response": {"type": "string"},
                    "suggested_actions": {"type": "array", "items": {"type": "string"}},
                    "insights": {"type": "array", "items": {"type": "object"}}
                },
                "required": ["response"]
            }
            
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[prompt],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=response_schema_dict
                )
            )
            
            if response.text:
                data = json.loads(response.text)
                return ChatResponse(**data)
        
        except Exception as e:
            print(f"❌ CHAT: AI response failed: {e}")
        
        # Fallback response
        return ChatResponse(
            response="I apologize, but I encountered an error processing your request. Please try again.",
            suggested_actions=["Retry your question", "Rephrase your request"],
            insights=[]
        )
    
    async def _save_conversation(self, context: ConversationContext):
        """Save conversation to memory store"""
        
        if not self.memory_store:
            return
        
        try:
            await self.memory_store.save_conversation(
                context.conversation_id,
                context.model_dump()
            )
        except Exception as e:
            print(f"⚠️ CHAT: Failed to save conversation: {e}")
    
    async def summarize_conversation(
        self,
        conversation_id: str
    ) -> Optional[str]:
        """Generate a summary of the conversation"""
        
        context = self.active_conversations.get(conversation_id)
        if not context or len(context.messages) < 3:
            return None
        
        messages_text = "\n".join([
            f"{m.role}: {m.content}" 
            for m in context.messages
        ])
        
        prompt = f"""
        Summarize this conversation in 2-3 sentences:
        
        {messages_text}
        
        Focus on key decisions, insights, and action items.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[prompt]
            )
            
            return response.text if response.text else None
        
        except Exception as e:
            print(f"⚠️ CHAT: Summary generation failed: {e}")
            return None
