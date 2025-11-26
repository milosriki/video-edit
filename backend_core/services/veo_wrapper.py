import os
from typing import List, Optional
import vertexai
import google.auth
from google.auth.transport.requests import Request
import requests
import json
from pydantic import BaseModel

from ..config import PROJECT_ID, LOCATION

class VeoDirector:
    def __init__(self, project_id: str = PROJECT_ID, location: str = LOCATION):
        self.project_id = project_id
        self.location = location
        self.api_endpoint = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/publishers/google/models/veo-001:predict"
        
        print(f"🎬 VEO DIRECTOR: Initializing via REST API in {project_id}/{location}...")
        
        # Get Credentials
        try:
            self.credentials, self.project = google.auth.default()
            print("✅ VEO DIRECTOR: Credentials loaded successfully.")
        except Exception as e:
            print(f"❌ VEO DIRECTOR: Failed to load credentials: {e}")

    def _get_access_token(self):
        """Refreshes and returns the access token."""
        self.credentials.refresh(Request())
        return self.credentials.token

    def generate_video(self, assets: List[str], winning_pattern: dict) -> str:
        """
        Generates a video using Veo 3.1 via REST API.
        """
        
        prompt = f"""
        Create a high-quality marketing video.
        Style: {winning_pattern.get('hook_style', 'Cinematic')}
        Pacing: {winning_pattern.get('pacing', 'Medium')}
        Emotion: {winning_pattern.get('emotional_trigger', 'Inspiring')}
        
        Visuals: Use the provided assets to create a cohesive narrative.
        The video should start with a strong hook matching the style.
        """
        
        print(f"🎬 VEO DIRECTOR: Generating REAL video via REST with prompt: {prompt}")
        
        try:
            token = self._get_access_token()
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Construct the payload for Veo
            # Note: The actual payload structure for Veo might vary slightly in preview
            # This follows the standard Vertex AI prediction format
            payload = {
                "instances": [
                    {
                        "prompt": prompt,
                        # "image_prompts": assets # If supported by the specific endpoint version
                    }
                ],
                "parameters": {
                    "sampleCount": 1,
                    "aspectRatio": "16:9",
                    # "durationSeconds": 6
                }
            }
            
            response = requests.post(self.api_endpoint, headers=headers, json=payload)
            
            if response.status_code != 200:
                print(f"❌ VEO REST Error: {response.status_code} - {response.text}")
                # Fallback to mock if API fails (e.g. 404 model not found)
                return "gs://cortex-marketing-data/placeholders/error_placeholder.mp4"

            result = response.json()
            
            # Parse response to find video URI
            # Structure depends on exact model output
            predictions = result.get("predictions", [])
            if predictions and "video" in predictions[0]:
                 video_uri = predictions[0]["video"]["uri"]
                 print(f"✅ VEO DIRECTOR: Real Video generated at {video_uri}")
                 return video_uri
            
            # If we get here, the response format wasn't what we expected
            print(f"⚠️ VEO REST: Unexpected response format: {result}")
            return "gs://cortex-marketing-data/placeholders/error_placeholder.mp4"

        except Exception as e:
            print(f"❌ VEO DIRECTOR: REST Generation failed: {e}")
            return "gs://cortex-marketing-data/placeholders/error_placeholder.mp4"
