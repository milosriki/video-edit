import os
import time
import hashlib
from google import genai
from google.genai import types
from dotenv import load_dotenv
from rich.console import Console

load_dotenv()
console = Console()

class IngestAgent:
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        self.project_id = os.getenv("VERTEX_PROJECT_ID")
        self.location = "us-central1" # Default to us-central1 for Vertex AI

    def calculate_md5(self, file_path: str) -> str:
        """Calculates MD5 hash of a file."""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    def upload_and_cache_video(self, file_path: str) -> str:
        """
        Uploads a video to Gemini API and creates a context cache.
        Returns the cache name.
        """
        file_name = os.path.basename(file_path)
        console.log(f"[bold blue]Ingesting:[/bold blue] {file_name}")

        # 1. Upload File
        console.log("Uploading to Gemini...")
        video_file = self.client.files.upload(path=file_path)
        
        # 2. Wait for Active State
        console.log("Waiting for processing...")
        while video_file.state.name == "PROCESSING":
            time.sleep(2)
            video_file = self.client.files.get(name=video_file.name)
            
        if video_file.state.name != "ACTIVE":
            raise Exception(f"File processing failed: {video_file.state.name}")
            
        console.log(f"[green]File Active:[/green] {video_file.name}")

        # 3. Create Context Cache (TTL 24h)
        # Note: The google-genai SDK usage for caching might vary slightly by version.
        # We will use the standard approach for creating cached content.
        
        console.log("Creating Context Cache...")
        
        # Define the cache config
        cache_config = types.CachedContent(
            display_name=f"cache-{file_name}-{int(time.time())}",
            model="gemini-1.5-pro-002", # Using 1.5 Pro as 3 Pro might be under preview/whitelist
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_uri(
                            file_uri=video_file.uri,
                            mime_type=video_file.mime_type
                        )
                    ]
                )
            ],
            ttl="86400s" # 24 hours
        )

        cached_content = self.client.caches.create(config=cache_config)
        
        console.log(f"[bold green]Cache Created:[/bold green] {cached_content.name}")
        return cached_content.name

if __name__ == "__main__":
    # Test run
    agent = IngestAgent()
    # agent.upload_and_cache_video("path/to/test.mp4")
