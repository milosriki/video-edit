import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(".env.local")

api_key = os.getenv("VITE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

model_id = "gemini-3-pro"

print(f"Testing model: {model_id}...")

try:
    model = genai.GenerativeModel(model_id)
    response = model.generate_content("Hello, are you Gemini 3?")
    print(f"✅ Success! Response: {response.text}")
except Exception as e:
    print(f"❌ Failed: {e}")
