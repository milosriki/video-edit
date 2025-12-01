import base64
import os
import sys
import typing

# --- MONKEYPATCH FOR PYTHON 3.14 COMPATIBILITY ---
try:
    _original_eval_type = typing._eval_type
    def _patched_eval_type(t, globalns, localns, type_params=None, **kwargs):
        kwargs.pop('prefer_fwd_module', None)
        return _original_eval_type(t, globalns, localns, type_params, **kwargs)
    typing._eval_type = _patched_eval_type
except Exception as e:
    pass
# -------------------------------------------------

from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv(".env.local")

# Configuration
# Use 'gemini-2.0-flash-exp' or 'gemini-1.5-pro' as 'gemini-3' is not released yet.
MODEL_ID = "gemini-2.0-flash-exp"

def run_consultant_simulation(user_input: str):
    """
    Runs the consultant simulation with Search and Reasoning capabilities.
    """
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("VITE_GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY (or VITE_GEMINI_API_KEY) not found in environment variables.")
        return

    client = genai.Client(api_key=api_key)

    # 1. Define the Consultant Persona (System Instruction)
    # Refined for professionalism, simulation capability, and '1% better' logic.
    system_prompt = """
    You are an Elite DevOps & Strategy Consultant. 
    Your Goal: Expand on the user's idea, find the most poised (stable & elegant) solutions, 
    simulate the workflow mentally to find edge cases, and strictly identify improvements 
    that yield even a 1% marginal gain.
    
    Output Format: JSON only.
    Structure your response as:
    { 
      "analysis": "...", 
      "simulation": "...", 
      "solution": "...", 
      "marginal_gain_tweak": "..." 
    }
    """

    # 2. Configure Tools (Search) & Output
    # usage of types.GoogleSearch() enables the model to verify facts.
    tools = [
        types.Tool(google_search=types.GoogleSearch())
    ]

    # 3. Build the Configuration Object
    # Corrected Python syntax for GenerateContentConfig.
    # Note: 'thinkingLevel' is not yet a standard attribute in the public SDK types for all models,
    # so we rely on the model's inherent reasoning capabilities via the system prompt + tools.
    config = types.GenerateContentConfig(
        tools=tools,
        response_mime_type="application/json",
        system_instruction=[types.Part.from_text(text=system_prompt)],
        temperature=0.2, # Lower temperature for more precise/poised engineering answers
    )

    # 4. Prepare Content
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_input)],
        ),
    ]

    print(f"\n--- Consultant AI ({MODEL_ID}) analyzing: '{user_input[:30]}...' ---\n")

    try:
        # 5. Stream Generation
        response_stream = client.models.generate_content_stream(
            model=MODEL_ID,
            contents=contents,
            config=config,
        )

        full_response = []
        for chunk in response_stream:
            # Handle cases where chunk.text might be None (during tool use)
            if chunk.text:
                print(chunk.text, end="")
                full_response.append(chunk.text)
        
        print("\n\n--- Analysis Complete ---")

    except Exception as e:
        print(f"\nExecution Error: {str(e)}")

if __name__ == "__main__":
    # Example usage: Pass arguments from CLI or default prompt
    input_text = sys.argv[1] if len(sys.argv) > 1 else "I want to build a serverless video remixer. What is the best architecture?"
    run_consultant_simulation(input_text)
