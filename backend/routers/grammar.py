from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import json
import google.generativeai as genai
from backend.config import GEMINI_API_KEY, GEMINI_MODEL

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(GEMINI_MODEL)

router = APIRouter()


class GrammarRequest(BaseModel):
    text: str


class GrammarError(BaseModel):
    word: str
    index: int          # character index in the original text
    length: int         # length of the erroneous token
    suggestion: str
    reason: str


class GrammarResponse(BaseModel):
    errors: List[GrammarError]
    corrected_text: str


@router.post("/grammar-check", response_model=GrammarResponse)
async def grammar_check(req: GrammarRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    prompt = f"""You are an expert grammar and style checker. Analyze the following text for grammatical errors, spelling mistakes, punctuation issues, and style problems.

CRITICAL: You MUST respond with ONLY a valid JSON object in this exact format:
{{
  "errors": [
    {{
      "word": "the exact incorrect word or phrase from the text",
      "index": 0,
      "length": 5,
      "suggestion": "the corrected word or phrase",
      "reason": "Brief explanation of why this is an error and what grammar rule applies"
    }}
  ],
  "corrected_text": "The fully corrected version of the entire input text"
}}

Rules:
- "index" must be the exact character position (0-based) of the error in the original text
- "length" must be the exact character length of the erroneous word/phrase
- "word" must exactly match the substring at position [index:index+length] in the original text
- If there are no errors, return an empty "errors" array and the original text as "corrected_text"
- Do NOT include markdown code blocks or any text outside the JSON object

Text to analyze:
{req.text}"""

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1,
            ),
        )
        data = json.loads(response.text)
        errors = [GrammarError(**e) for e in data.get("errors", [])]
        return GrammarResponse(
            errors=errors,
            corrected_text=data.get("corrected_text", req.text),
        )
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
