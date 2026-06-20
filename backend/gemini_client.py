import asyncio
import httpx
from backend.config import GEMINI_API_KEY, GEMINI_MODEL

_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Put gemini-2.5-flash first since gemini-3.5-flash is currently unreliable.
# The configured model is included as a fallback in case it recovers.
_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", GEMINI_MODEL]
# Deduplicate while preserving order
_MODELS = list(dict.fromkeys(_MODELS))

# 5xx = model is down → skip to next model immediately
_MODEL_DOWN = {500, 502, 503, 504}


async def generate(prompt: str, temperature: float = 0.3) -> str:
    """
    Call the Gemini REST API and return the text of the first candidate.

    Strategy:
    - Try models in order until one succeeds
    - 5xx  → skip to next model
    - 429  → wait and retry (all models share one API-key quota)
    - Timeout → skip to next model
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
    models_tried = []

    # 25s read timeout gives the model enough time to generate;
    # 5s connect timeout catches dead endpoints fast.
    async with httpx.AsyncClient(timeout=httpx.Timeout(25.0, connect=5.0)) as client:
        for model in _MODELS:
            models_tried.append(model)
            url = f"{_BASE_URL}/{model}:generateContent"

            try:
                resp = await client.post(
                    url,
                    params={"key": GEMINI_API_KEY},
                    json=payload,
                )

                # ── 429: rate limited ──────────────────────────────────
                if resp.status_code == 429:
                    # All models share the same quota — wait and retry
                    for delay in [3, 8, 15]:
                        await asyncio.sleep(delay)
                        resp = await client.post(
                            url,
                            params={"key": GEMINI_API_KEY},
                            json=payload,
                        )
                        if resp.status_code != 429:
                            break

                    if resp.status_code == 429:
                        raise RuntimeError(
                            "Rate limit exceeded. The free Gemini API tier "
                            "allows limited requests per minute. Please wait "
                            "about 60 seconds and try again."
                        )

                # ── 5xx: model is down ─────────────────────────────────
                if resp.status_code in _MODEL_DOWN:
                    last_status = resp.status_code
                    last_body = f"{model} returned {resp.status_code}"
                    continue  # try next model

                # ── Other errors ───────────────────────────────────────
                if resp.status_code != 200:
                    raise RuntimeError(
                        f"Gemini API returned {resp.status_code}. "
                        f"Response: {resp.text[:300]}"
                    )

                # ── Success ────────────────────────────────────────────
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]

            except httpx.TimeoutException:
                last_status = "timeout"
                last_body = f"{model} timed out"
                continue  # try next model

            except httpx.HTTPError as exc:
                last_status = type(exc).__name__
                last_body = str(exc)[:200]
                continue  # try next model

    # All models exhausted
    raise RuntimeError(
        f"Gemini API unavailable (tried {', '.join(models_tried)}). "
        f"Last: {last_body}"
    )
