# Habit Breaker AI

Production-ready full-stack platform for productivity monitoring, distraction detection, focus management, desktop activity tracking, app and website blocking, and parent-child controls.

## What is included

- FastAPI backend with JWT auth, bcrypt password hashing, CSRF-aware cookie support, rate limiting, CORS, RBAC, WebSockets, and PostgreSQL models.
- React + Tailwind SaaS dashboard with landing, login/register, dashboard, analytics, focus mode, settings, parent controls, child dashboard, reports, and admin panel.
- Chrome Extension Manifest V3 with tab tracking, backend sync, notifications, page warnings, warning-page redirects, and child-safe blocking support.
- Windows desktop monitor that tracks active apps, idle time, switching frequency, focus duration, and can terminate restricted apps.
- AI productivity service for distraction probability, scoring, insights, and weekly recommendations.
- Dockerfile, docker-compose.yml, Render blueprint, .env.example, and PostgreSQL schema.

## Local backend

```powershell
cd habit-breaker1
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:PYTHONPATH="$PWD\backend"
$env:SECRET_KEY="dev-change-me"
$env:DEFAULT_ADMIN_PASSWORD="ChangeMe123!"
python backend\app.py
```

Backend runs on `http://127.0.0.1:10000`. The default admin is `admin@habitbreaker.ai` with the password in `DEFAULT_ADMIN_PASSWORD`.

## Local frontend

```powershell
cd habit-breaker1\frontend
npm install
npm run dev
```

Frontend runs on `http://127.0.0.1:5173` and proxies `/api` to the backend.

## Docker

```powershell
cd habit-breaker1
docker compose up --build
```

The production container builds the React app, serves it from FastAPI, and connects to PostgreSQL.

## Chrome extension

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Load unpacked and select `habit-breaker1/extension`.
4. In the extension popup, set the backend URL.
5. Login and click Sync.

For deployment, replace `https://your-app-name.onrender.com` in `extension/manifest.json`, `extension/background.js`, `.env.example`, and `render.yaml`.

## Desktop monitor

```powershell
cd habit-breaker1
pip install -r desktop\requirements.txt
copy desktop\config.example.json desktop\config.json
python desktop\monitor.py --config desktop\config.json
```

Paste a JWT token into `desktop/config.json` or set `HABIT_TOKEN`.

## API highlights

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|PUT /api/settings/me`
- `POST /api/activity/log`
- `GET /api/analytics/summary`
- `POST /api/focus/start`
- `POST /api/focus/stop`
- `GET /api/alerts`
- `POST /api/parent/children`
- `GET /api/admin/system`
- `WS /api/ws/dashboard?token=<jwt>`

## Deployment

- Render backend: use `render.yaml`.
- Vercel frontend: set `VITE_API_BASE_URL=https://your-app-name.onrender.com`.
- PostgreSQL: use Render managed database or any PostgreSQL-compatible URL.
- Chrome extension: update backend host permissions to the deployed HTTPS backend.

