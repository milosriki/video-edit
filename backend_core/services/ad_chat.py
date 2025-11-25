from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional
import json
from ..config import GEMINI_MODEL_ID, GEMINI_FLASH_MODEL_ID, API_VERSION

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatResponse(BaseModel):
    response: str
    suggested_actions: List[str]

class AdChatAgent:
    def __init__(self):
        self.client = genai.Client(http_options={'api_version': API_VERSION})
        # Use Flash for Chat (Speed is priority)
        self.model_id = GEMINI_FLASH_MODEL_ID
        self.chat_history = []

    def chat_with_ad(self, video_uri: str, user_message: str, context: Optional[dict] = None) -> ChatResponse:
        """
        Allows the user to 'chat' with a specific video ad to ask questions or request changes.
        """
        
        system_prompt = f"""
        You are an expert Creative Director AI assistant.
        The user is asking questions about a specific video ad.
        
        Video Context: {context if context else 'No specific analysis provided yet.'}
        
        Your goal is to:
        1. Answer questions about the video's content, style, or performance potential.
        2. Suggest concrete edits or improvements if asked.
        3. Be concise and professional.
        
        Return the response in JSON format with 'response' and 'suggested_actions'.
        """
        
        try:
            # Construct the multimodal prompt
            contents = [
                types.Part.from_uri(file_uri=video_uri, mime_type="video/mp4"),
                system_prompt,
                f"User: {user_message}"
            ]
            
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ChatResponse
                )
            )
            
            if not response.text:
                return ChatResponse(response="I couldn't analyze the video right now.", suggested_actions=[])

            return ChatResponse(**json.loads(response.text))

        except Exception as e:
            print(f"❌ AD CHAT ERROR: {e}")
            return ChatResponse(response="Sorry, I encountered an error analyzing the video.", suggested_actions=[])
