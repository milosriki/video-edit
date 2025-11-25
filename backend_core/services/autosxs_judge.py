from google import genai
from google.genai import types
from pydantic import BaseModel, Field
import json
import os

class QualityScore(BaseModel):
    score: int = Field(..., description="Quality score from 0 to 100")
    decision: str = Field(..., description="APPROVE or REJECT")
    reasoning: str = Field(..., description="Detailed reasoning for the score")

class QualityJudge:
    def __init__(self):
        # Initialize Gemini 3 Native SDK
        self.client = genai.Client(http_options={'api_version': 'v1alpha'})
        self.model_id = "gemini-1.5-pro-002"

    def evaluate_video(self, new_video_uri: str, reference_video_uri: str, persona: str = "General Audience") -> QualityScore:
        """
        Compares a new video against a historical best performer using a specific persona.
        """
        
        prompt = f"""
        Act as a {persona}.
        Compare the following two videos.
        
        Video 1 (New Candidate): {new_video_uri}
        Video 2 (Historical Best): {reference_video_uri}
        
        Evaluate the New Candidate based on:
        1. Engagement potential
        2. Visual quality
        3. Alignment with the historical best's success factors
        
        Assign a score from 0-100.
        If score >= 75, decision is APPROVE. Otherwise REJECT.
        """
        
        print(f"⚖️ QUALITY JUDGE: Evaluating {new_video_uri} as {persona}...")
        
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[
                    prompt,
                    # In a real scenario, we would attach the video parts here
                    # types.Part.from_uri(file_uri=new_video_uri, mime_type="video/mp4"),
                    # types.Part.from_uri(file_uri=reference_video_uri, mime_type="video/mp4")
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=QualityScore
                )
            )
            
            if not response.text:
                raise ValueError("Empty response from Judge")

            data = json.loads(response.text)
            result = QualityScore(**data)
            
            print(f"⚖️ QUALITY JUDGE: Verdict - {result.decision} ({result.score}/100). Reason: {result.reasoning}")
            return result

        except Exception as e:
            print(f"❌ QUALITY JUDGE: Evaluation failed: {e}")
            # Fail safe return
            return QualityScore(score=0, decision="REJECT", reasoning=f"System Error: {str(e)}")
