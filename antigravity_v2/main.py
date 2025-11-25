import time
import schedule
from rich.console import Console
from production.smart_editor import SmartEditor
from production.publisher import Publisher
from production.analyst import Analyst

console = Console()

def job_production_cycle():
    console.rule("[bold red]STARTING PRODUCTION CYCLE[/bold red]")
    
    # 1. Editor
    editor = SmartEditor()
    # In a real run, this would pick a file from /inputs
    video_path = "mock_input.mp4" 
    console.log(f"Processing {video_path}...")
    
    # Mock Editing Process
    # editor.edit_video(video_path, [])
    
    # 2. Publisher
    publisher = Publisher()
    # Mock Virality Score from 'Director Brain' (Gemini)
    virality_score = 92 
    
    metadata = publisher.generate_metadata(video_path, virality_score)
    scheduled_time = publisher.schedule_post(metadata)
    
    # In reality, we would schedule the specific post function
    publisher.post_to_socials(video_path, metadata)
    
    console.rule("[bold red]CYCLE COMPLETE[/bold red]")

def job_university_loop():
    console.rule("[bold blue]STARTING UNIVERSITY LOOP[/bold blue]")
    analyst = Analyst()
    analyst.analyze_and_learn()
    console.rule("[bold blue]LOOP COMPLETE[/bold blue]")

def main():
    console.print("""
    [bold green]
       _   _   _ _____ ___ ____ ____      _ __     _____ _______   __
      / \ | \ | |_   _|_ _/ ___|  _ \    / \\ \   / /_ _|_   _\ \ / /
     / _ \|  \| | | |  | | |  _| |_) |  / _ \\ \ / / | |  | |  \ V / 
    / ___ \ |\  | | |  | | |_| |  _ <  / ___ \\ V /  | |  | |   | |  
   /_/   \_\_| \_| |_| |___\____|_| \_\/_/   \_\_/  |___| |_|   |_|  
                                                                     
    ANTIGRAVITY V2: THE INFINITE LOOP
    Status: ONLINE
    [/bold green]
    """)

    # Schedule the jobs
    # Production runs every hour to check for new inputs
    schedule.every(1).hours.do(job_production_cycle)
    
    # University Loop runs every 24 hours
    schedule.every(24).hours.do(job_university_loop)
    
    console.log("[yellow]System is running. Press Ctrl+C to stop.[/yellow]")
    
    # For demonstration, run once immediately
    job_production_cycle()
    job_university_loop()

    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    main()
