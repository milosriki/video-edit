import os
from dotenv import load_dotenv

load_dotenv(".env.local")

# 🧠 AI CONFIGURATION
# "Gemini 3" Era Configuration (Next Gen Models)

# STRATEGY & REASONING (Pro Level)
# Used for: Director Agent, Strategy Generation, Deep Analysis
# Current Best: Gemini 3 Pro (Preview)
GEMINI_MODEL_ID = os.getenv("GEMINI_MODEL_ID", "gemini-3-pro-preview")

# SPEED & INTERACTION (Flash Level)
# Used for: Ad Chat, Quick Edits, Repetitive Tasks
# Current Best: Gemini 3 Pro (Preview) - Unified Power
GEMINI_FLASH_MODEL_ID = os.getenv("GEMINI_FLASH_MODEL_ID", "gemini-3-pro-preview")

# 🧠 EXTERNAL MODELS (Multi-Model Support)
# Anthropic (Claude)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL_ID = os.getenv("CLAUDE_MODEL_ID", "claude-3-opus-20240229") # Default to Opus

# OpenAI (GPT)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL_ID = os.getenv("OPENAI_MODEL_ID", "gpt-4-turbo-preview") # Default to GPT-4 Turbo

# API Configuration
API_VERSION = "v1alpha" # Required for some experimental features

# Project Configuration
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT", "ptd-fitness-demo")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
