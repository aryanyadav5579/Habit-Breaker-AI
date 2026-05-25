# Habit Breaker AI

Habit Breaker AI is a full-stack productivity intelligence platform built to help people stay focused, reduce digital distraction, monitor work patterns, and enforce healthy device usage across web, browser, and desktop environments.

The project combines productivity tracking, real-time distraction detection, website and app blocking, parental control workflows, and AI-assisted insights in a single system. It is designed as a practical platform rather than a demo-only prototype, with a React frontend, FastAPI backend, Chrome Extension, Windows desktop monitor, PostgreSQL-ready data model, and deployment configuration for Render, Vercel, and Docker.

## Overview

Habit Breaker AI is intended for:

- Individual users who want stronger focus and better screen-time awareness
- Students who need a distraction-reduced study environment
- Parents who want visibility and control over child activity
- Teams or operators who want analytics, reporting, and policy-based restrictions

The platform is structured as four connected parts:

- Web SaaS dashboard for analytics, settings, focus mode, reports, parent controls, and admin workflows
- FastAPI backend for authentication, activity ingestion, business logic, AI predictions, and realtime updates
- Chrome Extension for browser tab tracking, alerts, syncing, and website blocking
- Windows desktop monitor for active app tracking, idle detection, and optional restriction enforcement

## Core capabilities

- Secure authentication with JWT, bcrypt password hashing, role-based access control, session cookies, and password reset flows
- Productivity and distraction classification for websites, applications, and activity sessions
- Focus mode with warnings, optional blocking, timer support, and realtime dashboard updates
- Parent-child account linking with study schedules, usage policies, and child-safe restrictions
- App and website blocking with backend-synced policy lists
- Realtime alerting through WebSockets, extension notifications, and desktop monitoring events
- AI-assisted productivity scoring, trend analysis, and weekly reporting
- Docker and cloud deployment support for practical rollout

## Product areas

### Web dashboard

The dashboard includes:

- Landing page
- Login and registration
- Main productivity dashboard
- Analytics and trend views
- Focus mode controls
- Settings and policy management
- Parent control panel
- Child dashboard
- Reports view
- Admin panel

### Chrome Extension

The extension supports:

- Manifest V3 service worker architecture
- Tab activation and navigation tracking
- Distracting website detection
- Warning page redirects
- Browser notifications
- Backend sync for settings and block lists
- Child-safe mode and blocking workflows

### Desktop monitoring

The desktop monitor currently targets Windows and includes:

- Active application tracking
- Window title capture
- Idle time measurement
- App switching frequency tracking
- Backend activity logging
- Optional restricted app termination when blocking is enabled

## Tech stack

### Frontend

- React
- Vite
- Tailwind CSS
- Framer Motion
- Axios
- Recharts

### Backend

- FastAPI
- SQLAlchemy
- PostgreSQL-ready schema
- WebSockets
- JWT authentication
- bcrypt via Passlib

### Monitoring and AI

- Chrome Extension Manifest V3
- Python desktop agent
- scikit-learn-based classification utilities

### Deployment

- Render
- Vercel
- Docker
- Docker Compose

## Project structure

```text
habit-breaker1/
├── backend/        FastAPI application and backend services
├── database/       SQL schema and database assets
├── desktop/        Windows desktop monitoring service
├── extension/      Chrome Extension source
├── frontend/       React application
├── Dockerfile
├── docker-compose.yml
├── render.yaml
└── README.md
```

## Local development

### 1. Start the backend

From the project root:

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

Backend default URL:

```text
http://127.0.0.1:10000
```

API documentation:

```text
http://127.0.0.1:10000/docs
```

Default admin account:

- Email: `admin@habitbreaker.ai`
- Password: value of `DEFAULT_ADMIN_PASSWORD`

### 2. Start the frontend

Open a second terminal:

```powershell
cd habit-breaker1\frontend
npm install
npm run dev
```

The frontend usually runs on:

```text
http://localhost:5173
```

If port `5173` is already in use, Vite may automatically move to another port such as `5174`.

### 3. Launch with helper script

If you prefer a simpler local startup flow on Windows:

```powershell
cd habit-breaker1
start.bat
```

## Chrome Extension setup

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click `Load unpacked`
4. Select the `habit-breaker1/extension` folder
5. Open the extension popup
6. Set the backend URL
7. Login with your account
8. Click `Sync`

For production deployment, replace placeholder URLs such as `https://your-app-name.onrender.com` with your real backend URL in:

- `extension/manifest.json`
- `extension/background.js`
- `.env.example`
- `render.yaml`

## Desktop monitor setup

```powershell
cd habit-breaker1
pip install -r desktop\requirements.txt
copy desktop\config.example.json desktop\config.json
python desktop\monitor.py --config desktop\config.json
```

The desktop monitor reads backend connection details and authentication from `desktop/config.json` or environment variables. A JWT token can be placed there for local testing.

## Environment configuration

Use `.env.example` as the starting point for local or deployed configuration.

Important values include:

- `SECRET_KEY`
- `DATABASE_URL`
- `CORS_ORIGINS`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `RENDER_BACKEND_URL`
- `VITE_API_BASE_URL`

## API highlights

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/settings/me`
- `PUT /api/settings/me`
- `POST /api/activity/log`
- `GET /api/activity/recent`
- `GET /api/analytics/summary`
- `POST /api/focus/start`
- `POST /api/focus/stop`
- `GET /api/alerts`
- `POST /api/parent/children`
- `GET /api/admin/system`
- `GET /api/admin/users`
- `WS /api/ws/dashboard?token=<jwt>`

## Deployment

### Backend

Deploy the backend to Render using `render.yaml`.

### Frontend

Deploy the frontend to Vercel from the `frontend` directory and set:

```text
VITE_API_BASE_URL=https://your-backend-url.onrender.com
```

### Database

Use a PostgreSQL database in Render or any compatible managed PostgreSQL provider.

### Extension

After backend deployment, update host permissions and API URLs in the extension so it points to the live HTTPS backend instead of localhost.

## Security notes

This repository includes development-ready defaults, but production deployment should always harden the following:

- Replace the default `SECRET_KEY`
- Replace default admin credentials
- Use HTTPS in production
- Lock down CORS to known origins
- Review rate-limiting settings
- Keep database credentials outside source control

## Repository workflow

After cloning or editing locally, the usual Git workflow is:

```powershell
git add .
git commit -m "Describe your changes"
git push
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

