from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import paraphraser, summarizer, grammar, cs_refiner

app = FastAPI(
    title="WriteSharp API",
    description="AI-powered writing assistant backend using Google Gemini",
    version="1.0.0",
)

# Allow frontend dev server (Vite default: 5173) and production origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all feature routers under /api prefix
app.include_router(paraphraser.router, prefix="/api", tags=["Paraphraser"])
app.include_router(summarizer.router, prefix="/api", tags=["Summarizer"])
app.include_router(grammar.router, prefix="/api", tags=["Grammar"])
app.include_router(cs_refiner.router, prefix="/api", tags=["CS Refiner"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "WriteSharp API"}
