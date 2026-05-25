@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv .venv
)

echo Installing requirements...
".venv\Scripts\python.exe" -m pip install -r requirements.txt

if not exist ".matplotlib" mkdir ".matplotlib"
set SECRET_KEY=local-dev-secret
set MPLCONFIGDIR=%CD%\.matplotlib

echo.
echo Habit Breaker AI is starting...
echo Open http://127.0.0.1:10000
echo Login: admin@habitbreaker.ai
echo Password: ChangeMe123! unless DEFAULT_ADMIN_PASSWORD is set.
echo.
set PYTHONPATH=%CD%\backend
set PORT=10000
".venv\Scripts\python.exe" backend\app.py
