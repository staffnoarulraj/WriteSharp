import asyncio
import httpx
from backend.config import GEMINI_API_KEY, GEMINI_MODEL

_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Ordered list of models to try.  The configured model is tried first;
# if it 5xxs we fall back to the next one.
_FALLBACK_MODELS = [GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.0-flash"]
_MODELS = list(dict.fromkeys(_FALLBACK_MODELS))  # deduplicate, keep order

# 5xx = model is down → skip to next model immediately
_MODEL_DOWN = {500, 502, 503, 504}


async def generate(prompt: str, temperature: float = 0.3) -> str:
    """
    Call the Gemini REST API and return the text of the first candidate.

    Strategy:
    - 5xx  → immediately try the next fallback model
    - 429  → wait and retry (all models share one API-key quota,
             so switching models is pointless). Retries 3× with
             increasing delays (3 s, 8 s, 15 s) to let the free-tier
             quota window reset.
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
    hit_rate_limit = False

    async with httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=5.0)) as client:
        for model in _MODELS:
            # If we already know it's a 429 (quota), don't bother trying
            # other models — they share the same quota.
            if hit_rate_limit:
                break

            url = f"{_BASE_URL}/{model}:generateContent"

            try:
                resp = await client.post(
                    url,
                    params={"key": GEMINI_API_KEY},
                    json=payload,
                )

                # ── 429: rate limited ──────────────────────────────────
                if resp.status_code == 429:
                    hit_rate_limit = True
                    # Retry with increasing waits (3s, 8s, 15s)
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
                            "allows ~15 requests per minute. Please wait "
                            "about 30-60 seconds and try again."
                        )

                # ── 5xx: model is down ─────────────────────────────────
                if resp.status_code in _MODEL_DOWN:
                    last_status = resp.status_code
                    last_body = resp.text[:200]
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

    # All models exhausted (only reached on 5xx / timeout, not 429)
    raise RuntimeError(
        f"Gemini API unavailable (tried {', '.join(_MODELS)}). "
        f"Last status: {last_status}. {last_body}"
    )
