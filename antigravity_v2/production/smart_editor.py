import os
import random
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip, concatenate_videoclips
from pexels_api import API as PexelsAPI
from rich.console import Console
from dotenv import load_dotenv

load_dotenv()
console = Console()

class SmartEditor:
    def __init__(self):
        self.pexels_api_key = os.getenv("PEXELS_API_KEY")
        self.api = PexelsAPI(self.pexels_api_key) if self.pexels_api_key else None

    def fetch_b_roll(self, keyword: str, duration: int = 3) -> str:
        """
        Searches Pexels for a video matching the keyword and downloads it.
        Returns the path to the downloaded file.
        """
        if not self.api:
            console.log("[red]Pexels API Key not found. Skipping B-Roll.[/red]")
            return None

        console.log(f"[blue]Searching Pexels for:[/blue] {keyword}")
        try:
            self.api.search(keyword, page=1, results_per_page=5)
            videos = self.api.get_videos()
            
            if not videos:
                console.log("[yellow]No videos found.[/yellow]")
                return None

            # Pick a random video from top 5
            video = random.choice(videos)
            video_url = video.hd_video_files[0]['link'] # Get HD link
            
            # Download logic would go here (mocked for now)
            # In a real scenario, use requests to download video_url to /assets/b_roll_cache
            console.log(f"[green]Found video:[/green] {video.url}")
            return "path/to/downloaded/b_roll.mp4" # Placeholder

        except Exception as e:
            console.log(f"[red]Error fetching B-Roll:[/red] {e}")
            return None

    def create_karaoke_clip(self, text: str, start_time: float, duration: float) -> TextClip:
        """
        Creates a TextClip with 'Karaoke' styling (Yellow -> Green).
        Note: MoviePy TextClip requires ImageMagick installed.
        """
        # Simplified for this example: Just a static text clip
        # Advanced version would use multiple clips or custom effects
        txt_clip = (TextClip(text, fontsize=70, color='yellow', font='Montserrat-Black', stroke_color='black', stroke_width=2)
                    .set_position('center')
                    .set_start(start_time)
                    .set_duration(duration))
        return txt_clip

    def edit_video(self, main_video_path: str, transcript: list):
        """
        Main editing loop.
        """
        console.log(f"[bold purple]Editing Video:[/bold purple] {main_video_path}")
        video = VideoFileClip(main_video_path)
        
        # Example logic: Overlay B-Roll if keyword "Money" is found
        # ... (Implementation of overlay logic)
        
        return video

if __name__ == "__main__":
    editor = SmartEditor()
    # editor.fetch_b_roll("Business")
