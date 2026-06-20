from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import json
import re
from backend.gemini_client import generate

router = APIRouter()


# ── Robust JSON extractor ─────────────────────────────────────────────────
# Gemini sometimes wraps its response in ```json ... ``` fences
# or adds preamble text. This strips all of that and finds the raw JSON.
def extract_json(text: str) -> dict:
    # 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
    text = re.sub(r"```(?:json)?\s*", "", text).replace("```", "").strip()

    # 2. Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 3. Find the outermost { ... } block
    start = text.find("{")
    end   = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass

    raise ValueError(f"No valid JSON found in response: {text[:200]}")


class CSRefineRequest(BaseModel):
    text: str


class Metrics(BaseModel):
    overall: int
    professionalism: int
    empathy: int
    clarity: int


class WordSuggestion(BaseModel):
    original: str
    replacement: str
    reason: str


class CSRefineResponse(BaseModel):
    verdict: str
    rudeness_score: int
    metrics: Metrics
    word_suggestions: List[WordSuggestion]
    tone_issues: List[str]
    positive_aspects: List[str]
    refined_version: str
    coaching_feedback: str


@router.post("/cs-refine", response_model=CSRefineResponse)
async def cs_refine(req: CSRefineRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    prompt = f"""You are an expert customer service communication coach and linguist.
Analyze the following customer service message or draft response for tone, professionalism, empathy, and clarity.

CRITICAL: Respond with ONLY a raw JSON object — no markdown, no code fences, no extra text before or after.

Use exactly this structure:
{{
  "verdict": "Acceptable",
  "rudeness_score": 20,
  "metrics": {{
    "overall": 85,
    "professionalism": 80,
    "empathy": 90,
    "clarity": 85
  }},
  "word_suggestions": [
    {{
      "original": "problematic word or phrase from the text",
      "replacement": "better alternative",
      "reason": "Why this change improves the message"
    }}
  ],
  "tone_issues": [
    "Description of a specific tone problem found"
  ],
  "positive_aspects": [
    "Something the writer did well"
  ],
  "refined_version": "The fully rewritten, polished customer-facing response",
  "coaching_feedback": "A short, encouraging 2-3 sentence coaching paragraph for the agent"
}}

Rules for verdict:
- "Acceptable": rudeness_score 0-30, overall >= 75
- "Needs Improvement": rudeness_score 31-60 OR overall 50-74
- "Not Recommended": rudeness_score > 60 OR overall < 50

Rules for scores: All scores are 0-100 integers.
Rules for rudeness_score: 0 = perfectly polite, 100 = extremely rude/hostile.
Include 3-6 word_suggestions, 2-5 tone_issues, and 2-5 positive_aspects.

Text to analyze:
{req.text}"""

    try:
        raw = await generate(prompt, temperature=0.2)
        data = extract_json(raw)
        return CSRefineResponse(
            verdict=data.get("verdict", "Needs Improvement"),
            rudeness_score=int(data.get("rudeness_score", 50)),
            metrics=Metrics(**data.get("metrics", {"overall": 50, "professionalism": 50, "empathy": 50, "clarity": 50})),
            word_suggestions=[WordSuggestion(**w) for w in data.get("word_suggestions", [])],
            tone_issues=data.get("tone_issues", []),
            positive_aspects=data.get("positive_aspects", []),
            refined_version=data.get("refined_version", ""),
            coaching_feedback=data.get("coaching_feedback", ""),
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
