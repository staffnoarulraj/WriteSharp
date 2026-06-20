@echo off
echo Starting WriteSharp Backend...
echo.

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env and add your GEMINI_API_KEY.
    echo.
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist "backend\venv" (
    echo Creating virtual environment...
    python -m venv backend\venv
)

echo Activating virtual environment...
call backend\venv\Scripts\activate

echo Installing/checking dependencies...
pip install -r backend\requirements.txt -q

echo.
echo Starting FastAPI server on http://localhost:8000
echo API docs available at http://localhost:8000/docs
echo.
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
