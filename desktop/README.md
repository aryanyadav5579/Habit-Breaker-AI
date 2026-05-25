# Habit Breaker AI Desktop Monitor

The desktop monitor is a Windows-first background agent that reports active applications, window titles, idle time, switching frequency, and app restrictions to the FastAPI backend.

## Run

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r desktop\requirements.txt
copy desktop\config.example.json desktop\config.json
python desktop\monitor.py --config desktop\config.json
```

Use a JWT from the web login response or set `HABIT_TOKEN` in the environment. Set `HABIT_API_BASE_URL` to your Render backend URL for production.

## Enforcement

When backend settings enable blocking or child-safe mode, apps listed in `distracting_apps` or `blocked_apps` are terminated and logged. Set `enforce_blocking` to `false` for audit-only monitoring.

