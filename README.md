<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Inter&weight=800&size=40&pause=1000&color=2DD4BF&center=true&vCenter=true&repeat=false&width=600&height=80&lines=Habit+Breaker+AI" alt="Habit Breaker AI" />

### 🧠 AI-Powered Productivity Intelligence Platform

**Enterprise-grade focus management, real-time distraction detection, parental controls,**  
**and behavioral analytics — unified across web, browser, and desktop.**

<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Render](https://img.shields.io/badge/Render-Deployed-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-FF6B6B?style=for-the-badge)](CONTRIBUTING.md)

<br/>

[🚀 Live Demo](https://habitbreaker.onrender.com) · [📖 API Docs](https://habitbreaker.onrender.com/docs) · [🐛 Report Bug](https://github.com/aryanyadav5579/Habit-Breaker-AI/issues) · [✨ Request Feature](https://github.com/aryanyadav5579/Habit-Breaker-AI/issues)

<br/>

> **"Built for individuals, students, parents, and teams who want intelligent control over digital habits — not just another screen-time counter."**

</div>

---

## 📋 Table of Contents

| Section | Description |
|---|---|
| [🏗️ System Architecture](#system-architecture) | Multi-layer architecture diagram |
| [✨ Feature Showcase](#feature-showcase) | Complete platform capabilities |
| [🔬 Technical Stack](#technical-stack) | Every technology, explained |
| [📁 Project Structure](#project-structure) | Full annotated codebase map |
| [🔐 Security Architecture](#security-architecture) | Enterprise security implementation |
| [📈 Scalability Roadmap](#scalability-roadmap) | How the system grows |
| [🌐 API Reference](#api-reference) | Complete endpoint documentation |
| [🚀 Getting Started](#getting-started) | Setup in under 5 minutes |
| [☁️ Deployment](#deployment) | Render, Vercel, Docker |
| [🤝 Contributing](#contributing) | Contribution guidelines |

---

## 🏗️ System Architecture

> **Habit Breaker AI** follows a **Modular Monolith with Service Layer Architecture** — clean separation of concerns at every layer, designed to evolve into microservices as scale demands.

```
╔══════════════════════════════════════════════════════════════════╗
║                     PRESENTATION LAYER                          ║
║                                                                  ║
║   🌐 React SPA          🧩 Chrome Extension    🖥️ Desktop Agent  ║
║   (Vite + Tailwind)     (Manifest V3 MV3)      (Python + Win32) ║
║   localhost:5173        chrome://extensions     background proc  ║
╚═══════════════════════╦══════════════════════╦═══════════════════╝
                        ║     HTTPS / WSS      ║
╔═══════════════════════╩══════════════════════╩═══════════════════╗
║                        API GATEWAY LAYER                         ║
║                                                                  ║
║              🚀 FastAPI Application Server                       ║
║          (Uvicorn ASGI · port 10000 · async I/O)                 ║
║                                                                  ║
║   ┌─────────────┐  ┌─────────────┐  ┌────────────────────────┐  ║
║   │  REST API   │  │  WebSocket  │  │  Static File Server    │  ║
║   │  /api/v1/*  │  │  /api/ws/*  │  │  /static/*             │  ║
║   └──────┬──────┘  └──────┬──────┘  └────────────────────────┘  ║
╚══════════╬════════════════╬═════════════════════════════════════╝
           ║   MIDDLEWARE   ║
           ║  ┌─────────────────────────────────────────────────┐ ║
           ║  │  CORS · CSRF · Rate Limiting · Auth · Logging   │ ║
           ║  └─────────────────────────────────────────────────┘ ║
╔══════════╩════════════════╩═════════════════════════════════════╗
║                     BUSINESS LOGIC LAYER                         ║
║                                                                  ║
║  ┌───────────────┐  ┌──────────────┐  ┌──────────────────────┐  ║
║  │  Auth Service │  │ Focus Engine │  │  Alert Service       │  ║
║  │  RBAC · JWT   │  │ Timer · Lock │  │  WebSocket Push      │  ║
║  └───────────────┘  └──────────────┘  └──────────────────────┘  ║
║  ┌───────────────┐  ┌──────────────┐  ┌──────────────────────┐  ║
║  │ Parent Control│  │ Block Engine │  │  Report Generator    │  ║
║  │ Child Safety  │  │ App + Web    │  │  Weekly AI Summary   │  ║
║  └───────────────┘  └──────────────┘  └──────────────────────┘  ║
╚══════════════════════════╦══════════════════════════════════════╝
                           ║
╔══════════════════════════╩══════════════════════════════════════╗
║                    AI INTELLIGENCE LAYER                         ║
║                                                                  ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │            🧠 ML Classification Engine                   │    ║
║  │                                                          │    ║
║  │  Rule Engine → Domain Matching → RF Classifier (pkl)    │    ║
║  │  Per-user Model Cache (5-min TTL) · Thread-safe Lock    │    ║
║  │                                                          │    ║
║  │  burnout_score() · compute_streak() · insight_from_logs │    ║
║  └─────────────────────────────────────────────────────────┘    ║
╚══════════════════════════╦══════════════════════════════════════╝
                           ║
╔══════════════════════════╩══════════════════════════════════════╗
║                       DATA LAYER                                 ║
║                                                                  ║
║   🗄️ SQLAlchemy ORM         📊 Analytics Aggregation             ║
║   SQLite (local dev)        Heatmap · Trend · Streak             ║
║   PostgreSQL (production)   Counter · defaultdict pipelines      ║
╚══════════════════════════════════════════════════════════════════╝
```

### 🔄 Data Flow

```
User Action (Tab Switch / App Open / Form Submit)
       │
       ▼
[Chrome Extension / Desktop Monitor / Web UI]
       │ HTTP POST /api/activity/log
       ▼
[FastAPI Route Handler]
       │
       ├──► [AI Service] classify_activity() → productive / distracting / neutral
       │         │
       │         └──► [RF Model Cache] per-user TTL cache → predict probability
       │
       ├──► [Database] INSERT ActivityLog + UPDATE ProductivityScore
       │
       └──► [WebSocket Manager] broadcast_to_user() → live dashboard update
                   │
                   ▼
            [React Dashboard] real-time activity feed + alert stream
```

---

## ✨ Feature Showcase

### 🎯 Productivity Tracking & Focus Management

| Feature | What It Does | Business Value |
|---|---|---|
| **AI Focus Sessions** | Timed work blocks with SVG countdown ring, Pomodoro mode, and distraction logging | Increases deep work hours by building consistent focus habits |
| **Productivity Scoring** | Per-session AI score (0–100%) based on app usage composition | Objective measurement replaces guesswork with data |
| **Goal Progress Tracking** | Daily focus-hour targets with visual progress bar and streak counter | Gamification increases daily engagement and habit formation |
| **App Switch Detection** | Measures how frequently the user context-switches between applications | Identifies task fragmentation — the hidden productivity killer |
| **Idle Time Tracking** | Detects keyboard/mouse inactivity using `GetLastInputInfo` | Separates genuine focus from passive screen time |

### 🤖 AI Intelligence Engine

| Feature | Technical Implementation | Why It Matters |
|---|---|---|
| **ML Classification** | Random Forest classifier trained on domain + app signals, per-user model cache with 5-min TTL | Personalises distraction detection rather than applying universal rules |
| **Burnout Detection** | `burnout_score()` — weighted ratio of screen hours vs productive ratio | Prevents overwork loops that destroy sustained performance |
| **Streak Intelligence** | `compute_streak()` — consecutive days meeting daily goal in activity logs | Motivational feedback loop grounded in behavioural science |
| **AI Recommendations** | `insight_from_logs()` — natural language tips from activity pattern analysis | Actionable intelligence, not raw data dumps |
| **Probability Scoring** | `distraction_probability` float attached to every activity log event | Enables nuanced filtering vs binary block/allow decisions |

### 📊 Analytics & Insights

- **7×24 Activity Heatmap** — hourly granularity across all 7 weekdays, colour-coded by intensity
- **Daily Trend Charts** — productive / distracting / neutral minutes per day over 7, 30, or 90 days
- **Top Distracting Domains** — horizontal bar chart ranked by accumulated time
- **Top Productive Apps** — ranked productive application usage
- **Weekly AI Reports** — auto-generated reports with burnout risk, streak status, and 5 personalised AI recommendations
- **Period Selector** — switch between 7-day, 30-day, and 90-day analytics windows

### 🔒 Blocking Engine

- **Website Blocking** — per-user blocked domain lists synced to Chrome Extension and desktop agent; redirects to branded warning page
- **App Blocking** — per-user process name blocklist; desktop monitor terminates blocked processes on detection
- **Policy Sync** — extension and desktop agent pull updated policies from `/api/extension/bootstrap` every 5 minutes
- **Distraction Warnings** — non-blocking notifications during focus sessions for distracting-but-not-blocked sites

### 👨‍👩‍👧 Parental Control System

- **Child Account Creation** — parent creates linked child accounts with display names and temporary passwords
- **One-Click Study Mode** — applies full restriction profile: blocks social/gaming sites, sets daily limits, enables child-safe scoring
- **Bedtime Enforcement** — scheduler locks device access outside defined hours (configurable start/end)
- **Study Schedules** — per-child work window configuration
- **Daily Category Limits** — separate time caps for social media, video streaming, and games
- **Activity Visibility** — parent views child's real-time activity log, unread alerts, and category breakdown
- **Child Dashboard** — age-appropriate safe view: goal progress, restrictions list, study guidance, streak badge

### 🖥️ Desktop Monitoring Agent

- **Active Window Capture** — `win32gui.GetForegroundWindow()` + `win32process.GetWindowThreadProcessId()` for process identification
- **Cross-Platform Fallback** — `psutil` process enumeration when win32 libraries are unavailable
- **Offline Queue** — up to 200 activity events queued locally when backend is unreachable; auto-flushed on reconnect
- **Daily Summary Logs** — JSON summaries written to `~/.habitbreaker/logs/summary_YYYY-MM-DD.json`
- **Dry Run Mode** — `--dry-run` flag for observation without enforcement or data transmission
- **CLI Authentication** — `--login` flag for interactive credential capture and token storage

### 🧩 Chrome Extension (Manifest V3)

- **Tab Lifecycle Tracking** — `tabs.onActivated` + `tabs.onUpdated` with 15-second deduplication window
- **Idle State Detection** — `chrome.idle` API integration for accurate active vs idle time
- **Offline Activity Queue** — 50-event local buffer with automatic flush on next successful sync
- **Token Expiry Handling** — 401 response detection triggers desktop notification and credential clear
- **Focus Mode Integration** — `SET_FOCUS` message activates stricter distraction warnings across all tabs
- **Retry Logic** — 3-attempt exponential backoff for all API requests
- **Live Popup Stats** — real-time display of current domain, queued log count, idle state

### 📡 Real-Time Communication

- **WebSocket Rooms** — per-user connection rooms managed by `ConnectionManager`; efficient targeted broadcasting
- **Live Dashboard Feed** — activity events, alerts, and focus session updates pushed within ~100ms
- **Alert Stream** — distraction threshold breaches generate server-side alerts pushed live to dashboard
- **Extension Notifications** — `chrome.notifications` API for immediate browser-level distraction warnings

---

## 🔬 Technical Stack

### 🚀 Frontend Stack

| Technology | Version | Role |
|---|---|---|
| **React** | 18 | Component-based UI framework with hooks-first architecture |
| **Vite** | 6 | Sub-second HMR development server; optimised production builds |
| **Tailwind CSS** | 3 | Utility-first styling with custom design tokens (ink, mint, panel, line) |
| **Recharts** | 2 | Composable charting library — AreaChart, BarChart, LineChart |
| **Lucide React** | latest | Consistent icon system (240+ icons, tree-shakeable) |
| **React Router** | 6 | Client-side routing with role-based route guards |

### ⚡ Backend Stack

| Technology | Version | Role |
|---|---|---|
| **FastAPI** | 0.115 | Async Python API framework with automatic OpenAPI documentation |
| **Uvicorn** | 0.34 | ASGI server with lifespan management and WebSocket support |
| **SQLAlchemy** | 2.0 | ORM with declarative models, relationship loading, and session management |
| **Pydantic** | 2 | Request/response validation, settings management, type enforcement |
| **Starlette** | latest | ASGI primitives — middleware, routing, WebSockets, static files |

### 🧠 AI & ML Stack

| Technology | Version | Role |
|---|---|---|
| **scikit-learn** | 1.6 | Random Forest classifier for activity categorisation |
| **pandas** | 2.2 | Tabular data processing for model training and analytics aggregation |
| **numpy** | 2.2 | Numerical operations for probability scoring and trend computation |
| **joblib** | 1.4 | Model serialisation / deserialisation (`model.pkl` loading) |

### 🗄️ Database Stack

| Technology | Role |
|---|---|
| **SQLite** | Local development — zero-config, auto-created, embedded |
| **PostgreSQL** | Production — managed cloud database via Render add-on |
| **SQLAlchemy Core** | Raw SQL fallback for complex analytics aggregation queries |

### 🔐 Security Stack

| Technology | Role |
|---|---|
| **python-jose** | JWT access token creation, signing (HS256), and verification |
| **Passlib + bcrypt** | Password hashing with work factor tuning; explicit 72-byte truncation |
| **UUID tokens** | Stateless CSRF token generation and cookie-based validation |
| **HttpOnly Cookies** | Session token storage invisible to JavaScript — XSS mitigation |

### 📡 Communication Stack

| Technology | Role |
|---|---|
| **WebSockets (Starlette)** | Persistent bidirectional connections for real-time dashboard events |
| **Chrome Notifications API** | Browser-native distraction and blocking notifications |
| **Fetch API** | Extension and desktop monitor HTTP communication |
| **Axios** | Frontend HTTP client with interceptor chain for auth headers |

### ☁️ DevOps Stack

| Technology | Role |
|---|---|
| **Docker** | Containerised backend image with multi-stage build |
| **Docker Compose** | Local orchestration of backend + PostgreSQL |
| **Render** | Backend cloud hosting with auto-deploy from GitHub |
| **Vercel** | Frontend CDN hosting with SPA routing config |
| **render.yaml** | Infrastructure-as-code for full Render service definition |

---

## 📁 Project Structure

```
habit-breaker1/
│
│  ┌─────────────────────────────────────────────────────────────┐
│  │  🚀 CORE APPLICATIONS                                       │
│  └─────────────────────────────────────────────────────────────┘
│
├── 📂 backend/                    ← FastAPI Application Root
│   │   Purpose: Entire server-side application — API, auth,
│   │            AI services, database, realtime, and business logic
│   │
│   ├── 🐍 app.py                  Entry point — Uvicorn server binding
│   │                              Reads PORT from env, enables reload
│   │                              in development mode
│   │
│   ├── 🗄️ users.db               SQLite database (local development)
│   │                              Auto-created on first startup.
│   │                              Swap for PostgreSQL via DATABASE_URL.
│   │
│   └── 📂 app/                    Application package
│       │
│       ├── ⚙️ main.py             FastAPI app factory
│       │                          • CORSMiddleware (configurable origins)
│       │                          • CSRF validation middleware
│       │                          • Rate limiting middleware
│       │                          • Request logging middleware
│       │                          • TrustedHostMiddleware
│       │                          • Admin account seeding on startup
│       │                          • Static file serving
│       │                          • Router mount at /api prefix
│       │
│       ├── 📊 models.py           SQLAlchemy ORM table definitions
│       │                          Models: User, UserSettings, ActivityLog,
│       │                          FocusSession, Alert, AIPrediction,
│       │                          ProductivityScore, BlockedWebsite,
│       │                          BlockedApp, ChildAccount,
│       │                          PasswordResetToken
│       │
│       ├── 📋 schemas.py          Pydantic v2 request/response schemas
│       │                          All API input validation and output
│       │                          serialisation contracts defined here
│       │
│       ├── 📡 ws.py               WebSocket re-export shim
│       │                          Maintains import compatibility while
│       │                          actual logic lives in services/realtime.py
│       │
│       ├── 📂 api/                HTTP Route Handlers
│       │   │   Architectural role: Thin controller layer — validates
│       │   │   requests, delegates to services, returns responses.
│       │   │   No business logic lives here directly.
│       │   │
│       │   ├── 🌐 routes.py       Central API authority (~845 lines)
│       │   │                      All production endpoints:
│       │   │                      AUTH: register, login, logout, me,
│       │   │                            forgot-password, reset-password
│       │   │                      SETTINGS: get/update (own + admin)
│       │   │                      ACTIVITY: log, recent
│       │   │                      ANALYTICS: summary, streak
│       │   │                      FOCUS: start, stop, current
│       │   │                      ALERTS: list, acknowledge
│       │   │                      BLOCKING: add/remove/list websites+apps
│       │   │                      PARENT: create-child, list, activity
│       │   │                      REPORTS: weekly
│       │   │                      EXTENSION: bootstrap sync
│       │   │                      ADMIN: users, system stats, toggle
│       │   │                      WS: /api/ws/dashboard
│       │   │
│       │   ├── 🔒 deps.py         FastAPI dependency injection
│       │   │                      get_current_user() — JWT decode + DB lookup
│       │   │                      require_roles() — RBAC enforcement
│       │   │                      can_manage_user() — parent/admin check
│       │   │
│       │   ├── ⬜ activity.py     Minimal shim (legacy compatibility)
│       │   │                      Activity logging fully handled in routes.py
│       │   │
│       │   ├── ⬜ extension.py    Minimal shim (legacy compatibility)
│       │   │                      Extension bootstrap handled in routes.py
│       │   │
│       │   └── 📈 dashboard.py    Legacy analytics helper utilities
│       │                          Supplemental aggregation functions
│       │
│       ├── 📂 core/               Cross-Cutting Infrastructure
│       │   │   Architectural role: Shared utilities used across all
│       │   │   layers — config, security primitives, no domain logic.
│       │   │
│       │   ├── ⚙️ config.py       Pydantic BaseSettings
│       │   │                      All configuration via environment vars:
│       │   │                      SECRET_KEY, DATABASE_URL, CORS_ORIGINS,
│       │   │                      ACCESS_TOKEN_EXPIRE_MINUTES,
│       │   │                      DEFAULT_ADMIN_EMAIL/PASSWORD
│       │   │
│       │   └── 🔐 security.py     Cryptographic primitives
│       │                          verify_password() — bcrypt verify (72-byte safe)
│       │                          get_password_hash() — bcrypt hash
│       │                          create_access_token() — signed JWT (HS256)
│       │                          decode_access_token() — JWT verification
│       │                          create_csrf_token() — UUID hex token
│       │                          hash/verify_reset_token() — password reset
│       │
│       ├── 📂 db/                 Database Infrastructure
│       │   │   Architectural role: Engine configuration and session
│       │   │   lifecycle. All DB access goes through get_db() dependency.
│       │   │
│       │   └── 🗄️ session.py     SQLAlchemy engine + session factory
│       │                          Supports SQLite (local) and PostgreSQL
│       │                          (production) via DATABASE_URL switching
│       │
│       └── 📂 services/           Business Logic & AI Services
│           │   Architectural role: All domain intelligence lives here.
│           │   Routes call services; services are independently testable.
│           │
│           ├── 🧠 ai.py           ML Classification Service (~500 lines)
│           │                      PRODUCTIVE_DEFAULTS — curated domain list
│           │                      DISTRACTING_DEFAULTS — curated domain list
│           │                      extract_domain() — URL normalisation
│           │                      classify_activity() — rule + ML pipeline
│           │                      refine_probability_with_random_forest()
│           │                        Per-user RF model with TTL cache
│           │                        Thread-safe _USER_MODEL_CACHE
│           │                        Falls back to model.pkl for new users
│           │                      burnout_score() — fatigue risk (0.0–1.0)
│           │                      compute_streak() — consecutive goal days
│           │                      insight_from_logs() — AI text generation
│           │
│           ├── 🔤 classifier.py   Lightweight keyword classifier
│           │                      Standalone fallback for edge cases
│           │                      when RF model is unavailable
│           │
│           └── 📡 realtime.py     WebSocket Connection Manager
│                                  ConnectionManager class
│                                  Per-user room management (dict of lists)
│                                  connect() / disconnect() / broadcast()
│                                  broadcast_to_user() — targeted push
│
├── 📂 frontend/                   ← React Web Application
│   │   Purpose: Single-page application serving the full user-facing
│   │            dashboard, analytics, focus tools, and admin panels.
│   │
│   ├── 📄 index.html              Vite HTML shell — single div#root mount
│   ├── ⚙️ vite.config.js         Dev server config: React plugin,
│   │                              API proxy → localhost:10000,
│   │                              host binding for network access
│   ├── 🎨 tailwind.config.js     Design token definitions
│   │                              Colors: ink (#07111f), panel (#101c2f),
│   │                              line (#26364d), mint (#2dd4bf),
│   │                              leaf (#22c55e), sun (#f59e0b),
│   │                              danger (#ef4444)
│   │                              Custom shadows and animation keyframes
│   ├── ⚙️ postcss.config.js      PostCSS pipeline: Tailwind + Autoprefixer
│   ├── 🚀 vercel.json            SPA fallback routing for Vercel CDN
│   ├── 📦 package.json           npm manifest and script definitions
│   │
│   └── 📂 src/
│       ├── ⚛️ main.jsx            React DOM render entry — App → #root
│       ├── 🗺️ App.jsx             Router configuration
│       │                          All route definitions
│       │                          Auth guards (redirect if no token)
│       │                          Role-based route protection
│       │                          (admin / parent / child / user)
│       │
│       ├── 📂 api/                API Client Layer
│       │   │   Architectural role: Centralised HTTP communication.
│       │   │   All fetch calls go through this layer — never raw fetch
│       │   │   in components.
│       │   │
│       │   ├── 🔌 client.js       Axios instance
│       │   │                      JWT Bearer token injection
│       │   │                      CSRF header attachment
│       │   │                      safeGet() — fetch with typed fallback
│       │   │                      401 interceptor for auto-logout
│       │   │
│       │   └── 📊 dashboard.js    Dashboard-specific API helpers
│       │                          Wraps common dashboard data calls
│       │
│       ├── 📂 components/         Shared UI Component Library
│       │   │   Architectural role: Reusable presentational components
│       │   │   with no business logic. Props-driven, composable.
│       │   │
│       │   ├── 🏠 Shell.jsx       Application shell layout
│       │   │                      Responsive sidebar navigation
│       │   │                      Mobile hamburger + backdrop overlay
│       │   │                      Role-filtered nav items
│       │   │                      Notification bell (unread count badge)
│       │   │                      Live pulse dot (realtime indicator)
│       │   │                      User card + logout
│       │   │                      Theme toggle
│       │   │
│       │   └── 📊 MetricCard.jsx  KPI metric display card
│       │                          Props: icon, label, value, detail, tone
│       │                          Tone variants: default/leaf/sun/danger
│       │
│       ├── 📂 context/            React State Management
│       │   └── 🔒 AuthContext.jsx Auth state provider
│       │                          Stores: user object, token, role
│       │                          Methods: login(), logout()
│       │                          Persists session across page refresh
│       │                          Exposes role helper booleans
│       │
│       ├── 📂 hooks/              Custom React Hooks
│       │   └── 📡 useRealtime.js  WebSocket lifecycle hook
│       │                          Connects to /api/ws/dashboard?token=
│       │                          Auto-reconnects on disconnect
│       │                          Delivers live events to components
│       │                          Cleans up on unmount
│       │
│       ├── 📂 pages/              Route-Level Page Components
│       │   │   Architectural role: Smart containers — fetch data,
│       │   │   manage local state, compose presentational components.
│       │   │
│       │   ├── 🏠 Landing.jsx     Public marketing page
│       │   │                      Hero section, feature highlights, CTA
│       │   │
│       │   ├── 🔑 Login.jsx       Authentication page
│       │   │                      Login + Register tabs
│       │   │                      Role selection (user/parent/admin)
│       │   │                      Empty form (no pre-filled credentials)
│       │   │
│       │   ├── 📊 Dashboard.jsx   Main productivity dashboard
│       │   │                      Metric cards: score, focus, distractions
│       │   │                      Streak badge + burnout risk badge
│       │   │                      Daily goal progress bar
│       │   │                      Area chart (productive vs distracting)
│       │   │                      Recent activity live feed
│       │   │                      WebSocket alert stream
│       │   │                      Test alert button (development)
│       │   │
│       │   ├── 📈 Analytics.jsx   Deep analytics view
│       │   │                      7×24 activity heatmap grid
│       │   │                      Line chart: daily trend (all categories)
│       │   │                      Horizontal bar charts: top sites + apps
│       │   │                      Burnout risk alert panel (>30% threshold)
│       │   │                      AI insights grid
│       │   │                      Period selector: 7/30/90 days
│       │   │
│       │   ├── ⏱️ FocusMode.jsx   Focus session manager
│       │   │                      SVG circular countdown timer ring
│       │   │                      Pomodoro mode toggle (25 min)
│       │   │                      Duration slider (15–180 min)
│       │   │                      Live stats: distractions, progress, elapsed
│       │   │                      Session history (last 5 sessions)
│       │   │                      Enforcement feature checklist
│       │   │
│       │   ├── ⚙️ Settings.jsx    Configuration management
│       │   │                      Tag chip input: add/remove websites + apps
│       │   │                      Work schedule time pickers
│       │   │                      Bedtime schedule time pickers
│       │   │                      Daily limit sliders (social/video/games)
│       │   │                      Distraction sensitivity slider
│       │   │                      Blocking + child-safe mode toggles
│       │   │                      Alert sound selector
│       │   │
│       │   ├── 👨‍👩‍👧 ParentPanel.jsx  Parental control centre
│       │   │                      Create child account form
│       │   │                      Linked children list (click to expand)
│       │   │                      Per-child activity viewer (last 10 events)
│       │   │                      Unread child alert display
│       │   │                      One-click study mode restriction apply
│       │   │                      Per-child policy summary cards
│       │   │
│       │   ├── 🛡️ ChildDashboard.jsx  Child-safe focus view
│       │   │                      Study goal progress bar
│       │   │                      Focus streak badge (flame icon)
│       │   │                      Active restrictions list
│       │   │                      Blocked site chips
│       │   │                      AI study guidance panel
│       │   │
│       │   ├── 📋 Reports.jsx     Weekly intelligence report
│       │   │                      Streak card (days count)
│       │   │                      Burnout risk card (color-coded)
│       │   │                      Weekly area chart (trend)
│       │   │                      AI recommendations list
│       │   │                      PDF export button (window.print)
│       │   │
│       │   └── 👑 AdminPanel.jsx  System administration
│       │                          5 KPI metric cards (users, children,
│       │                          logs, alerts, focus sessions)
│       │                          Full user table with role badges
│       │                          Enable/disable user toggle
│       │                          Joined date and status columns
│       │                          System refresh button
│       │
│       └── 📂 styles/
│           └── 🎨 index.css       Global design system
│                                  Google Fonts Inter import
│                                  Scrollbar custom styling
│                                  Tailwind @apply utilities:
│                                    .surface .button-primary
│                                    .button-secondary .button-danger
│                                    .input .nav-link .nav-link-active
│                                  Badge variants: streak/green/danger
│                                  .pulse-dot — live indicator animation
│                                  .animate-fadein — page transitions
│                                  .card-hover — lift effect
│
├── 📂 extension/                  ← Chrome Extension (Manifest V3)
│   │   Purpose: Browser-native productivity monitoring agent.
│   │            Runs as a persistent service worker with no page UI.
│   │
│   ├── 📋 manifest.json           Extension manifest v3
│   │                              Permissions: alarms, activeTab, idle,
│   │                              notifications, scripting, storage,
│   │                              tabs, webNavigation
│   │                              Service worker: background.js
│   │                              Content scripts: content.js (all URLs)
│   │                              Web-accessible: warning.html
│   │
│   ├── ⚙️ background.js          Service worker (persistent agent)
│   │                              Tab tracking: onActivated + onUpdated
│   │                              15-second deduplication window
│   │                              Domain extraction + matching
│   │                              Blocked site redirect to warning.html
│   │                              chrome.idle integration (60s threshold)
│   │                              50-event offline queue + auto-flush
│   │                              3-attempt exponential retry
│   │                              401 token expiry → notification + clear
│   │                              5-min periodic sync via chrome.alarms
│   │                              Messages: SET_TOKEN, CLEAR_TOKEN,
│   │                              GET_STATE, SET_FOCUS, SYNC_NOW,
│   │                              FLUSH_QUEUE
│   │
│   ├── 📄 content.js             Content script (injected into all pages)
│   │                              Sends tab metadata to service worker
│   │                              Listens for focus mode state changes
│   │
│   ├── 🖥️ popup.html             Extension popup layout
│   │                              Login form section (unauthenticated)
│   │                              Live stats bar (authenticated)
│   │                              Auth action section (sync, logout, focus)
│   │                              Policy snapshot panel
│   │
│   ├── ⚙️ popup.js               Popup controller
│   │                              Login → fetch token → SET_TOKEN message
│   │                              GET_STATE → display current site/queue
│   │                              Focus mode toggle → SET_FOCUS message
│   │                              Sync → SYNC_NOW + re-render policy
│   │                              Logout → CLEAR_TOKEN + reset UI
│   │
│   ├── 🚫 warning.html           Blocked site interstitial page
│   │                              Displays blocked domain name
│   │                              Back button + unblock request option
│   │
│   ├── ⚙️ warning.js             Warning page controller logic
│   ├── 🎨 styles.css             Popup + warning page dark-theme styles
│   │                              Stats bar, toast message, danger button
│   │
│   └── 📂 icons/                 Extension icon assets
│       ├── 🖼️ icon.svg           Source vector icon (HB brain circuit)
│       ├── 🖼️ icon16.png         16×16 — browser toolbar
│       ├── 🖼️ icon32.png         32×32 — standard display
│       ├── 🖼️ icon48.png         48×48 — extensions management page
│       └── 🖼️ icon128.png        128×128 — Chrome Web Store / install dialog
│
├── 📂 desktop/                    ← Windows Desktop Monitoring Agent
│   │   Purpose: Background system process tracking active applications,
│   │            idle time, and enforcing usage policies at OS level.
│   │
│   ├── 🐍 monitor.py             Main monitoring loop
│   │                              win32gui foreground window capture
│   │                              GetLastInputInfo idle time detection
│   │                              psutil process enumeration (fallback)
│   │                              App switch frequency measurement
│   │                              Blocked app process termination
│   │                              Bedtime lock enforcement
│   │                              200-event offline queue + flush
│   │                              Daily JSON summary log writing
│   │                              CLI: --dry-run, --login, --api flags
│   │                              Graceful SIGINT/SIGTERM shutdown
│   │
│   ├── 📋 config.example.json    Configuration template
│   │                              Backend URL, auth token placeholder
│   │                              Poll interval, idle threshold settings
│   │
│   ├── 📦 requirements.txt       Desktop-specific Python dependencies
│   │                              psutil, requests, pywin32
│   │
│   └── 📖 README.md              Desktop monitor setup guide
│
├── 📂 database/                   ← Database Assets
│   └── 📊 schema.sql             Complete PostgreSQL production schema
│                                  All tables, indices, foreign keys,
│                                  and seed data for fresh deployments
│
├── 📂 model/                      ← Pre-trained ML Model
│   └── 🧠 model.pkl              Serialised Random Forest classifier
│                                  Used as cold-start fallback for new
│                                  users with fewer than 30 activity logs.
│                                  Per-user models replace this once
│                                  sufficient training data exists.
│
├── 📂 data/                       ← Sample & Seed Data
│   └── (sample activity datasets for testing and model validation)
│
├── 📂 dashboard/                  ← Legacy Dashboard (superseded)
│   └── templates/                 Original Flask/Jinja2 templates
│                                  Replaced by the React SPA.
│                                  Retained for reference only.
│
│  ┌─────────────────────────────────────────────────────────────┐
│  │  ☁️ INFRASTRUCTURE & DEPLOYMENT                             │
│  └─────────────────────────────────────────────────────────────┘
│
├── 🐳 Dockerfile                 Multi-stage Docker image for backend
│                                  Python base → pip install → uvicorn run
│
├── 🐳 docker-compose.yml         Local orchestration
│                                  Services: backend + PostgreSQL
│                                  Volume mounts for DB persistence
│                                  Environment variable injection
│
├── ☁️ render.yaml                Render Infrastructure-as-Code
│                                  Web service definition
│                                  PostgreSQL database add-on
│                                  Auto-deploy from main branch
│                                  Environment variable configuration
│
│  ┌─────────────────────────────────────────────────────────────┐
│  │  ⚙️ CONFIGURATION & TOOLING                                 │
│  └─────────────────────────────────────────────────────────────┘
│
├── 📋 requirements.txt           Backend Python dependencies (pinned)
├── 🔒 .env.example               Environment variable template
├── 🙈 .gitignore                 Ignore rules (venv, __pycache__, .env,
│                                  node_modules, *.db, dist/)
├── 🖼️ make_icons.py             Extension PNG icon generator utility
│                                  (requires Pillow)
├── 🪟 start.bat                  One-click Windows launcher
│                                  Installs deps → opens backend + frontend
│                                  in separate terminal windows
├── 🪟 run_server.bat             Backend-only startup alternative
├── 🗄️ habit_breaker.db          SQLite dev database (local only, gitignored
│                                  in production configurations)
├── ⚖️ LICENSE                    MIT License
└── 📖 README.md                  This document
```

---

## 🔐 Security Architecture

> Security is implemented at **every layer** of the stack — from token storage to database access.

### 🛡️ Authentication & Session Management

```
Client Request
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│  1. JWT Access Token (Authorization: Bearer <token>)    │
│     OR HttpOnly Cookie (browser sessions)               │
│                                                         │
│  2. CSRF Token validation (X-CSRF-Token header)         │
│     UUID hex token — server-side verification           │
│                                                         │
│  3. Token decode → user_id extraction                   │
│     python-jose HS256 signature verification            │
│                                                         │
│  4. Database lookup → User.is_active check              │
│     Disabled accounts rejected at dependency layer      │
└─────────────────────────────────────────────────────────┘
      │
      ▼
 Authenticated Request → Role Check → Resource Access
```

### 🔑 Security Controls Matrix

| Control | Implementation | Threat Mitigated |
|---|---|---|
| **Password Hashing** | bcrypt via Passlib, 72-byte safe truncation | Credential database breach |
| **JWT Signing** | HS256 with rotating `SECRET_KEY` | Token forgery |
| **HttpOnly Cookies** | Session token invisible to JavaScript | XSS token theft |
| **CSRF Tokens** | UUID hex, validated on state-changing requests | Cross-site request forgery |
| **CORS Policy** | Configurable origins via `CORS_ORIGINS` env var | Cross-origin data access |
| **RBAC** | Role enum: admin / parent / user / child | Privilege escalation |
| **Rate Limiting** | Request count middleware per IP | Brute force / DoS |
| **Input Validation** | Pydantic v2 strict type enforcement | Injection attacks |
| **Password Reset** | Time-limited bcrypt-hashed token | Account takeover |
| **Env Secrets** | All credentials via environment variables | Secret exposure |

### 🚨 Production Security Checklist

```
☐  Generate SECRET_KEY: python -c "import secrets; print(secrets.token_hex(32))"
☐  Change DEFAULT_ADMIN_PASSWORD immediately after first login
☐  Set CORS_ORIGINS to only your frontend domain
☐  Use HTTPS exclusively — enforce via TrustedHostMiddleware
☐  Set ACCESS_TOKEN_EXPIRE_MINUTES to ≤ 60 for sensitive deployments
☐  Store all secrets in hosting provider's encrypted secrets manager
☐  Enable PostgreSQL SSL mode in DATABASE_URL
☐  Review rate limiting thresholds before going live
```

---

## 📈 Scalability Roadmap

> The current architecture is designed as a **Modular Monolith** — fast to develop, easy to reason about, and structured to decompose cleanly into microservices when scale requires it.

### Current State → Enterprise Scale

```
CURRENT                              SCALE PATH
──────────────────────────────────────────────────────────────
SQLite (local)          →   PostgreSQL (Render / RDS / Neon)
Single Uvicorn process  →   Gunicorn + multiple Uvicorn workers
In-memory WS rooms      →   Redis Pub/Sub (shared state across instances)
Local model.pkl cache   →   Shared ML model store (S3 / GCS)
Monolith routes.py      →   Separate FastAPI services per domain
Polling sync (5 min)    →   Event streaming via Apache Kafka
No caching layer        →   Redis cache for analytics aggregations
Single server           →   Kubernetes Deployment + HPA
```

### 🔀 Microservice Evolution Path

```
Habit Breaker AI (Monolith)
           │
           ├── 🔐 Auth Service          ← Extract auth module first
           │                              (most stable, clearest boundary)
           │
           ├── 📊 Analytics Service     ← Extract heavy aggregation queries
           │                              Add Redis for pre-computed results
           │
           ├── 🧠 ML Inference Service  ← Standalone FastAPI + model server
           │                              Async prediction with result caching
           │
           ├── 📡 Notification Service  ← WebSocket + push notification hub
           │                              Redis Pub/Sub backend
           │
           └── 🔒 Policy Service        ← Block lists, parental rules engine
                                          Cacheable, read-heavy workload
```

### 📊 Scaling Dimensions

| Dimension | Current | Scale Target |
|---|---|---|
| **Users** | Hundreds | Tens of thousands |
| **Activity events/day** | Thousands | Millions |
| **ML predictions/min** | Synchronous | Async queue with batch inference |
| **WebSocket connections** | Single server | Redis Pub/Sub cluster |
| **Database** | SQLite → PostgreSQL | Read replicas + connection pooling |
| **Deployment** | Single container | Kubernetes + HPA auto-scaling |
| **Analytics** | Real-time SQL | Pre-computed time-series (TimescaleDB) |

---

## 🌐 API Reference

> Full interactive documentation available at: **[/docs](http://localhost:10000/docs)** (Swagger UI) and **[/redoc](http://localhost:10000/redoc)** (ReDoc)

### 🔐 Authentication

```http
POST   /api/auth/register          Register new user account
POST   /api/auth/login             Authenticate and receive JWT
POST   /api/auth/logout            Invalidate session cookie
GET    /api/auth/me                Get current user profile
POST   /api/auth/forgot-password   Request password reset token
POST   /api/auth/reset-password    Complete password reset
```

### ⚙️ Settings

```http
GET    /api/settings/me            Get own settings and policy config
PUT    /api/settings/me            Update own settings
GET    /api/settings/{user_id}     Get user settings (admin / parent)
PUT    /api/settings/{user_id}     Update user settings (admin / parent)
```

### 📊 Activity & Analytics

```http
POST   /api/activity/log           Ingest activity event (extension / desktop)
GET    /api/activity/recent        Recent activity logs (paginated)
GET    /api/analytics/summary      Full analytics summary with heatmap + trends
GET    /api/analytics/streak       Streak days + burnout risk score
```

### ⏱️ Focus Sessions

```http
POST   /api/focus/start            Begin timed focus session
POST   /api/focus/stop             End session → returns score + distraction count
GET    /api/focus/current          Get active session or null
```

### 🔔 Alerts

```http
GET    /api/alerts                 List alerts for authenticated user
POST   /api/alerts/{id}/acknowledge  Mark alert as read
```

### 🚫 Blocking

```http
POST   /api/blocking/websites      Add blocked domain
DELETE /api/blocking/websites/{domain}  Remove blocked domain
GET    /api/blocking/websites      List all blocked domains
POST   /api/blocking/apps          Add blocked application
DELETE /api/blocking/apps/{name}   Remove blocked application
GET    /api/blocking/apps          List all blocked applications
```

### 👨‍👩‍👧 Parent Controls

```http
POST   /api/parent/children        Create and link child account
GET    /api/parent/children        List all linked children
GET    /api/parent/children/{id}/activity  Get child activity feed
```

### 📋 Reports

```http
GET    /api/reports/weekly         AI-generated weekly productivity report
```

### 🧩 Extension

```http
GET    /api/extension/bootstrap    Sync endpoint: settings + block lists + policies
```

### 👑 Admin

```http
GET    /api/admin/users            List all platform users
PATCH  /api/admin/users/{id}/toggle  Enable / disable user account
GET    /api/admin/system           Platform-wide system metrics
```

### 📡 WebSocket

```
WS  /api/ws/dashboard?token=<jwt>
```
Receives JSON event stream: `{ "type": "alert|activity|focus", "data": {...} }`

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Minimum Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| Git | Any recent |

### ⚡ Quick Start (5 minutes)

```powershell
# 1. Clone
git clone https://github.com/aryanyadav5579/Habit-Breaker-AI.git
cd Habit-Breaker-AI

# 2. Backend setup
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 3. Configure environment
copy .env.example .env
# Edit .env: set SECRET_KEY and DEFAULT_ADMIN_PASSWORD

# 4. Start backend (Terminal 1)
$env:PYTHONPATH = "$PWD\backend"
python backend\app.py

# 5. Start frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

**Or use the one-click launcher:**
```powershell
# With .venv activated:
.\start.bat
```

### 🌐 Access Points

| Service | URL |
|---|---|
| **Web Dashboard** | http://localhost:5173 |
| **Backend API** | http://localhost:10000 |
| **API Docs (Swagger)** | http://localhost:10000/docs |
| **API Docs (ReDoc)** | http://localhost:10000/redoc |

### 🔑 Default Admin Account

> Email and password are configured via environment variables.
> Default: `admin@habitbreaker.ai` / value of `DEFAULT_ADMIN_PASSWORD`
> **Change the password immediately after first login.**

---

### 🧩 Chrome Extension Setup

```
1. Navigate to chrome://extensions
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Select the /extension folder
5. Click the extension icon in the toolbar
6. Enter: http://localhost:10000 as the backend URL
7. Login with your account credentials
8. Click "Sync" to pull policies and block lists
```

---

### 🖥️ Desktop Monitor Setup

```powershell
# Install desktop dependencies
pip install -r desktop\requirements.txt

# Authenticate (first time only)
python desktop\monitor.py --login

# Start monitoring
python desktop\monitor.py

# Observe without enforcing (safe testing mode)
python desktop\monitor.py --dry-run

# Use a different backend
python desktop\monitor.py --api https://your-backend.onrender.com
```

---

## ☁️ Deployment

### Backend → Render

1. Fork this repository
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repository
4. Render auto-detects `render.yaml` — click **Deploy**
5. Add environment variables in Render dashboard:

```
SECRET_KEY          = <generate with: python -c "import secrets; print(secrets.token_hex(32))">
DATABASE_URL        = <your Render PostgreSQL connection string>
DEFAULT_ADMIN_EMAIL = admin@yourdomain.com
DEFAULT_ADMIN_PASSWORD = <strong password>
CORS_ORIGINS        = https://your-frontend.vercel.app
```

### Frontend → Vercel

1. Import the repository on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable:
```
VITE_API_BASE_URL = https://your-backend.onrender.com
```
4. Deploy — `vercel.json` handles SPA routing automatically

### Docker (Local or Self-Hosted)

```bash
# Build and start both services
docker-compose up --build

# Backend:   http://localhost:10000
# Database:  PostgreSQL on internal network
```

---

## ⚙️ Environment Reference

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ | JWT signing key — minimum 32 random bytes |
| `DATABASE_URL` | ✅ | PostgreSQL URL or omit for SQLite |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed frontend origins |
| `DEFAULT_ADMIN_EMAIL` | ✅ | Admin account email for initial seed |
| `DEFAULT_ADMIN_PASSWORD` | ✅ | Admin account password for initial seed |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ⬜ | JWT lifetime (default: 1440 = 24h) |
| `VITE_API_BASE_URL` | Frontend | Backend URL for Vercel deployment |
| `RENDER_BACKEND_URL` | Deploy | Backend URL referenced in render.yaml |

---

## 🤝 Contributing

Contributions are welcome. Please read the guidelines below before opening a pull request.

```powershell
# 1. Fork the repository on GitHub

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes
# Follow existing code style and patterns

# 4. Commit with a conventional message
git commit -m "feat: add your feature description"
# Types: feat, fix, docs, refactor, test, chore

# 5. Push and open a Pull Request
git push origin feature/your-feature-name
```

### Commit Convention

| Type | When to use |
|---|---|
| `feat:` | New feature or capability |
| `fix:` | Bug fix |
| `docs:` | Documentation update |
| `refactor:` | Code restructure with no behaviour change |
| `test:` | Add or update tests |
| `chore:` | Dependency updates, config changes |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for full details.

```
MIT License — Copyright (c) 2025 Aryan Yadav

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions...
```

---

<div align="center">

**Built with 🧠 intelligence and ⚡ performance in mind**

[⭐ Star this repository](https://github.com/aryanyadav5579/Habit-Breaker-AI) · [🐛 Report an Issue](https://github.com/aryanyadav5579/Habit-Breaker-AI/issues) · [💬 Start a Discussion](https://github.com/aryanyadav5579/Habit-Breaker-AI/discussions)

<sub>Habit Breaker AI — Productivity Intelligence Platform · MIT License</sub>

</div>
