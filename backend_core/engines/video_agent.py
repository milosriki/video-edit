from typing import Dict, Any, List
from .base import BaseEngine
import sys
import os

# Add VideoAgent repo to path
VIDEO_AGENT_PATH = os.path.join(os.path.dirname(__file__), 'video_agent_repo')
if VIDEO_AGENT_PATH not in sys.path:
    sys.path.append(VIDEO_AGENT_PATH)

# Try importing, handle failure gracefully if dependencies aren't met
try:
    from environment.agents.multi import MultiAgent
    VIDEO_AGENT_AVAILABLE = True
except ImportError:
    VIDEO_AGENT_AVAILABLE = False
    print("⚠️ VideoAgent dependencies not fully met. Engine will run in mock mode.")

class VideoAgentEngine(BaseEngine):
    def __init__(self):
        super().__init__(name="VideoAgent", weight=1.8)
        self.agent = MultiAgent() if VIDEO_AGENT_AVAILABLE else None
        
    async def predict(self, input_data: Dict[str, Any]) -> float:
        if not self.agent:
            return 0.5
            
        # VideoAgent is complex and conversational. 
        # For a simple 'predict' score, we might ask it to analyze the video.
        # This is a placeholder for the actual integration logic.
        
        return 0.75

    async def train(self, training_data: List[Dict[str, Any]]):
        pass
