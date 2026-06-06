# Habit Breaker AI

<div align="center">

**AI-powered productivity monitoring, distraction detection, parental control, and focus management platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

Habit Breaker AI is a full-stack productivity intelligence platform built to help people stay focused, reduce digital distraction, monitor work patterns, and enforce healthy device usage across web, browser, and desktop environments.

The project combines productivity tracking, real-time distraction detection, website and app blocking, parental control workflows, and AI-assisted insights in a single cohesive system. It is designed as a practical deployable platform, not a prototype — with a React frontend, FastAPI backend, Chrome Extension, Windows desktop monitor, PostgreSQL-ready data model, and deployment configuration for Render, Vercel, and Docker.

## Who it is for

| User type | What they get |
|---|---|
| **Individual users** | Focus tracking, AI scoring, screen-time awareness, website blocking |
| **Students** | Study-only mode, bedtime enforcement, distraction limits, streak motivation |
| **Parents** | Child account linking, activity visibility, policy enforcement, real-time alerts |
| **Operators / Teams** | Admin dashboard, user management, system metrics, reporting |

---

## Core capabilities

- **Authentication** — JWT access tokens, bcrypt password hashing, role-based access control (admin / parent / user / child), HttpOnly session cookies, CSRF protection, and password reset via email token
- **Activity classification** — Websites and applications classified as productive, distracting, or neutral using rule-based matching and a per-user Random Forest model with 5-minute TTL cache
- **Focus mode** — Timed focus blocks with Pomodoro support, SVG countdown timer, distraction warnings, optional blocking, and real-time dashboard integration
- **Parental controls** — Parent-child account linking, child-safe mode, study schedules, bedtime enforcement, daily usage limits per category, and one-click study-only restrictions
- **Blocking** — Per-user blocked website and app lists synced to the extension and desktop monitor; optional hard-redirect to warning page
- **Real-time alerting** — WebSocket-based live dashboard updates, browser notifications from the extension, and desktop monitor events
- **AI intelligence** — Productivity scoring, burnout risk detection, consecutive-day streak calculation, trend analysis, and weekly AI recommendation reports
- **Analytics** — 7×24 activity heatmap, daily trend charts, top distracting domains, top productive apps, focus session history
- **Deployment** — Docker, Docker Compose, Render (backend), Vercel (frontend), PostgreSQL cloud database support

---

## Tech stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| Recharts | Charts and data visualisation |
| Framer Motion | Animations |
| Axios / Fetch | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | API framework |
| SQLAlchemy 2 | ORM and schema management |
| PostgreSQL / SQLite | Database (SQLite for local, Postgres for production) |
| Passlib + bcrypt | Password hashing |
| python-jose | JWT token creation and verification |
| WebSockets | Real-time dashboard push |
| scikit-learn | Activity classification model |
| pandas / numpy | Data processing for AI features |

### Extension & Desktop
| Technology | Purpose |
|---|---|
| Chrome Extension Manifest V3 | Browser tab tracking and blocking |
| Python + psutil | Windows active window and process tracking |
| win32gui / win32process | Foreground window capture |

### Deployment
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerised local and production deployment |
| Render | Backend cloud hosting |
| Vercel | Frontend cloud hosting |

---

## Project structure

```
habit-breaker1/
│
├── backend/                          FastAPI application root
│   ├── app.py                        Uvicorn entry point — binds host, port, reload flag
│   ├── users.db                      SQLite database for local development
│   │
│   └── app/                          Main application package
│       ├── __init__.py
│       ├── main.py                   FastAPI app factory, middleware, CORS, router mount
│       ├── models.py                 SQLAlchemy ORM models (all tables)
│       ├── schemas.py                Pydantic request/response schemas
│       ├── ws.py                     WebSocket re-export shim → services/realtime.py
│       │
│       ├── api/                      HTTP route handlers
│       │   ├── __init__.py
│       │   ├── routes.py             All API endpoints (auth, activity, analytics,
│       │   │                         focus, alerts, parent, admin, extension, blocking)
│       │   ├── deps.py               FastAPI dependency functions (get_current_user,
│       │   │                         require_roles, can_manage_user)
│       │   ├── activity.py           Minimal shim — activity logging handled in routes.py
│       │   ├── extension.py          Minimal shim — extension bootstrap handled in routes.py
│       │   └── dashboard.py          Legacy dashboard helper utilities
│       │
│       ├── core/                     Cross-cutting concerns
│       │   ├── __init__.py
│       │   ├── config.py             Pydantic Settings — reads .env for all config values
│       │   └── security.py           Password hashing, JWT create/verify, CSRF token
│       │
│       ├── db/                       Database layer
│       │   ├── __init__.py
│       │   └── session.py            SQLAlchemy engine, SessionLocal, get_db dependency
│       │
│       └── services/                 Business logic and background services
│           ├── __init__.py
│           ├── ai.py                 AI classification service:
│           │                           - Rule-based domain/app category matching
│           │                           - Per-user Random Forest model with 5-min TTL cache
│           │                           - burnout_score() — screen fatigue detection
│           │                           - compute_streak() — consecutive goal days
│           │                           - insight_from_logs() — AI recommendation text
│           ├── classifier.py         Lightweight standalone keyword classifier (fallback)
│           └── realtime.py           WebSocket connection manager (per-user rooms,
│                                     broadcast helpers)
│
├── database/                         Database assets
│   └── schema.sql                    Full PostgreSQL schema — all tables, indices,
│                                     and seed data for production setup
│
├── desktop/                          Windows desktop monitoring agent
│   ├── monitor.py                    Main monitoring loop:
│   │                                   - Active window + process detection (win32gui / psutil)
│   │                                   - Idle time measurement (GetLastInputInfo)
│   │                                   - App switch frequency tracking
│   │                                   - Blocked app enforcement (process kill)
│   │                                   - Bedtime lock enforcement
│   │                                   - Offline queue with flush-on-reconnect
│   │                                   - Daily summary JSON log
│   │                                   - CLI flags: --dry-run, --login, --api
│   ├── config.example.json           Template config file for auth token and backend URL
│   ├── requirements.txt              Desktop-specific Python dependencies
│   └── README.md                     Desktop monitor setup guide
│
├── extension/                        Chrome Extension (Manifest V3)
│   ├── manifest.json                 Extension manifest — permissions, service worker,
│   │                                 content scripts, icons, web-accessible resources
│   ├── background.js                 Service worker:
│   │                                   - Tab activation and URL change tracking
│   │                                   - Domain-based distraction detection
│   │                                   - Blocked site redirect to warning.html
│   │                                   - chrome.idle API for idle state
│   │                                   - Offline activity queue (up to 50 events)
│   │                                   - Retry logic with exponential backoff (3 attempts)
│   │                                   - 401 token expiry detection + notification
│   │                                   - Periodic settings sync (every 5 minutes via alarm)
│   │                                   - Messages: SET_TOKEN, CLEAR_TOKEN, GET_STATE,
│   │                                               SET_FOCUS, SYNC_NOW, FLUSH_QUEUE
│   ├── content.js                    Content script injected into every page — sends
│   │                                 tab metadata and listens for focus events
│   ├── popup.html                    Extension popup UI — login form, stats bar,
│   │                                 auth section, policy snapshot
│   ├── popup.js                      Popup logic — login, logout, sync, focus toggle,
│   │                                 live stats display, SET_TOKEN messaging
│   ├── warning.html                  Blocked site warning page shown on redirect
│   ├── warning.js                    Warning page logic — displays blocked domain,
│   │                                 back button, unblock request
│   ├── styles.css                    Popup and warning page styles (dark theme)
│   └── icons/                        Extension icon assets
│       ├── icon.svg                  Source SVG icon
│       ├── icon16.png                16×16 toolbar icon
│       ├── icon32.png                32×32 icon
│       ├── icon48.png                48×48 extensions page icon
│       └── icon128.png               128×128 Chrome Web Store icon
│
├── frontend/                         React web application
│   ├── index.html                    Vite HTML entry point
│   ├── package.json                  npm manifest — scripts, dependencies, dev deps
│   ├── package-lock.json             Exact dependency lock file
│   ├── vite.config.js                Vite config — React plugin, API proxy to :10000,
│   │                                 host binding
│   ├── tailwind.config.js            Tailwind config — custom colors (ink, panel, mint,
│   │                                 leaf, sun, danger), shadows, animations
│   ├── postcss.config.js             PostCSS config for Tailwind + Autoprefixer
│   ├── vercel.json                   Vercel deployment config — SPA fallback routing
│   │
│   └── src/                          Application source
│       ├── main.jsx                  React entry point — renders App into #root
│       ├── App.jsx                   Router setup — all page routes, auth guards,
│       │                             role-based route protection
│       │
│       ├── api/                      API client layer
│       │   ├── client.js             Axios instance with JWT auth headers, CSRF token
│       │   │                         support, safeGet() helper with fallback values
│       │   └── dashboard.js          Dashboard-specific API call helpers
│       │
│       ├── components/               Shared UI components
│       │   ├── Shell.jsx             App shell — sidebar navigation, mobile hamburger,
│       │   │                         notification bell (unread count), live pulse dot,
│       │   │                         user card, logout, theme toggle
│       │   └── MetricCard.jsx        Reusable KPI card with icon, value, label, tone
│       │
│       ├── context/                  React context providers
│       │   └── AuthContext.jsx       Auth state — current user, login(), logout(),
│       │                             token management, role helpers
│       │
│       ├── hooks/                    Custom React hooks
│       │   └── useRealtime.js        WebSocket hook — connects to /api/ws/dashboard,
│       │                             reconnects on drop, pushes events to components
│       │
│       ├── pages/                    Route-level page components
│       │   ├── Landing.jsx           Public landing page — hero, features, CTA
│       │   ├── Login.jsx             Login and register forms with role selection
│       │   ├── Dashboard.jsx         Main dashboard — productivity score, focus hours,
│       │   │                         distraction count, streak badge, burnout badge,
│       │   │                         goal progress bar, recent activity feed,
│       │   │                         live WebSocket alert stream
│       │   ├── Analytics.jsx         Analytics — 7×24 activity heatmap, daily line chart,
│       │   │                         horizontal bar charts (top sites/apps), AI insights,
│       │   │                         burnout alert panel, period selector
│       │   ├── FocusMode.jsx         Focus session — SVG countdown ring timer, Pomodoro
│       │   │                         mode toggle, duration slider, live stats panel,
│       │   │                         session history, enforcement checklist
│       │   ├── Settings.jsx          Settings — tag chip input for site/app lists,
│       │   │                         work schedule pickers, bedtime schedule pickers,
│       │   │                         daily limit sliders, sensitivity slider,
│       │   │                         blocking toggles, alert sound selector
│       │   ├── ParentPanel.jsx       Parent controls — create child account form,
│       │   │                         linked children list, click-to-expand activity viewer,
│       │   │                         one-click study mode, unread child alerts
│       │   ├── ChildDashboard.jsx    Child-safe view — goal progress bar, streak badge,
│       │   │                         active restrictions list, blocked sites chips,
│       │   │                         AI study guidance
│       │   ├── Reports.jsx           Weekly report — streak card, burnout risk card,
│       │   │                         weekly area chart, AI recommendations, export button
│       │   └── AdminPanel.jsx        Admin — system metrics (5 KPI cards), user table
│       │                             with role badges, active/disable toggle, refresh
│       │
│       └── styles/
│           └── index.css             Global styles — Inter font, scrollbar, Tailwind
│                                     @apply utilities, badge variants, pulse-dot
│                                     animation, fadein animation, card-hover effect
│
├── model/
│   └── model.pkl                     Pre-trained scikit-learn Random Forest model
│                                     used as fallback for new users with <30 activity logs
│
├── data/                             Sample and seed data directory
├── dashboard/                        Legacy Flask dashboard templates (superseded by React)
│
├── .env.example                      Environment variable template — copy to .env
├── .gitignore                        Git ignore rules (venv, __pycache__, .env, node_modules)
├── Dockerfile                        Docker image definition for backend
├── docker-compose.yml                Docker Compose — backend + PostgreSQL services
├── render.yaml                       Render deployment manifest — web service + database
├── requirements.txt                  Python dependencies for the backend
├── make_icons.py                     Utility script to regenerate extension PNG icons
│                                     from the source image (requires Pillow)
├── start.bat                         One-click Windows launcher — opens backend and
│                                     frontend in separate terminal windows
├── run_server.bat                    Alternative backend-only startup script
├── habit_breaker.db                  SQLite database file (local development only,
│                                     not committed in production)
├── LICENSE                           MIT License
└── README.md                         This file
```

---

## API reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user (name, email, password, role) |
| `POST` | `/api/auth/login` | Login — returns JWT + sets HttpOnly cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Return current authenticated user profile |
| `POST` | `/api/auth/forgot-password` | Send password reset token |
| `POST` | `/api/auth/reset-password` | Complete password reset with token |

### Settings

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/settings/me` | Fetch current user's settings |
| `PUT` | `/api/settings/me` | Update current user's settings |
| `GET` | `/api/settings/{user_id}` | Fetch another user's settings (admin / parent) |
| `PUT` | `/api/settings/{user_id}` | Update another user's settings (admin / parent) |

### Activity

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/activity/log` | Ingest an activity event (from extension or desktop) |
| `GET` | `/api/activity/recent` | Recent activity logs for the authenticated user |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/summary` | Productivity summary — score, focus hours, trends, heatmap, top sites/apps |
| `GET` | `/api/analytics/streak` | Streak days and burnout risk score |

### Focus sessions

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/focus/start` | Start a focus session with planned duration |
| `POST` | `/api/focus/stop` | End current focus session — returns score and distraction count |
| `GET` | `/api/focus/current` | Get active focus session or null |

### Alerts

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/alerts` | List alerts for the current user |
| `POST` | `/api/alerts/{id}/acknowledge` | Mark an alert as read |

### Blocking

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/blocking/websites` | Add a blocked website |
| `DELETE` | `/api/blocking/websites/{domain}` | Remove a blocked website |
| `GET` | `/api/blocking/websites` | List blocked websites |
| `POST` | `/api/blocking/apps` | Add a blocked app |
| `DELETE` | `/api/blocking/apps/{name}` | Remove a blocked app |
| `GET` | `/api/blocking/apps` | List blocked apps |

### Parent controls

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/parent/children` | Create and link a child account |
| `GET` | `/api/parent/children` | List linked child accounts |
| `GET` | `/api/parent/children/{id}/activity` | Recent activity for a specific child |

### Reports

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports/weekly` | Weekly productivity report with AI recommendations |

### Extension

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/extension/bootstrap` | Sync endpoint — returns settings, block lists, and policies |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/users` | List all platform users |
| `PATCH` | `/api/admin/users/{id}/toggle` | Enable or disable a user account |
| `GET` | `/api/admin/system` | Platform-wide system metrics |

### WebSocket

| Protocol | Endpoint | Description |
|---|---|---|
| `WS` | `/api/ws/dashboard?token=<jwt>` | Real-time dashboard event stream — receives live alerts, activity events, and focus session updates |

---

## Local development

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm 9 or higher
- Git

### 1. Clone the repository

```powershell
git clone https://github.com/your-username/habit-breaker1.git
cd habit-breaker1
```

### 2. Set up the backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

$env:PYTHONPATH = "$PWD\backend"
$env:SECRET_KEY = "dev-change-me-in-production"
$env:DEFAULT_ADMIN_PASSWORD = "ChangeMe123!"

python backend\app.py
```

The backend starts at:
```
http://127.0.0.1:10000
```

Interactive API docs:
```
http://127.0.0.1:10000/docs
```

Default admin account:
- Email: `admin@habitbreaker.ai`
- Password: value of `DEFAULT_ADMIN_PASSWORD`

### 3. Set up the frontend

Open a second terminal:

```powershell
cd habit-breaker1\frontend
npm install
npm run dev
```

The frontend runs at:
```
http://localhost:5173
```

> **Important:** Always run `npm run dev` from the `frontend/` subdirectory. Running it from the project root will fail because `package.json` is inside `frontend/`.

### 4. One-click launcher (Windows)

Alternatively, with your virtualenv already activated:

```powershell
cd habit-breaker1
.\start.bat
```

This installs dependencies, then opens the backend and frontend in separate terminal windows automatically.

---

## Chrome Extension setup

1. Open **`chrome://extensions`** in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the **`habit-breaker1/extension`** folder
5. Open the extension popup (click the toolbar icon)
6. Enter your backend URL (e.g. `http://localhost:10000` for local development)
7. Enter your email and password and click **Login & connect**
8. Click **Sync** to pull your settings and block lists

For production deployment, update the backend URLs in:
- `extension/manifest.json` → `host_permissions`
- `extension/background.js` → `CONFIG.API_BASE`

---

## Desktop monitor setup

```powershell
cd habit-breaker1

# Install desktop dependencies
pip install -r desktop\requirements.txt

# Copy and edit config
copy desktop\config.example.json desktop\config.json

# First time — authenticate and save token
python desktop\monitor.py --login

# Normal run
python desktop\monitor.py

# Dry run — observe and log without blocking or sending data
python desktop\monitor.py --dry-run
```

The monitor saves daily logs to `~/.habitbreaker/logs/` and syncs settings from the backend every 5 minutes.

---

## Environment configuration

Copy `.env.example` to `.env` and fill in the values before running:

```powershell
copy .env.example .env
```

Key variables:

| Variable | Description |
|---|---|
| `SECRET_KEY` | JWT signing key — use a long random string in production |
| `DATABASE_URL` | PostgreSQL URL, e.g. `postgresql://user:pass@host/db` |
| `CORS_ORIGINS` | Comma-separated allowed origins, e.g. `https://yourdomain.com` |
| `DEFAULT_ADMIN_EMAIL` | Admin account email created on first startup |
| `DEFAULT_ADMIN_PASSWORD` | Admin account password — change immediately after deploy |
| `RENDER_BACKEND_URL` | Your Render backend URL (used by extension and render.yaml) |
| `VITE_API_BASE_URL` | Backend URL for the frontend build (set in Vercel) |

---

## Deployment

### Backend — Render

The `render.yaml` file includes a complete Render service definition. Push your code to GitHub, connect the repository in Render, and it will deploy automatically.

Set the following environment variables in Render:
- `SECRET_KEY`
- `DATABASE_URL` (from a Render PostgreSQL add-on)
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `CORS_ORIGINS`

### Frontend — Vercel

Deploy from the `frontend/` directory in Vercel. Set:
```
VITE_API_BASE_URL=https://your-backend.onrender.com
```

Add a rewrite rule for SPA routing (already included in `vercel.json`).

### Docker

Build and run both services locally with Docker Compose:

```bash
docker-compose up --build
```

The Compose file spins up the FastAPI backend and a PostgreSQL database container.

---

## Database

The backend uses SQLite for local development (auto-created as `habit_breaker.db`).

For production, set `DATABASE_URL` to a PostgreSQL connection string. The full schema is available in `database/schema.sql` for direct database setup without the ORM.

SQLAlchemy creates all tables automatically on startup using `Base.metadata.create_all()`.

---

## Security

This repository ships with development-ready defaults. Before any production deployment:

- Replace `SECRET_KEY` with a cryptographically random string (minimum 32 bytes)
- Change the default admin email and password immediately after first login
- Set `CORS_ORIGINS` to only your known frontend domains
- Use HTTPS everywhere — never expose the backend over plain HTTP
- Keep all credentials in environment variables, never in source code
- Review and tighten rate-limiting settings for your expected traffic
- Store your database credentials in your hosting provider's secrets manager

---

## Git workflow

```powershell
git add .
git commit -m "Describe your changes clearly"
git push
```

For feature work, use a branch:

```powershell
git checkout -b feature/my-feature
# make changes
git add .
git commit -m "feat: add my feature"
git push -u origin feature/my-feature
# then open a pull request
```

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
