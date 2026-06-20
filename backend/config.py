import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

# gemini-3.5-flash is free on the Google AI Studio developer tier.
# gemini-2.0-flash and earlier were retired June 1, 2026.
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY is not set. "
        "Please copy .env.example to .env and fill in your key."
    )
