@echo off
title Habit Breaker AI — Launcher
color 0B
echo.
echo  =========================================
echo   Habit Breaker AI — Full Stack Launcher
echo  =========================================
echo.

:: ------------------------------------------
:: 1. Install backend dependencies
:: ------------------------------------------
echo [1/3] Installing backend dependencies...
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo  ERROR: pip install failed. Make sure your virtualenv is activated.
    echo  Run:  python -m venv .venv
    echo  Then: .venv\Scripts\activate
    pause
    exit /b 1
)
echo  Backend dependencies OK.
echo.

:: ------------------------------------------
:: 2. Start backend in new window
:: ------------------------------------------
echo [2/3] Starting FastAPI backend on port 10000...
start "Habit Breaker — Backend" cmd /k "python backend\app.py"
timeout /t 3 /nobreak >nul

:: ------------------------------------------
:: 3. Start frontend in new window
:: ------------------------------------------
echo [3/3] Starting React frontend on port 5173...
start "Habit Breaker — Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo  =========================================
echo   Platform is starting up!
echo  =========================================
echo.
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:10000
echo   API Docs : http://localhost:10000/docs
echo.
echo  Press any key to close this launcher...
pause >nul
