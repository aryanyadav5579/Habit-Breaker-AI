from collections import Counter, defaultdict
from datetime import datetime, timedelta
from secrets import token_urlsafe
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Response, WebSocket, WebSocketDisconnect, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import can_manage_user, get_current_user, require_roles
from app.core.config import settings as app_settings
from app.core.security import (
    create_access_token,
    create_csrf_token,
    get_password_hash,
    hash_reset_token,
    verify_password,
    verify_reset_token,
    decode_access_token,
)
from app.db.session import get_db
from app.models import (
    AIPrediction,
    ActivityLog,
    Alert,
    BlockedApp,
    BlockedWebsite,
    ChildAccount,
    FocusSession,
    PasswordResetToken,
    ProductivityScore,
    User,
    UserSettings,
)
from app.schemas import (
    ActivityCreate,
    ActivityRead,
    ActivityResult,
    AlertRead,
    AnalyticsSummary,
    ChildCreate,
    ChildRead,
    ExtensionBootstrap,
    FocusRead,
    FocusStart,
    ForgotPasswordRequest,
    LoginRequest,
    Message,
    RegisterRequest,
    ResetPasswordRequest,
    SettingsRead,
    SettingsUpdate,
    Token,
    UserRead,
)
from app.services.ai import (
    DISTRACTING_DEFAULTS,
    PRODUCTIVE_DEFAULTS,
    burnout_score,
    classify_activity,
    compute_streak,
    extract_domain,
    insight_from_logs,
    refine_probability_with_random_forest,
)
from app.services.realtime import manager


router = APIRouter()


def ensure_user_settings(db: Session, user_id: int) -> UserSettings:
    user_settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
    if user_settings:
        return user_settings

    user_settings = UserSettings(
        user_id=user_id,
        productive_websites=sorted(PRODUCTIVE_DEFAULTS),
        distracting_websites=sorted(DISTRACTING_DEFAULTS),
        productive_apps=["Code.exe", "pycharm64.exe", "EXCEL.EXE", "Photoshop.exe"],
        distracting_apps=["Discord.exe", "Steam.exe", "TikTok.exe"],
        focus_mode_duration=50,
        productivity_goal_minutes=300,
        work_schedule={"weekdays": ["mon", "tue", "wed", "thu", "fri"], "start": "09:00", "end": "17:30"},
        daily_limits={"social": 45, "video": 30, "games": 0},
    )
    db.add(user_settings)
    db.commit()
    db.refresh(user_settings)
    return user_settings


def resolve_target_user(db: Session, actor: User, user_id: Optional[int]) -> User:
    target_id = user_id or actor.id
    target = db.get(User, target_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if not can_manage_user(actor, target.id):
        raise HTTPException(status_code=403, detail="You cannot access this account")
    return target


def _duration(log: ActivityLog) -> int:
    return max(int(log.duration_seconds or 0), 30)


def _domain_matches(domain: str | None, patterns: list[str]) -> bool:
    if not domain:
        return False
    normalized = domain.lower().removeprefix("www.")
    for pattern in patterns:
        candidate = str(pattern).lower().strip().removeprefix("www.")
        if candidate and (normalized == candidate or normalized.endswith(f".{candidate}")):
            return True
    return False


async def create_and_push_alert(
    db: Session,
    user_id: int,
    event_type: str,
    message: str,
    severity: str = "medium",
    child_id: int | None = None,
    payload: Optional[Dict[str, Any]] = None,
) -> Alert:
    alert = Alert(
        user_id=user_id,
        child_id=child_id,
        event_type=event_type,
        severity=severity,
        message=message,
        payload=payload or {},
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    await manager.broadcast_to_user(
        user_id,
        {"type": "alert", "alert": AlertRead.model_validate(alert).model_dump(mode="json")},
    )
    return alert


@router.post("/auth/register", response_model=Token, status_code=201)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(func.lower(User.email) == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    if payload.role == "admin":
        raise HTTPException(status_code=403, detail="Admin accounts must be created by an existing admin")
    if payload.role == "child":
        raise HTTPException(status_code=403, detail="Child accounts must be created from a parent account")

    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        password_hash=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    ensure_user_settings(db, user.id)

    csrf_token = create_csrf_token()
    token = create_access_token(str(user.id), {"role": user.role, "csrf": csrf_token})
    _set_auth_cookies(response, token, csrf_token)
    return Token(access_token=token, csrf_token=csrf_token, user=UserRead.model_validate(user))


@router.post("/auth/login", response_model=Token)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.email) == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    user.last_login_at = datetime.utcnow()
    db.commit()
    csrf_token = create_csrf_token()
    token = create_access_token(str(user.id), {"role": user.role, "csrf": csrf_token})
    _set_auth_cookies(response, token, csrf_token)
    ensure_user_settings(db, user.id)
    return Token(access_token=token, csrf_token=csrf_token, user=UserRead.model_validate(user))


def _set_auth_cookies(response: Response, access_token: str, csrf_token: str) -> None:
    max_age = app_settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        "access_token",
        access_token,
        max_age=max_age,
        httponly=True,
        secure=app_settings.COOKIE_SECURE,
        samesite="lax",
    )
    response.set_cookie(
        "csrf_token",
        csrf_token,
        max_age=max_age,
        httponly=False,
        secure=app_settings.COOKIE_SECURE,
        samesite="lax",
    )


@router.post("/auth/logout", response_model=Message)
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("csrf_token")
    return Message(message="Logged out")


@router.get("/auth/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/auth/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.email) == payload.email.lower()).first()
    if not user:
        return {"message": "If the account exists, reset instructions have been generated."}

    raw_token = token_urlsafe(32)
    reset = PasswordResetToken(
        user_id=user.id,
        token_hash=hash_reset_token(raw_token),
        expires_at=datetime.utcnow() + timedelta(minutes=app_settings.RESET_TOKEN_EXPIRE_MINUTES),
    )
    db.add(reset)
    db.commit()
    body = {"message": "If the account exists, reset instructions have been generated."}
    if app_settings.ENVIRONMENT != "production":
        body["reset_token"] = raw_token
    return body


@router.post("/auth/reset-password", response_model=Message)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    tokens = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.used.is_(False), PasswordResetToken.expires_at >= datetime.utcnow())
        .order_by(PasswordResetToken.created_at.desc())
        .limit(50)
        .all()
    )
    reset = next((item for item in tokens if verify_reset_token(payload.token, item.token_hash)), None)
    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user = db.get(User, reset.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = get_password_hash(payload.new_password)
    reset.used = True
    db.commit()
    return Message(message="Password reset complete")


@router.get("/settings/me", response_model=SettingsRead)
def read_my_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ensure_user_settings(db, current_user.id)


@router.put("/settings/me", response_model=SettingsRead)
def update_my_settings(
    payload: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _update_settings(db, current_user.id, payload)


@router.get("/settings/{user_id}", response_model=SettingsRead)
def read_user_settings(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target = resolve_target_user(db, current_user, user_id)
    return ensure_user_settings(db, target.id)


@router.put("/settings/{user_id}", response_model=SettingsRead)
def update_user_settings(
    user_id: int,
    payload: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = resolve_target_user(db, current_user, user_id)
    return _update_settings(db, target.id, payload)


def _update_settings(db: Session, user_id: int, payload: SettingsUpdate) -> UserSettings:
    user_settings = ensure_user_settings(db, user_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(user_settings, key, value)
    db.commit()
    db.refresh(user_settings)
    return user_settings


@router.post("/activity/log", response_model=ActivityResult)
async def log_activity(
    payload: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_settings = ensure_user_settings(db, current_user.id)
    payload_dict = payload.model_dump()
    domain = payload.domain or extract_domain(payload.url)

    classification = classify_activity({**payload_dict, "domain": domain}, user_settings)
    recent_for_ml = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == current_user.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(200)
        .all()
    )
    blocked_domains = [item.domain for item in db.query(BlockedWebsite).filter_by(user_id=current_user.id, enforced=True).all()]
    blocked_apps = [item.process_name for item in db.query(BlockedApp).filter_by(user_id=current_user.id, enforced=True).all()]
    blocked_by_list = _domain_matches(domain, blocked_domains) or any(
        app.lower() in (payload.app_name or "").lower() for app in blocked_apps
    )

    blocked = classification.blocked or blocked_by_list
    category = "distracting" if blocked else classification.category
    probability = refine_probability_with_random_forest(
        recent_for_ml,
        classification.features,
        max(classification.distraction_probability, 0.9 if blocked_by_list else 0.0),
        user_id=current_user.id,
    )

    activity = ActivityLog(
        user_id=current_user.id,
        source=payload.source,
        url=payload.url,
        domain=domain,
        app_name=payload.app_name,
        window_title=payload.window_title,
        category=category,
        productivity_weight=classification.productivity_weight,
        duration_seconds=payload.duration_seconds,
        idle_seconds=payload.idle_seconds,
        distraction_probability=probability,
        blocked=blocked,
        extra=payload.metadata,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)

    prediction = AIPrediction(
        user_id=current_user.id,
        activity_log_id=activity.id,
        probability=probability,
        label=category,
        features=classification.features,
        recommendation=classification.recommendation,
    )
    db.add(prediction)
    db.commit()

    warning = None
    if category == "distracting":
        warning = "You are distracted from your current task. Return to your selected work application."
        await create_and_push_alert(
            db,
            user_id=current_user.id,
            child_id=current_user.id if current_user.role == "child" else None,
            event_type="distraction_detected",
            severity="high" if blocked else "medium",
            message="Distracting website or application detected.",
            payload={"activity_id": activity.id, "domain": domain, "app_name": payload.app_name, "blocked": blocked},
        )
        if current_user.parent_id:
            await create_and_push_alert(
                db,
                user_id=current_user.parent_id,
                child_id=current_user.id,
                event_type="child_distraction_detected",
                severity="high" if blocked else "medium",
                message=f"{current_user.full_name} opened a distracting or blocked resource.",
                payload={"activity_id": activity.id, "domain": domain, "app_name": payload.app_name, "blocked": blocked},
            )

    await manager.broadcast_to_user(
        current_user.id,
        {
            "type": "activity",
            "activity": ActivityRead.model_validate(activity).model_dump(mode="json"),
            "warning": warning,
        },
    )

    return ActivityResult(
        activity=ActivityRead.model_validate(activity),
        blocked=blocked,
        warning=warning,
        recommendation=classification.recommendation,
        distraction_probability=probability,
    )


@router.get("/activity/recent", response_model=list[ActivityRead])
def recent_activity(
    limit: int = 50,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = resolve_target_user(db, current_user, user_id)
    return (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == target.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(min(limit, 250))
        .all()
    )


@router.get("/analytics/summary", response_model=AnalyticsSummary)
def analytics_summary(
    days: int = 7,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = resolve_target_user(db, current_user, user_id)
    since = datetime.utcnow() - timedelta(days=max(1, min(days, 90)))
    logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == target.id, ActivityLog.created_at >= since)
        .order_by(ActivityLog.created_at.asc())
        .all()
    )

    total_seconds = sum(_duration(log) for log in logs)
    productive_seconds = sum(_duration(log) for log in logs if log.category == "productive")
    distracting_seconds = sum(_duration(log) for log in logs if log.category == "distracting")
    distraction_count = sum(1 for log in logs if log.category == "distracting")
    productivity_score = round((productive_seconds / total_seconds) * 100, 1) if total_seconds else 0

    website_counts = Counter(log.domain for log in logs if log.category == "distracting" and log.domain)
    app_counts = Counter(log.app_name for log in logs if log.category == "productive" and log.app_name)
    trend: dict[str, dict[str, float]] = defaultdict(lambda: {"productive": 0, "distracting": 0, "neutral": 0})
    heatmap: dict[tuple[int, int], int] = defaultdict(int)

    for log in logs:
        day = log.created_at.date().isoformat()
        trend[day][log.category] += round(_duration(log) / 60, 2)
        heatmap[(log.created_at.weekday(), log.created_at.hour)] += 1

    summary = AnalyticsSummary(
        productivity_score=productivity_score,
        focus_hours=round(productive_seconds / 3600, 2),
        distraction_count=distraction_count,
        screen_time_hours=round(total_seconds / 3600, 2),
        top_distracting_websites=[{"domain": domain, "count": count} for domain, count in website_counts.most_common(8)],
        top_productive_apps=[{"app": app, "count": count} for app, count in app_counts.most_common(8)],
        daily_trend=[{"date": day, **values} for day, values in sorted(trend.items())],
        heatmap=[{"weekday": day, "hour": hour, "count": count} for (day, hour), count in sorted(heatmap.items())],
        ai_insights=insight_from_logs(logs),
    )

    score = ProductivityScore(
        user_id=target.id,
        score=summary.productivity_score,
        focus_minutes=round(productive_seconds / 60, 2),
        distraction_minutes=round(distracting_seconds / 60, 2),
        total_screen_minutes=round(total_seconds / 60, 2),
        period_start=since,
        period_end=datetime.utcnow(),
    )
    db.add(score)
    db.commit()
    return summary


@router.post("/focus/start", response_model=FocusRead, status_code=201)
def start_focus(payload: FocusStart, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    active = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == current_user.id, FocusSession.status == "active")
        .order_by(FocusSession.started_at.desc())
        .first()
    )
    if active:
        return active
    session = FocusSession(
        user_id=current_user.id,
        planned_duration_minutes=payload.planned_duration_minutes,
        notes=payload.notes,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/focus/stop", response_model=FocusRead)
def stop_focus(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == current_user.id, FocusSession.status == "active")
        .order_by(FocusSession.started_at.desc())
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="No active focus session")
    logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == current_user.id, ActivityLog.created_at >= session.started_at)
        .all()
    )
    total = len(logs)
    productive = sum(1 for log in logs if log.category == "productive")
    session.status = "completed"
    session.ended_at = datetime.utcnow()
    session.distraction_count = sum(1 for log in logs if log.category == "distracting")
    session.productivity_score = round((productive / total) * 100, 1) if total else 0
    db.commit()
    db.refresh(session)
    return session


@router.get("/focus/current", response_model=FocusRead | None)
def current_focus(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(FocusSession)
        .filter(FocusSession.user_id == current_user.id, FocusSession.status == "active")
        .order_by(FocusSession.started_at.desc())
        .first()
    )


@router.get("/alerts", response_model=list[AlertRead])
def list_alerts(
    limit: int = 50,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = resolve_target_user(db, current_user, user_id)
    return (
        db.query(Alert)
        .filter(Alert.user_id == target.id)
        .order_by(Alert.created_at.desc())
        .limit(min(limit, 200))
        .all()
    )


@router.post("/alerts/{alert_id}/ack", response_model=AlertRead)
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alert = db.get(Alert, alert_id)
    if not alert or not can_manage_user(current_user, alert.user_id):
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.acknowledged = True
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/parent/children", response_model=ChildRead, status_code=201)
def create_child(
    payload: ChildCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["parent", "admin"])),
):
    existing = db.query(User).filter(func.lower(User.email) == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    child = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        password_hash=get_password_hash(payload.password),
        role="child",
        parent_id=current_user.id,
    )
    db.add(child)
    db.commit()
    db.refresh(child)
    ensure_user_settings(db, child.id)
    link = ChildAccount(
        parent_id=current_user.id,
        child_id=child.id,
        display_name=payload.display_name or payload.full_name,
        study_schedule=payload.study_schedule,
        bedtime_schedule=payload.bedtime_schedule,
        daily_limits=payload.daily_limits,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.get("/parent/children", response_model=list[ChildRead])
def list_children(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["parent", "admin"])),
):
    query = db.query(ChildAccount).order_by(ChildAccount.created_at.desc())
    if current_user.role != "admin":
        query = query.filter(ChildAccount.parent_id == current_user.id)
    return query.all()


@router.get("/parent/children/{child_id}/activity", response_model=list[ActivityRead])
def child_activity(
    child_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["parent", "admin"])),
):
    child = resolve_target_user(db, current_user, child_id)
    if child.role != "child":
        raise HTTPException(status_code=400, detail="Target is not a child account")
    return (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == child.id)
        .order_by(ActivityLog.created_at.desc())
        .limit(min(limit, 250))
        .all()
    )


@router.post("/blocking/websites", response_model=Message, status_code=201)
def add_blocked_website(
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = resolve_target_user(db, current_user, body.get("user_id"))
    domain = extract_domain(body.get("domain") or body.get("url"))
    if not domain:
        raise HTTPException(status_code=400, detail="Domain is required")
    existing = db.query(BlockedWebsite).filter_by(user_id=target.id, domain=domain).first()
    if not existing:
        db.add(BlockedWebsite(user_id=target.id, domain=domain, reason=body.get("reason", "Blocked by policy")))
        db.commit()
    return Message(message=f"{domain} is blocked")


@router.post("/blocking/apps", response_model=Message, status_code=201)
def add_blocked_app(
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = resolve_target_user(db, current_user, body.get("user_id"))
    process_name = str(body.get("process_name") or body.get("app_name") or "").strip()
    if not process_name:
        raise HTTPException(status_code=400, detail="process_name is required")
    existing = db.query(BlockedApp).filter_by(user_id=target.id, process_name=process_name).first()
    if not existing:
        db.add(
            BlockedApp(
                user_id=target.id,
                process_name=process_name,
                display_name=body.get("display_name", process_name),
                reason=body.get("reason", "Blocked by policy"),
            )
        )
        db.commit()
    return Message(message=f"{process_name} is blocked")


@router.get("/extension/bootstrap", response_model=ExtensionBootstrap)
def extension_bootstrap(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_settings = ensure_user_settings(db, current_user.id)
    blocked_websites = [item.domain for item in db.query(BlockedWebsite).filter_by(user_id=current_user.id, enforced=True).all()]
    blocked_apps = [item.process_name for item in db.query(BlockedApp).filter_by(user_id=current_user.id, enforced=True).all()]
    return ExtensionBootstrap(
        user=UserRead.model_validate(current_user),
        settings=SettingsRead.model_validate(user_settings),
        api_base_url=app_settings.RENDER_BACKEND_URL,
        blocked_websites=blocked_websites,
        blocked_apps=blocked_apps,
    )


@router.get("/reports/weekly")
def weekly_report(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    summary = analytics_summary(days=7, user_id=user_id, db=db, current_user=current_user)
    return {
        "title": "Weekly Productivity Intelligence Report",
        "generated_at": datetime.utcnow().isoformat(),
        "summary": summary.model_dump(),
        "recommendations": summary.ai_insights,
    }


@router.get("/analytics/streak")
def analytics_streak(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current consecutive-day focus streak and burnout risk score."""
    target = resolve_target_user(db, current_user, user_id)
    user_settings = ensure_user_settings(db, target.id)
    since = datetime.utcnow() - timedelta(days=30)
    logs = (
        db.query(ActivityLog)
        .filter(ActivityLog.user_id == target.id, ActivityLog.created_at >= since)
        .order_by(ActivityLog.created_at.asc())
        .all()
    )
    streak = compute_streak(logs, goal_minutes=user_settings.productivity_goal_minutes)
    risk = burnout_score(logs)
    return {
        "streak_days": streak,
        "burnout_risk": risk,
        "burnout_label": "high" if risk >= 0.65 else "medium" if risk >= 0.35 else "low",
    }


@router.delete("/blocking/websites/{domain}", response_model=Message)
def remove_blocked_website(
    domain: str,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = resolve_target_user(db, current_user, user_id)
    normalized = extract_domain(domain) or domain.lower().strip()
    item = db.query(BlockedWebsite).filter_by(user_id=target.id, domain=normalized).first()
    if item:
        db.delete(item)
        db.commit()
    return Message(message=f"{normalized} unblocked")


@router.delete("/blocking/apps/{process_name}", response_model=Message)
def remove_blocked_app(
    process_name: str,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = resolve_target_user(db, current_user, user_id)
    item = db.query(BlockedApp).filter_by(user_id=target.id, process_name=process_name).first()
    if item:
        db.delete(item)
        db.commit()
    return Message(message=f"{process_name} unblocked")


@router.get("/blocking/websites", response_model=list[Dict[str, Any]])
def list_blocked_websites(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = resolve_target_user(db, current_user, user_id)
    items = db.query(BlockedWebsite).filter_by(user_id=target.id).order_by(BlockedWebsite.created_at.desc()).all()
    return [
        {"id": i.id, "domain": i.domain, "reason": i.reason, "enforced": i.enforced}
        for i in items
    ]


@router.get("/blocking/apps", response_model=list[Dict[str, Any]])
def list_blocked_apps(
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = resolve_target_user(db, current_user, user_id)
    items = db.query(BlockedApp).filter_by(user_id=target.id).order_by(BlockedApp.created_at.desc()).all()
    return [
        {"id": i.id, "process_name": i.process_name, "display_name": i.display_name, "enforced": i.enforced}
        for i in items
    ]


@router.patch("/admin/users/{user_id}/toggle", response_model=UserRead)
def toggle_user_active(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    """Toggle a user's is_active status (admin only)."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.get("/admin/users", response_model=list[UserRead])
def admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.get("/admin/system")
def admin_system(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"])),
):
    return {
        "users": db.query(User).count(),
        "children": db.query(User).filter(User.role == "child").count(),
        "activity_logs": db.query(ActivityLog).count(),
        "open_alerts": db.query(Alert).filter(Alert.acknowledged.is_(False)).count(),
        "focus_sessions": db.query(FocusSession).count(),
    }


@router.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    token = websocket.query_params.get("token") or websocket.cookies.get("access_token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    try:
        payload = decode_access_token(token.removeprefix("Bearer ").strip())
        user_id = int(payload["sub"])
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
