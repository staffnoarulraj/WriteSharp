from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import json
from backend.gemini_client import generate

router = APIRouter()


class SummarizeRequest(BaseModel):
    text: str


class SummarizeResponse(BaseModel):
    executive_summary: str
    key_takeaways: List[str]


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    prompt = f"""You are an expert summarization assistant. Analyze the following text and produce a structured summary.

CRITICAL: You MUST respond with ONLY a valid JSON object in this exact format:
{{
  "executive_summary": "A concise 2-4 sentence paragraph capturing the core message and most important information.",
  "key_takeaways": [
    "First key structural takeaway or insight",
    "Second key structural takeaway or insight",
    "Third key structural takeaway or insight",
    "Add more as needed (aim for 4-7 takeaways)"
  ]
}}

Do NOT include markdown code blocks, explanations, or any other text outside the JSON object.
Each takeaway should be a complete, self-contained sentence.

Text to summarize:
{req.text}"""

    try:
        raw = await generate(prompt, temperature=0.3)
        data = json.loads(raw)
        return SummarizeResponse(
            executive_summary=data.get("executive_summary", ""),
            key_takeaways=data.get("key_takeaways", []),
        )
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
