import functions_framework
from flask import jsonify, request
import vertexai
from vertexai.generative_models import GenerativeModel, Part

# --- Configuration ---
# TODO: Replace with your actual Google Cloud Project ID
PROJECT_ID = "ptd-fitness-demo" 
LOCATION = "us-central1"  # Or any other supported region

# Initialize Vertex AI - this is done once when the function instance starts
vertexai.init(project=PROJECT_ID, location=LOCATION)

@functions_framework.http
def generate_content(req):
    """
    HTTP Cloud Function to generate content using the Gemini 3 Flash model.
    """
    # Set CORS headers for the preflight request
    if req.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
        }
        return ("", 204, headers)

    # Set CORS headers for the main request
    headers = {"Access-Control-Allow-Origin": "*"}

    # --- Request Validation ---
    req_json = req.get_json(silent=True)
    if not req_json or "prompt" not in req_json:
        return (jsonify({"error": "Request body must be JSON with a 'prompt' field."}), 400, headers)

    prompt_text = req_json["prompt"]

    try:
        # --- Model Invocation ---
        # Initialize the model (gemini-3-flash)
        model = GenerativeModel("gemini-3-flash")

        # Generate content
        response = model.generate_content([
            Part.from_text(prompt_text),
        ])

        # --- Response Handling ---
        if response.candidates and response.candidates[0].content.parts:
            # Successfully got a response from the model
            generated_text = response.candidates[0].content.parts[0].text
            return (jsonify({"generated_text": generated_text}), 200, headers)
        else:
            # The model returned an empty or unexpected response
            return (jsonify({"error": "Failed to generate content. The model returned an empty response."}), 500, headers)

    except Exception as e:
        # Catch any other exceptions during the process
        print(f"An error occurred: {e}")
        return (jsonify({"error": f"An internal error occurred: {str(e)}"}), 500, headers)
