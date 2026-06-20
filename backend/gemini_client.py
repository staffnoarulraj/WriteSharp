import asyncio
import httpx
from backend.config import GEMINI_API_KEY, GEMINI_MODEL

GEMINI_REST_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

# Retry these status codes (transient Gemini failures)
_RETRYABLE = {429, 500, 502, 503, 504}
_MAX_RETRIES = 3


async def generate(prompt: str, temperature: float = 0.3) -> str:
    """
    Call the Gemini REST API and return the text of the first candidate.
    Retries up to 3 times on transient errors (429/5xx) with exponential backoff.
    Never leaks the API key in error messages.
    """
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "responseMimeType": "application/json",
        },
    }

    last_error = None
    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(_MAX_RETRIES):
            try:
                resp = await client.post(
                    GEMINI_REST_URL,
                    params={"key": GEMINI_API_KEY},
                    json=payload,
                )

                if resp.status_code in _RETRYABLE and attempt < _MAX_RETRIES - 1:
                    await asyncio.sleep(2 ** attempt)  # 1s, 2s, 4s
                    continue

                if resp.status_code != 200:
                    # Sanitise: never include the URL (it contains the API key)
                    raise RuntimeError(
                        f"Gemini API returned {resp.status_code}. "
                        f"Response: {resp.text[:300]}"
                    )

                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]

            except httpx.HTTPError as exc:
                last_error = exc
                if attempt < _MAX_RETRIES - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                # Sanitise the error — strip the URL which contains the key
                raise RuntimeError(
                    f"Gemini API request failed after {_MAX_RETRIES} attempts: "
                    f"{type(exc).__name__}"
                ) from None

    # Should never reach here, but just in case
    raise RuntimeError(f"Gemini API failed after {_MAX_RETRIES} retries") from last_error
