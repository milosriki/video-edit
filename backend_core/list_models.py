import os
from dotenv import load_dotenv
from google import genai

load_dotenv(".env.local")

def list_models():
    print("\n--- Listing Available Models ---")
    api_key = os.getenv("VITE_GEMINI_API_KEY")
    try:
        client = genai.Client(api_key=api_key, http_options={'api_version': 'v1beta'})
        for model in client.models.list(config={'page_size': 10}):
            print(f"- {model.name}")
    except Exception as e:
        print(f"❌ Error listing models: {e}")

if __name__ == "__main__":
    list_models()
