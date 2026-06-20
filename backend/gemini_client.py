import asyncio
import httpx
from backend.config import GEMINI_API_KEY, GEMINI_MODEL

_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Ordered list of models to try.  The configured model is tried first;
# if it 503s we automatically fall back to the next one.
_FALLBACK_MODELS = [GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.0-flash"]
# Deduplicate while preserving order
_MODELS = list(dict.fromkeys(_FALLBACK_MODELS))

# Retry these status codes (transient Gemini failures)
_RETRYABLE = {429, 500, 502, 503, 504}
_MAX_RETRIES = 2  # per model


async def generate(prompt: str, temperature: float = 0.3) -> str:
    """
    Call the Gemini REST API and return the text of the first candidate.
    Tries the primary model first, then falls back to alternatives.
    Retries each model up to 2 times on transient errors.
    Never leaks the API key in error messages.
    """
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "responseMimeType": "application/json",
        },
    }

    last_status = None
    last_body = ""

    async with httpx.AsyncClient(timeout=55.0) as client:
        for model in _MODELS:
            url = f"{_BASE_URL}/{model}:generateContent"

            for attempt in range(_MAX_RETRIES):
                try:
                    resp = await client.post(
                        url,
                        params={"key": GEMINI_API_KEY},
                        json=payload,
                    )

                    if resp.status_code in _RETRYABLE:
                        last_status = resp.status_code
                        last_body = resp.text[:300]
                        if attempt < _MAX_RETRIES - 1:
                            await asyncio.sleep(1 * (attempt + 1))
                            continue
                        # Exhausted retries for this model — try next
                        break

                    if resp.status_code != 200:
                        raise RuntimeError(
                            f"Gemini API returned {resp.status_code}. "
                            f"Response: {resp.text[:300]}"
                        )

                    data = resp.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]

                except httpx.HTTPError as exc:
                    last_status = None
                    last_body = f"{type(exc).__name__}"
                    if attempt < _MAX_RETRIES - 1:
                        await asyncio.sleep(1 * (attempt + 1))
                        continue
                    break  # try next model

    # All models exhausted
    raise RuntimeError(
        f"Gemini API unavailable (tried {', '.join(_MODELS)}). "
        f"Last status: {last_status}. {last_body}"
    )
