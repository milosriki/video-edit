import os
from dotenv import load_dotenv

load_dotenv(".env.local")

# 🧠 AI CONFIGURATION
# "Gemini 3" Era Configuration (Next Gen Models)

# STRATEGY & REASONING (Pro Level)
# Used for: Director Agent, Strategy Generation, Deep Analysis
# Current Best: Gemini 1.5 Pro (002)
GEMINI_MODEL_ID = os.getenv("GEMINI_MODEL_ID", "gemini-1.5-pro-002")

# SPEED & INTERACTION (Flash Level)
# Used for: Ad Chat, Quick Edits, Repetitive Tasks
# Current Best: Gemini 2.0 Flash (Experimental)
GEMINI_FLASH_MODEL_ID = os.getenv("GEMINI_FLASH_MODEL_ID", "gemini-2.0-flash-exp")

# API Configuration
API_VERSION = "v1alpha" # Required for some experimental features

# Project Configuration
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "ptd-fitness-demo")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
