import os
from dotenv import load_dotenv

load_dotenv(".env.local")

# 🧠 AI CONFIGURATION
# Using the latest Gemini models via the Google Gen AI SDK
# "Gemini 3" refers to the latest generation of multimodal models

# Primary Model for Logic, Analysis, and Judging
# Options: "gemini-1.5-pro-002" (Best Quality), "gemini-2.0-flash-exp" (Fastest/Newest)
GEMINI_MODEL_ID = os.getenv("GEMINI_MODEL_ID", "gemini-1.5-pro-002")

# API Configuration
API_VERSION = "v1alpha" # Required for some experimental features

# Project Configuration
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "ptd-fitness-demo")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
