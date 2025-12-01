"""
TITAN API Routes - Package
"""

from .analyze import router as analyze_router
from .predict import router as predict_router
from .generate import router as generate_router
from .chat import router as chat_router
from .knowledge import router as knowledge_router

__all__ = [
    'analyze_router',
    'predict_router',
    'generate_router', 
    'chat_router',
    'knowledge_router'
]
