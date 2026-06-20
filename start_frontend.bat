@echo off
echo Starting WriteSharp Frontend...
echo.

REM Check if node_modules exists
if not exist "frontend\node_modules" (
    echo Installing npm dependencies...
    cd frontend
    npm install
    cd ..
)

echo.
echo Starting Vite dev server on http://localhost:5173
echo.
cd frontend && npm run dev
