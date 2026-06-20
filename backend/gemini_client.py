import asyncio
import httpx
from backend.config import GEMINI_API_KEY, GEMINI_MODEL

_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Ordered list of models to try.  The configured model is tried first;
# if it fails we automatically fall back to the next one.
_FALLBACK_MODELS = [GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.0-flash"]
# Deduplicate while preserving order
_MODELS = list(dict.fromkeys(_FALLBACK_MODELS))

# Status codes that mean "try next model immediately" (no retry on same model)
_RETRYABLE = {429, 500, 502, 503, 504}


async def generate(prompt: str, temperature: float = 0.3) -> str:
    """
    Call the Gemini REST API and return the text of the first candidate.
    Tries the primary model first, then falls back to alternatives.
    Uses a short per-request timeout so a slow 503 doesn't burn the whole
    Vercel function budget.  Never leaks the API key in error messages.
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

    # Short connect/read timeout per request — if a model is 503ing it often
    # takes 20-30s to respond, so we cap at 10s and move on to the fallback.
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
        for model in _MODELS:
            url = f"{_BASE_URL}/{model}:generateContent"
            try:
                resp = await client.post(
                    url,
                    params={"key": GEMINI_API_KEY},
                    json=payload,
                )

                if resp.status_code in _RETRYABLE:
                    last_status = resp.status_code
                    last_body = resp.text[:200]
                    continue  # immediately try next model

                if resp.status_code != 200:
                    raise RuntimeError(
                        f"Gemini API returned {resp.status_code}. "
                        f"Response: {resp.text[:300]}"
                    )

                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]

            except httpx.TimeoutException:
                last_status = "timeout"
                last_body = f"{model} timed out"
                continue  # try next model

            except httpx.HTTPError as exc:
                last_status = None
                last_body = f"{type(exc).__name__}"
                continue  # try next model

    # All models exhausted
    raise RuntimeError(
        f"Gemini API unavailable (tried {', '.join(_MODELS)}). "
        f"Last status: {last_status}. {last_body}"
    )
