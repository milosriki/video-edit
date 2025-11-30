import os
import asyncio
from typing import Dict, Any, List, Optional

# Lazy imports for AutoGen
try:
    from autogen_agentchat.agents import AssistantAgent, UserProxyAgent
    from autogen_ext.models.openai import OpenAIChatCompletionClient
    from autogen_agentchat.messages import TextMessage
    AUTOGEN_AVAILABLE = True
except ImportError:
    AUTOGEN_AVAILABLE = False
    print("⚠️ AutoGen not installed. Install with: pip install autogen-agentchat autogen-ext")

from backend_core.engines.ensemble import council

# CONFIGURATION
# OFFICIAL GEMINI 3 MODEL (Verified)
GEMINI_MODEL_VERSION = os.getenv("GEMINI_MODEL_ID", "gemini-3-pro-preview")
DISPLAY_MODEL_NAME = "Gemini 3 Pro (Preview)"


async def run_titan_flow(video_context: str, niche: str = "fitness") -> Dict[str, Any]:
    """
    THE "ANTIGRAVITY" LOOP:
    1. Director (Gemini 3 Pro) drafts the concept.
    2. Council (Gemini + GPT-4o + Claude) critiques it.
    3. If Score > 85, we approve for generation.
    """
    print(f"🎬 TITAN AGENT (Model: {DISPLAY_MODEL_NAME}): Analyzing '{video_context}'...")
    
    if not AUTOGEN_AVAILABLE:
        print("❌ AutoGen not available. Returning mock response.")
        return {
            "status": "ERROR",
            "model_used": GEMINI_MODEL_VERSION,
            "blueprint": "AutoGen not installed",
            "council_review": {},
            "turns_taken": 0,
            "agent_thoughts": []
        }
    
    from backend_core.prompts.engine import PromptEngine

    # 1. The Director (Gemini 3 Pro)
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not gemini_key:
        return {
            "status": "ERROR",
            "error": "GEMINI_API_KEY not set",
            "model_used": GEMINI_MODEL_VERSION,
            "blueprint": None,
            "council_review": {},
            "turns_taken": 0,
            "agent_thoughts": []
        }
    
    # Use Google's OpenAI-compatible endpoint for AutoGen integration
    # See: https://ai.google.dev/gemini-api/docs/openai
    model_client = OpenAIChatCompletionClient(
        model=GEMINI_MODEL_VERSION,
        api_key=gemini_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        model_info={
            "vision": False,
            "function_calling": True,
            "json_output": True,
            "family": "gemini-3"
        }
    )

    # Use Dynamic Prompt Engine to inject Knowledge Context (Hormozi Rules, etc.)
    system_msg = PromptEngine.get_director_system_message(niche)

    director = AssistantAgent(
        name="Director",
        system_message=system_msg,
        model_client=model_client
    )

    # 2. The User Proxy (Executioner)
    user_proxy = UserProxyAgent(
        name="User_Proxy",
    )

    # 3. Start the Creative Loop (The Titan Loop)
    print("🎥 DIRECTOR: Drafting script with extended reasoning...")
    
    # --- MCP INTEGRATION START ---
    try:
        from backend_core.mcp_wrapper import meta_ads_client
        print("🔌 MCP: Connecting to Meta Ads Server...")
        if await meta_ads_client.connect():
            tools = await meta_ads_client.list_tools()
            tool_names = [t.name for t in tools]
            print(f"🛠️ MCP TOOLS LOADED ({len(tools)}): {', '.join(tool_names[:5])}...")
            # TODO: Register these tools with the Director Agent
    except Exception as e:
        print(f"⚠️ MCP Integration Warning: {e}")
    # --- MCP INTEGRATION END ---

    # Initial Draft
    response = await director.on_messages(
        [TextMessage(content=f"Context: {video_context}. Niche: {niche}. Generate a viral ad script JSON with 'hook', 'body', 'cta'. Think deeply about psychological triggers.", source="user")],
        cancellation_token=None
    )
    last_msg = response.chat_message.content
    
    turns = 0
    max_turns = 3
    final_status = "REJECTED"
    critique = {}
    
    while turns < max_turns:
        turns += 1
        print(f"🏛️ COUNCIL: Reviewing draft (Turn {turns}/{max_turns})...")
        critique = await council.evaluate_script(last_msg)
        
        print(f"⚖️ VERDICT: {critique['verdict']} (Score: {critique['final_score']})")
        print(f"📊 Breakdown: Gemini 2.0={critique['breakdown']['gemini_2_0_thinking']}, GPT={critique['breakdown']['gpt_4o']}, Claude={critique['breakdown']['claude_3_5']}, DeepCTR={critique['breakdown']['deep_ctr']}")

        if critique['final_score'] > 85:
            final_status = "APPROVED"
            print("✅ SCRIPT APPROVED!")
            break
            
        if turns < max_turns:
            print(f"🔄 REWRITING: Director is improving the script (Score: {critique['final_score']})...")
            # Feedback Loop
            response = await director.on_messages(
                [TextMessage(content=f"The Council rejected your draft (Score: {critique['final_score']}). Critique: {critique.get('feedback', 'Improve hook and emotional resonance')}. Improve the script to be viral. Use extended reasoning.", source="user")],
                cancellation_token=None
            )
            last_msg = response.chat_message.content
    
    return {
        "status": final_status,
        "model_used": GEMINI_MODEL_VERSION,
        "blueprint": last_msg,
        "council_review": critique,
        "turns_taken": turns,
        "agent_thoughts": [last_msg] # Simplified
    }


class AntigravityOrchestrator:
    """
    High-level orchestrator for the Antigravity Loop.
    Manages the Director → Council → Approve/Reject flow.
    """
    def __init__(self):
        self.council = council
        self.max_iterations = 3
        self.approval_threshold = 85.0
    
    async def run(self, video_context: str, niche: str = "fitness") -> Dict[str, Any]:
        """
        Run the full Antigravity orchestration loop.
        """
        return await run_titan_flow(video_context, niche)
    
    async def evaluate_only(self, script: str, visual_features: dict = None) -> Dict[str, Any]:
        """
        Just evaluate a script without the full loop.
        """
        return await self.council.evaluate_script(script, visual_features)


# Global instance
orchestrator = AntigravityOrchestrator()
