import functions_framework
from flask import jsonify, request
import vertexai
from vertexai.generative_models import GenerativeModel, Part
import os

# --- Configuration ---
PROJECT_ID = "ptd-fitness-demo" 
LOCATION = "us-central1"

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)

# --- Model Definitions ---
TEXT_MODEL = "gemini-3-flash"
IMAGE_MODEL = "imagen-4.0-generate-001" # Or your preferred image model

@functions_framework.http
def unified_gemini_api(req):
    """
    A unified HTTP Cloud Function to handle various Gemini model requests.
    """
    # Set CORS headers
    if req.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "3600",
        }
        return ("", 204, headers)

    headers = {"Access-Control-Allow-Origin": "*"}

    # --- Authorization (Optional but Recommended) ---
    # In a production app, you'd want to secure this.
    # For now, we'll allow open access for simplicity.

    # --- Request Routing ---
    req_json = req.get_json(silent=True)
    if not req_json or "task" not in req_json:
        return (jsonify({"error": "Request body must be JSON with a 'task' field."}), 400, headers)

    task = req_json.get("task")
    
    try:
        if task == "generate_storyboard":
            return handle_storyboard(req_json, headers)
        elif task == "generate_image":
            return handle_image_generation(req_json, headers)
        elif task == "research_market_trends":
            return handle_market_research(req_json, headers)
        # Add other tasks here as we migrate them
        # elif task == "transcribe_audio":
        #     return handle_transcription(req_json, headers)
        else:
            return (jsonify({"error": f"Unknown task: {task}"}), 400, headers)
            
    except Exception as e:
        print(f"An error occurred in task '{task}': {e}")
        return (jsonify({"error": f"An internal error occurred: {str(e)}"}), 500, headers)

def handle_storyboard(payload, headers):
    """Handles the storyboard generation task."""
    if "prompt" not in payload:
        return (jsonify({"error": "Missing 'prompt' for storyboard task."}), 400, headers)
    
    prompt = payload["prompt"]
    model = GenerativeModel(TEXT_MODEL)
    
    response = model.generate_content(
        f"Generate a storyboard for an ad concept: {prompt}. Return a JSON array of objects, each with 'description' (string) and 'image_prompt' (string)."
    )
    
    if response.candidates and response.candidates[0].content.parts:
        generated_text = response.candidates[0].content.parts[0].text
        # The model's output might be wrapped in markdown, so we clean it
        clean_json_string = generated_text.strip().replace("```json", "").replace("```", "").strip()
        return (jsonify({"storyboard": clean_json_string}), 200, headers)
    else:
        return (jsonify({"error": "Failed to generate storyboard."}), 500, headers)

def handle_image_generation(payload, headers):
    """Handles the image generation task."""
    if "prompt" not in payload or "aspect_ratio" not in payload:
        return (jsonify({"error": "Missing 'prompt' or 'aspect_ratio' for image generation."}), 400, headers)
    
    prompt = payload["prompt"]
    aspect_ratio = payload["aspect_ratio"]
    
    # NOTE: Vertex AI's Imagen model is different from the Google AI Studio Gemini API for images.
    # This example assumes a model like 'imagen-4.0-generate-001' is available in Vertex AI.
    # The actual API call might differ based on the exact model version.
    
    # Placeholder for actual Vertex AI Imagen call. 
    # The `vertexai` library's `GenerativeModel` for Imagen works differently.
    # For this iteration, we'll simulate the call and return a placeholder.
    # In the next step, we'll implement the real SDK call.
    
    print(f"--- SIMULATING IMAGEN CALL ---")
    print(f"Prompt: {prompt}")
    print(f"Aspect Ratio: {aspect_ratio}")
    print(f"-----------------------------")
    
    # This is a placeholder base64 string for a small red dot.
    # We will replace this with the actual Imagen call next.
    placeholder_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="

    return (jsonify({"image_base64": placeholder_base64}), 200, headers)

def handle_market_research(payload, headers):
    """Handles the market research task using Gemini with search grounding."""
    if "prompt" not in payload:
        return (jsonify({"error": "Missing 'prompt' for market research task."}), 400, headers)

    prompt = payload["prompt"]
    model = GenerativeModel(TEXT_MODEL)

    response = model.generate_content(
        contents=[{"text": f"Deep research report on: {prompt}. Focus on direct response Meta ad performance and competitor frameworks." }],
        tools=[{"googleSearch": {}}]
    )

    if response.candidates and response.candidates[0].content.parts:
        generated_text = response.candidates[0].content.parts[0].text
        sources = response.candidates[0].groundingMetadata.groundingChunks # This needs to be checked based on actual response structure
        
        # Assuming sources are directly available or need parsing
        formatted_sources = []
        if sources:
            for s in sources:
                if s.web:
                    formatted_sources.append({"title": s.web.title, "uri": s.web.uri})

        return (jsonify({"text": generated_text, "sources": formatted_sources}), 200, headers)
    else:
        return (jsonify({"error": "Failed to perform market research."}), 500, headers)

# Add other handlers here (e.g., handle_transcription) in subsequent steps.
