# WriteSharp — AI Writing Assistant

A production-ready, full-stack AI writing assistant built with **FastAPI** + **React** + **Tailwind CSS v3** + **Google Gemini**.

## Features

| Tool | Description |
|---|---|
| **Paraphraser** | Rewrite text in 6 modes (Standard, Fluency, Formal, Creative, Shorten, Expand) with inline word diff |
| **Summarizer** | Generate executive summaries + structured key takeaways |
| **Grammar Checker** | Highlight errors with hover tooltips showing corrections and grammar rules |
| **CS Response Refiner** | Full cockpit dashboard: verdict badge, rudeness meter, 4-metric score cards, word suggestions, tone analysis, refined reply, and coaching feedback |

## Tech Stack

- **Backend:** Python 3.11+ · FastAPI · Google Gemini API (`gemini-2.0-flash`)
- **Frontend:** React 18 · Vite · Tailwind CSS v3
- **Design:** Liquid Glass (Glassmorphism) · Moon Dust color palette · Dark canvas `#0B0C16`

---

## Setup & Run

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- A valid [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

### 1. Clone & Set Up Environment

```bash
cd WriteSharp

# Create .env from template
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000  
Interactive docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api → backend on :8000)
npm run dev
```

The app will be available at: http://localhost:5173

---

## Project Structure

```
WriteSharp/
├── .env.example              # Env template
├── backend/
│   ├── main.py               # FastAPI app + CORS + routers
│   ├── config.py             # Env loader
│   ├── gemini_client.py      # Gemini SDK singleton
│   ├── requirements.txt
│   └── routers/
│       ├── paraphraser.py    # POST /api/paraphrase
│       ├── summarizer.py     # POST /api/summarize
│       ├── grammar.py        # POST /api/grammar-check
│       └── cs_refiner.py     # POST /api/cs-refine
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css          # Moon Dust design system
        ├── hooks/
        │   └── useApi.js
        └── components/
            ├── Sidebar.jsx
            ├── Paraphraser.jsx
            ├── Summarizer.jsx
            ├── GrammarChecker.jsx
            ├── CSRefiner.jsx
            └── ui/
                └── LoadingSpinner.jsx
```

## API Endpoints

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| POST | `/api/paraphrase` | `{text, mode}` | `{rewritten_text}` |
| POST | `/api/summarize` | `{text}` | `{executive_summary, key_takeaways}` |
| POST | `/api/grammar-check` | `{text}` | `{errors, corrected_text}` |
| POST | `/api/cs-refine` | `{text}` | Full analysis object |
| GET | `/api/health` | — | `{status, service}` |
