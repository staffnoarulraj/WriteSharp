import sys
import os

# Make the project root importable so `from backend.X import ...` works
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the FastAPI app — Vercel detects ASGI apps automatically
from backend.main import app
