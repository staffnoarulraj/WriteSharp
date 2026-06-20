from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
import google.generativeai as genai
from backend.config import GEMINI_API_KEY, GEMINI_MODEL

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(GEMINI_MODEL)

router = APIRouter()

MODES = {
    "Standard":  "Rewrite the text maintaining the original meaning and tone, but using different words and sentence structures.",
    "Fluency":   "Rewrite the text to improve flow and readability. Fix awkward phrasing and make it sound natural.",
    "Formal":    "Rewrite the text in a professional, formal tone suitable for business or academic contexts.",
    "Creative":  "Rewrite the text with vivid, expressive language. Add flair and personality while preserving the core meaning.",
    "Shorten":   "Condense the text significantly. Remove redundant phrases and keep only the essential message.",
    "Expand":    "Expand the text by elaborating on ideas, adding context, examples, and details while preserving the original meaning.",
}


class ParaphraseRequest(BaseModel):
    text: str
    mode: str = "Standard"


class ParaphraseResponse(BaseModel):
    rewritten_text: str


@router.post("/paraphrase", response_model=ParaphraseResponse)
async def paraphrase(req: ParaphraseRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    words = req.text.split()
    if len(words) > 500:
        raise HTTPException(status_code=400, detail="Input exceeds 500 word limit.")

    mode_instruction = MODES.get(req.mode, MODES["Standard"])

    prompt = f"""You are an expert writing assistant. Your task is to paraphrase the provided text.

Mode instruction: {mode_instruction}

CRITICAL: You MUST respond with ONLY a valid JSON object in this exact format:
{{"rewritten_text": "your paraphrased text here"}}

Do NOT include markdown code blocks, explanations, or any other text outside the JSON object.

Text to paraphrase:
{req.text}"""

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.7,
            ),
        )
        data = json.loads(response.text)
        return ParaphraseResponse(rewritten_text=data.get("rewritten_text", ""))
    except json.JSONDecodeError:
        # Fallback: return raw text if JSON parse fails
        return ParaphraseResponse(rewritten_text=response.text.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")
