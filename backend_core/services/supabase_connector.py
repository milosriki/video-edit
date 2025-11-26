import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(".env.local")

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("⚠️ Supabase URL or Key missing in environment variables.")
    supabase: Client = None
else:
    try:
        supabase: Client = create_client(url, key)
        print(f"✅ Supabase Client Initialized: {url}")
    except Exception as e:
        print(f"❌ Supabase Init Failed: {e}")
        supabase = None
