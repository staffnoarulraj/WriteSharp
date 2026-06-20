import asyncio
import httpx
from backend.config import GEMINI_API_KEY, GEMINI_MODEL

_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Ordered list of models to try.  The configured model is tried first;
# if it fails we automatically fall back to the next one.
_FALLBACK_MODELS = [GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.0-flash"]
# Deduplicate while preserving order
_MODELS = list(dict.fromkeys(_FALLBACK_MODELS))

# 5xx = model is down → skip to next model immediately
_MODEL_DOWN = {500, 502, 503, 504}

# 429 = rate limited → all models share the same quota, so wait and retry
_RATE_LIMIT_RETRIES = 3
_RATE_LIMIT_DELAYS = [2, 5, 10]  # seconds to wait between 429 retries


async def generate(prompt: str, temperature: float = 0.3) -> str:
    """
    Call the Gemini REST API and return the text of the first candidate.

    Strategy:
    - 5xx → immediately try the next fallback model
    - 429 → wait and retry the SAME model (all models share one quota)
    - Timeout → try next model
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

    # Short per-request timeout so a slow 503 doesn't burn the budget.
    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0)) as client:
        for model in _MODELS:
            url = f"{_BASE_URL}/{model}:generateContent"

            # Each model gets up to _RATE_LIMIT_RETRIES attempts for 429s
            for attempt in range(_RATE_LIMIT_RETRIES):
                try:
                    resp = await client.post(
                        url,
                        params={"key": GEMINI_API_KEY},
                        json=payload,
                    )

                    if resp.status_code == 429:
                        last_status = 429
                        last_body = resp.text[:200]
                        # Wait and retry same model — switching won't help
                        await asyncio.sleep(_RATE_LIMIT_DELAYS[attempt])
                        continue  # retry same model

                    if resp.status_code in _MODEL_DOWN:
                        last_status = resp.status_code
                        last_body = resp.text[:200]
                        break  # skip to next model

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
                    break  # try next model

                except httpx.HTTPError as exc:
                    last_status = None
                    last_body = f"{type(exc).__name__}"
                    break  # try next model

    # All models exhausted
    raise RuntimeError(
        f"Gemini API unavailable (tried {', '.join(_MODELS)}). "
        f"Last status: {last_status}. {last_body}"
    )

