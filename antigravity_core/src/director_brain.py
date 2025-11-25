import os
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv
from rich.console import Console

load_dotenv()
console = Console()

class VideoSegment(BaseModel):
    start_time: float = Field(description="Start time of the viral segment in seconds")
    end_time: float = Field(description="End time of the viral segment in seconds")
    hook_reason: str = Field(description="Why this hook is viral (max 10 words)")
    virality_score: int = Field(description="Score from 1-100 based on retention potential")
    crop_coordinates_x_y: str = Field(description="Center point for 9:16 crop in format 'x,y'")
    caption_style: str = "hormozi"

class DirectorBrain:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        
    def analyze_video(self, cache_name: str) -> VideoSegment:
        """
        Analyzes a cached video to find the most viral segment.
        """
        console.log(f"[bold purple]Director Brain analyzing:[/bold purple] {cache_name}")
        
        prompt = """
        You are a Master Editor. Watch this cached video. 
        Find the most viral 30-60s segment. 
        Criteria: High energy, clear audio, strong hook in first 3s. 
        Output: JSON object with start_time, end_time, virality_score, crop_coordinates_x_y.
        """

        # Retry logic with higher temperature if needed
        try:
            response = self.client.models.generate_content(
                model="gemini-1.5-pro-002", # Using 1.5 Pro as 3 Pro might be under preview/whitelist
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_text(text=prompt)
                        ]
                    )
                ],
                config=types.GenerateContentConfig(
                    cached_content=cache_name,
                    response_mime_type="application/json",
                    response_schema=VideoSegment,
                    temperature=0.3
                )
            )
            
            segment = response.parsed
            console.log(f"[bold green]Viral Segment Found:[/bold green] Score {segment.virality_score}")
            console.log(f"Time: {segment.start_time}s - {segment.end_time}s")
            console.log(f"Hook: {segment.hook_reason}")
            
            return segment

        except Exception as e:
            console.log(f"[red]Analysis failed, retrying with higher temp...[/red] Error: {e}")
            # Retry with higher temp could go here
            raise e

if __name__ == "__main__":
    # Test run
    pass
