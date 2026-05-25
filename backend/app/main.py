from collections import defaultdict, deque
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import (
    FastAPI,
    Request,
    WebSocket
)

from fastapi.middleware.cors import CORSMiddleware

from fastapi.responses import (
    FileResponse,
    JSONResponse,
    RedirectResponse
)

from fastapi.staticfiles import StaticFiles

from starlette.middleware.base import BaseHTTPMiddleware

from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.routes import (
    ensure_user_settings,
    router
)

from app.api.dashboard import (
    router as dashboard_router
)

from app.core.config import settings

from app.core.security import (
    get_password_hash
)

from app.db.session import (
    Base,
    SessionLocal,
    engine
)

from app.models import User

from app.services.realtime import manager


class RateLimitMiddleware(BaseHTTPMiddleware):

    def __init__(
        self,
        app,
        limit_per_minute: int
    ) -> None:

        super().__init__(app)

        self.limit = limit_per_minute

        self.window = timedelta(minutes=1)

        self.requests = defaultdict(deque)

    async def dispatch(
        self,
        request: Request,
        call_next
    ):

        if request.url.path.startswith("/ws"):
            return await call_next(request)

        client = (
            request.client.host
            if request.client
            else "unknown"
        )

        now = datetime.utcnow()

        bucket = self.requests[client]

        while (
            bucket and
            now - bucket[0] > self.window
        ):
            bucket.popleft()

        if len(bucket) >= self.limit:

            return JSONResponse(
                {"detail": "Rate limit exceeded"},
                status_code=429
            )

        bucket.append(now)

        return await call_next(request)


class CSRFMiddleware(BaseHTTPMiddleware):

    async def dispatch(
        self,
        request: Request,
        call_next
    ):

        if request.method in {
            "GET",
            "HEAD",
            "OPTIONS"
        }:
            return await call_next(request)

        if request.url.path.startswith((
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/forgot-password",
            "/api/auth/reset-password"
        )):
            return await call_next(request)

        if request.headers.get("authorization"):
            return await call_next(request)

        cookie_token = request.cookies.get(
            "csrf_token"
        )

        header_token = request.headers.get(
            "x-csrf-token"
        )

        if (
            request.cookies.get("access_token")
            and cookie_token != header_token
        ):

            return JSONResponse(
                {"detail": "CSRF validation failed"},
                status_code=403
            )

        return await call_next(request)


class HTTPSRedirectMiddleware(BaseHTTPMiddleware):

    async def dispatch(
        self,
        request: Request,
        call_next
    ):

        forwarded_proto = request.headers.get(
            "x-forwarded-proto"
        )

        if (
            settings.FORCE_HTTPS
            and request.url.scheme == "http"
            and forwarded_proto != "https"
        ):

            return RedirectResponse(
                str(
                    request.url.replace(
                        scheme="https"
                    )
                ),
                status_code=308
            )

        return await call_next(request)


def create_app() -> FastAPI:

    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        description="AI productivity monitoring platform."
    )

    # -----------------------------
    # Middleware
    # -----------------------------

    app.add_middleware(
        HTTPSRedirectMiddleware
    )

    app.add_middleware(
        RateLimitMiddleware,
        limit_per_minute=(
            settings.RATE_LIMIT_PER_MINUTE
        )
    )

    app.add_middleware(
        CSRFMiddleware
    )

    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.TRUSTED_HOSTS
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # -----------------------------
    # API Routes
    # -----------------------------

    app.include_router(
        router,
        prefix=settings.API_PREFIX
    )

    app.include_router(
        dashboard_router
    )

    # -----------------------------
    # Websocket  (per-user realtime)
    # -----------------------------

    @app.websocket("/api/ws/dashboard")
    async def websocket_dashboard(websocket: WebSocket):
        from app.core.security import decode_access_token
        from fastapi import status as ws_status

        token = (
            websocket.query_params.get("token")
            or websocket.cookies.get("access_token")
        )
        if not token:
            await websocket.close(code=ws_status.WS_1008_POLICY_VIOLATION)
            return
        try:
            payload = decode_access_token(
                token.removeprefix("Bearer ").strip()
            )
            user_id = int(payload["sub"])
        except Exception:
            await websocket.close(code=ws_status.WS_1008_POLICY_VIOLATION)
            return

        await manager.connect(user_id, websocket)
        try:
            while True:
                await websocket.receive_text()
        except Exception:
            manager.disconnect(user_id, websocket)

    # -----------------------------
    # Startup
    # -----------------------------

    @app.on_event("startup")
    def startup() -> None:

        Base.metadata.create_all(
            bind=engine
        )

        seed_admin()

        print(
            "\n========== BACKEND STARTED =========="
        )

        print(
            "Habit Breaker AI backend running"
        )

        print(
            "=====================================\n"
        )

    # -----------------------------
    # Health
    # -----------------------------

    @app.get("/health")
    def health():

        return {
            "status": "ok",
            "service": settings.APP_NAME
        }

    mount_frontend(app)

    return app


def seed_admin() -> None:

    db = SessionLocal()

    try:

        existing = db.query(User).filter(
            User.role == "admin"
        ).first()

        if existing:
            return

        admin = User(
            email=(
                settings.DEFAULT_ADMIN_EMAIL
                .lower()
            ),
            full_name=(
                settings.DEFAULT_ADMIN_NAME
            ),
            password_hash=get_password_hash(
                settings.DEFAULT_ADMIN_PASSWORD
            ),
            role="admin",
        )

        db.add(admin)

        db.commit()

        db.refresh(admin)

        ensure_user_settings(
            db,
            admin.id
        )

        print("Admin user seeded")

    finally:

        db.close()


def mount_frontend(
    app: FastAPI
) -> None:

    backend_dir = (
        Path(__file__)
        .resolve()
        .parents[1]
    )

    project_dir = backend_dir.parent

    dist_dir = (
        project_dir /
        settings.FRONTEND_DIST_DIR
    ).resolve()

    index_file = dist_dir / "index.html"

    assets_dir = dist_dir / "assets"

    if assets_dir.exists():

        app.mount(
            "/assets",
            StaticFiles(directory=assets_dir),
            name="assets"
        )

    if index_file.exists():

        public_files = {
            "favicon.ico",
            "manifest.webmanifest"
        }

        @app.get(
            "/{path:path}",
            include_in_schema=False
        )
        def spa(path: str):

            requested = dist_dir / path

            if (
                path in public_files
                and requested.exists()
            ):
                return FileResponse(requested)

            if path.startswith("api"):

                return JSONResponse(
                    {"detail": "Not found"},
                    status_code=404
                )

            return FileResponse(index_file)


app = create_app()