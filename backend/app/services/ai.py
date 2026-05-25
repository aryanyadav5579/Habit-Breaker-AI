"""
AI classification and prediction service for Habit Breaker AI.

Improvements over original:
- Random Forest is cached per user (not retrained on every request)
- Pre-trained model.pkl is loaded as global fallback if available
- Burnout detection added
- Consecutive-day streak calculation added
- Thread-safe model cache with TTL
"""

import threading
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, Optional
from urllib.parse import urlparse

from app.models import ActivityLog, UserSettings

try:  # Optional at runtime, included in production requirements.
    from sklearn.ensemble import RandomForestClassifier
    import joblib
except Exception:  # pragma: no cover
    RandomForestClassifier = None  # type: ignore[assignment,misc]
    joblib = None  # type: ignore[assignment]


# ---------------------------------------------------------------------------
# Productive / Distracting defaults
# ---------------------------------------------------------------------------

PRODUCTIVE_DEFAULTS = {
    "github.com",
    "stackoverflow.com",
    "docs.google.com",
    "chat.openai.com",
    "notion.so",
    "docs.python.org",
    "developer.mozilla.org",
    "leetcode.com",
    "kaggle.com",
    "coursera.org",
    "udemy.com",
    "linear.app",
    "figma.com",
    "confluence.atlassian.com",
    "jira.atlassian.com",
}

DISTRACTING_DEFAULTS = {
    "youtube.com",
    "instagram.com",
    "netflix.com",
    "reddit.com",
    "facebook.com",
    "tiktok.com",
    "x.com",
    "twitter.com",
    "twitch.tv",
    "9gag.com",
    "buzzfeed.com",
    "pinterest.com",
    "snapchat.com",
}


# ---------------------------------------------------------------------------
# Pre-trained global model (loaded once at import time if available)
# ---------------------------------------------------------------------------

_GLOBAL_MODEL: Optional[Any] = None
_MODEL_LOCK = threading.Lock()


def _load_global_model() -> Optional[Any]:
    """Load model.pkl from the model/ directory once."""
    global _GLOBAL_MODEL
    if _GLOBAL_MODEL is not None:
        return _GLOBAL_MODEL
    if joblib is None:
        return None
    with _MODEL_LOCK:
        if _GLOBAL_MODEL is not None:
            return _GLOBAL_MODEL
        model_path = Path(__file__).resolve().parents[3] / "model" / "model.pkl"
        if model_path.exists():
            try:
                _GLOBAL_MODEL = joblib.load(model_path)
                print(f"[AI] Loaded pre-trained model from {model_path}")
            except Exception as exc:
                print(f"[AI] Could not load model.pkl: {exc}")
    return _GLOBAL_MODEL


# ---------------------------------------------------------------------------
# Per-user model cache with TTL
# ---------------------------------------------------------------------------

_USER_MODEL_CACHE: Dict[int, Dict[str, Any]] = {}
_CACHE_LOCK = threading.Lock()
_CACHE_TTL_SECONDS = 300  # Retrain at most once per 5 minutes per user


def _get_cached_model(user_id: int) -> Optional[Any]:
    with _CACHE_LOCK:
        entry = _USER_MODEL_CACHE.get(user_id)
        if entry and (time.time() - entry["trained_at"]) < _CACHE_TTL_SECONDS:
            return entry["model"]
    return None


def _set_cached_model(user_id: int, model: Any) -> None:
    with _CACHE_LOCK:
        _USER_MODEL_CACHE[user_id] = {
            "model": model,
            "trained_at": time.time(),
        }


# ---------------------------------------------------------------------------
# Classification dataclass
# ---------------------------------------------------------------------------

@dataclass
class Classification:
    category: str
    productivity_weight: float
    distraction_probability: float
    blocked: bool
    recommendation: str
    features: Dict[str, Any]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def extract_domain(url: str | None) -> str | None:
    if not url:
        return None
    parsed = urlparse(url if "://" in url else f"https://{url}")
    return (parsed.hostname or "").lower().removeprefix("www.") or None


def _matches(value: str | None, patterns: Iterable[str]) -> bool:
    if not value:
        return False
    candidate = value.lower()
    for pattern in patterns:
        normalized = str(pattern).lower().strip().removeprefix("www.")
        if normalized and (
            candidate == normalized
            or candidate.endswith(f".{normalized}")
            or normalized in candidate
        ):
            return True
    return False


# ---------------------------------------------------------------------------
# Rule-based classification
# ---------------------------------------------------------------------------

def classify_activity(payload: Dict[str, Any], settings: UserSettings) -> Classification:
    domain = payload.get("domain") or extract_domain(payload.get("url"))
    app_name = (payload.get("app_name") or "").lower()
    idle_seconds = int(payload.get("idle_seconds") or 0)
    switching_frequency = int(payload.get("switching_frequency") or 0)
    hour = datetime.utcnow().hour

    productive_sites = set(settings.productive_websites or []) | PRODUCTIVE_DEFAULTS
    distracting_sites = set(settings.distracting_websites or []) | DISTRACTING_DEFAULTS
    productive_apps = {item.lower() for item in settings.productive_apps or []}
    distracting_apps = {item.lower() for item in settings.distracting_apps or []}

    productive_match = _matches(domain, productive_sites) or _matches(app_name, productive_apps)
    distracting_match = _matches(domain, distracting_sites) or _matches(app_name, distracting_apps)
    blocked = bool(settings.blocking_enabled and distracting_match)

    probability = 0.18
    if distracting_match:
        probability += 0.58
    if productive_match:
        probability -= 0.18
    if idle_seconds > 300:
        probability += 0.10
    if switching_frequency >= 8:
        probability += 0.12
    if hour < 6 or hour > 22:
        probability += 0.08
    if settings.child_safe_mode and distracting_match:
        probability += 0.12

    probability = max(0.01, min(0.99, probability))
    sensitivity = settings.distraction_sensitivity or 0.65

    if productive_match and probability < sensitivity:
        category = "productive"
        weight = 1.0
        recommendation = "Stay with this work context and batch similar tasks together."
    elif distracting_match or probability >= sensitivity:
        category = "distracting"
        weight = -1.0
        recommendation = "Return to your selected work application or start a short focus reset."
    else:
        category = "neutral"
        weight = 0.0
        recommendation = "Keep monitoring. This activity is not clearly productive or distracting yet."

    features = {
        "domain": domain,
        "app_name": app_name,
        "idle_seconds": idle_seconds,
        "switching_frequency": switching_frequency,
        "hour_utc": hour,
        "sensitivity": sensitivity,
        "productive_match": productive_match,
        "distracting_match": distracting_match,
        "child_safe_mode": settings.child_safe_mode,
    }

    return Classification(category, weight, probability, blocked, recommendation, features)


# ---------------------------------------------------------------------------
# AI insights from logs
# ---------------------------------------------------------------------------

def insight_from_logs(logs: list[ActivityLog]) -> list[str]:
    if not logs:
        return [
            "Start a focus session to establish your baseline productivity rhythm.",
            "Add your core work apps and distracting sites in Settings for sharper predictions.",
        ]

    distractions = [log for log in logs if log.category == "distracting"]
    productive = [log for log in logs if log.category == "productive"]
    insights = []

    if len(distractions) > len(productive):
        insights.append(
            "Distractions are outpacing productive activity. Use blocking during your next focus block."
        )
    else:
        insights.append(
            "Your productive activity is ahead of distractions. Preserve the current schedule."
        )

    late_logs = [log for log in logs if log.created_at.hour >= 22 or log.created_at.hour < 6]
    if late_logs:
        insights.append(
            "Late-night screen activity is visible. Consider a bedtime lock window."
        )

    high_probability = [log for log in logs if (log.distraction_probability or 0) >= 0.75]
    if high_probability:
        insights.append(
            "AI detected repeated high-risk distraction moments. Move breaks before those time windows."
        )

    # Burnout signal
    burnout = burnout_score(logs)
    if burnout >= 0.65:
        insights.append(
            "⚠ Burnout risk detected: high screen time with low productive ratio. "
            "Schedule a proper recovery block and reduce multitasking."
        )

    return insights[:5]


# ---------------------------------------------------------------------------
# Burnout detection
# ---------------------------------------------------------------------------

def burnout_score(logs: list[ActivityLog]) -> float:
    """
    Returns a 0–1 burnout risk score based on:
    - High total screen time
    - Low productive fraction
    - High switching frequency
    """
    if not logs:
        return 0.0

    total_seconds = sum(max(int(log.duration_seconds or 0), 30) for log in logs)
    productive_seconds = sum(
        max(int(log.duration_seconds or 0), 30)
        for log in logs
        if log.category == "productive"
    )
    high_switch_count = sum(1 for log in logs if (log.distraction_probability or 0) >= 0.75)

    if total_seconds == 0:
        return 0.0

    productive_ratio = productive_seconds / total_seconds
    screen_hours = total_seconds / 3600

    # High screen time penalty (>8h/day equivalent)
    screen_penalty = min(screen_hours / 8.0, 1.0) * 0.35

    # Low productivity penalty
    low_prod_penalty = max(0.0, (0.5 - productive_ratio)) * 0.5

    # Distraction frequency penalty
    distraction_penalty = min(high_switch_count / max(len(logs), 1), 1.0) * 0.15

    score = screen_penalty + low_prod_penalty + distraction_penalty
    return round(min(score, 1.0), 4)


# ---------------------------------------------------------------------------
# Focus streak calculation
# ---------------------------------------------------------------------------

def compute_streak(logs: list[ActivityLog], goal_minutes: int = 300) -> int:
    """
    Returns the number of consecutive calendar days (ending today or yesterday)
    where productive minutes met the goal.
    """
    from collections import defaultdict
    from datetime import date, timedelta

    if not logs:
        return 0

    daily_productive: Dict[date, float] = defaultdict(float)
    for log in logs:
        if log.category == "productive":
            day = log.created_at.date()
            daily_productive[day] += max(int(log.duration_seconds or 0), 30) / 60.0

    today = datetime.utcnow().date()
    streak = 0
    current = today

    while True:
        if daily_productive.get(current, 0) >= goal_minutes:
            streak += 1
            current -= timedelta(days=1)
        elif current == today and daily_productive.get(current - timedelta(days=1), 0) >= goal_minutes:
            # Allow today to be incomplete if yesterday had a streak
            current -= timedelta(days=1)
        else:
            break

    return streak


# ---------------------------------------------------------------------------
# Random Forest probability refinement (cached)
# ---------------------------------------------------------------------------

def refine_probability_with_random_forest(
    recent_logs: list[ActivityLog],
    current_features: Dict[str, Any],
    fallback_probability: float,
    user_id: int = 0,
) -> float:
    """
    Refines distraction probability using a per-user cached Random Forest.
    Falls back to rule-based probability if insufficient training data.
    """
    if RandomForestClassifier is None:
        return fallback_probability

    if len(recent_logs) < 30:
        # Try global pre-trained model
        global_model = _load_global_model()
        if global_model is not None:
            try:
                vec = _feature_vector_from_features(current_features)
                prob = global_model.predict_proba([vec])[0][1]
                return round(max(0.01, min(0.99, (prob * 0.4) + (fallback_probability * 0.6))), 4)
            except Exception:
                pass
        return fallback_probability

    labelled = [log for log in recent_logs if log.category in {"productive", "distracting", "neutral"}]
    labels = [1 if log.category == "distracting" else 0 for log in labelled]
    if len(set(labels)) < 2:
        return fallback_probability

    # Check cache first
    cached_model = _get_cached_model(user_id)
    if cached_model is None:
        x_train = [_feature_vector_from_log(log) for log in labelled]
        cached_model = RandomForestClassifier(
            n_estimators=80,
            max_depth=8,
            random_state=42,
            class_weight="balanced",
        )
        cached_model.fit(x_train, labels)
        _set_cached_model(user_id, cached_model)

    try:
        probability = cached_model.predict_proba([_feature_vector_from_features(current_features)])[0][1]
        return round(max(0.01, min(0.99, (probability * 0.55) + (fallback_probability * 0.45))), 4)
    except Exception:
        return fallback_probability


def _feature_vector_from_log(log: ActivityLog) -> list[float]:
    return [
        float(log.created_at.hour),
        float(log.created_at.weekday()),
        float(log.idle_seconds or 0),
        float(log.duration_seconds or 0),
        1.0 if log.domain else 0.0,
        1.0 if log.app_name else 0.0,
        float(log.distraction_probability or 0),
        1.0 if log.blocked else 0.0,
    ]


def _feature_vector_from_features(features: Dict[str, Any]) -> list[float]:
    now = datetime.utcnow()
    return [
        float(features.get("hour_utc", now.hour)),
        float(now.weekday()),
        float(features.get("idle_seconds", 0) or 0),
        30.0,
        1.0 if features.get("domain") else 0.0,
        1.0 if features.get("app_name") else 0.0,
        1.0 if features.get("distracting_match") else 0.0,
        1.0 if features.get("child_safe_mode") else 0.0,
    ]
