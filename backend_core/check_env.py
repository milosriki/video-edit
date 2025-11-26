import os
import sys
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load env
load_dotenv(".env.local")

def check_gemini():
    print("\n--- Checking Gemini API ---")
    api_key = os.getenv("VITE_GEMINI_API_KEY")
    model_id = os.getenv("GEMINI_MODEL_ID", "gemini-1.5-pro")
    
    print(f"✅ Found API Key: {api_key[:5]}...{api_key[-5:]}")
    print(f"ℹ️ Testing Model: {model_id}")
    
    try:
        client = genai.Client(api_key=api_key, http_options={'api_version': 'v1beta'})
        response = client.models.generate_content(
            model=model_id,
            contents="Say 'Hello Titan' if you can hear me."
        )
        print(f"✅ Gemini Response: {response.text}")
    except Exception as e:
        print(f"❌ Gemini Error: {e}")

if __name__ == "__main__":
    check_gemini()
