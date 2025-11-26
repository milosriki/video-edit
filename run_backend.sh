#!/bin/bash
source venv/bin/activate
uvicorn backend_core.main:app --host 0.0.0.0 --port 8080 --reload
