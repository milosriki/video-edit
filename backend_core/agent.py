from __future__ import annotations
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List
import json
import os

class VideoAnalysis(BaseModel):
    hook_style: str = Field(..., description="The style of the hook used in the video (e.g., Visual Shock, Question, Story)")
    pacing: str = Field(..., description="The pacing of the video (Fast/Slow)")
    emotional_trigger: str = Field(..., description="The primary emotional trigger (e.g., Curiosity, Fear, Joy)")
    visual_elements: list[str] = Field(..., description="List of key visual elements identified")
    reasoning: str = Field(..., description="Explanation for why the hook style was identified as such")

from .config import GEMINI_MODEL_ID, API_VERSION

class DirectorAgent:
    def __init__(self):
        # Initialize Gemini 3 Native SDK Client
        # API Key should be in GOOGLE_API_KEY environment variable
        self.client = genai.Client(http_options={'api_version': API_VERSION})
        # Using the centralized model ID (Gemini 3 / 1.5 Pro)
        self.model_id = GEMINI_MODEL_ID 

    def analyze_winning_pattern(self, video_uri: str) -> VideoAnalysis:
        prompt = """
        Analyze the following video and extract the winning pattern.
        Focus on:
        - Hook Style
        - Pacing (Fast/Slow)
        - Emotional Trigger
        - Visual Elements
        
        Provide the reasoning for the detected hook style.
        """
        
        try:
            # Call Gemini
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[
                    types.Part.from_uri(
                        file_uri=video_uri,
                        mime_type="video/mp4" 
                    ),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=VideoAnalysis
                )
            )
            
            # Parse the response
            if not response.text:
                raise ValueError("Empty response from Gemini")

            data = json.loads(response.text)
            analysis = VideoAnalysis(**data)
            
            # Thought Signature (Audit Logging)
            print(f"🧠 THOUGHT SIGNATURE: Analyzing video {video_uri}. Detected hook type '{analysis.hook_style}' because {analysis.reasoning}.")
            
            return analysis

        except Exception as e:
            print(f"Error during video analysis: {e}")
            raise e
