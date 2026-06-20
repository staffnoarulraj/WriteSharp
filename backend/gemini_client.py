import google.generativeai as genai
from backend.config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

# Shared model instance — gemini-2.0-flash for speed + structured JSON support
model = genai.GenerativeModel("gemini-2.0-flash")
