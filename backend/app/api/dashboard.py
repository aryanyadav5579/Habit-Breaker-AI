from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from sqlalchemy import func

from app.db.session import get_db

from app.models import ActivityLog


router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"]
)


@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db)
):

    activities = (
        db.query(ActivityLog)
        .order_by(ActivityLog.created_at.desc())
        .all()
    )

    total = len(activities)

    productive = [
        a for a in activities
        if a.category == "productive"
    ]

    distracting = [
        a for a in activities
        if a.category == "distracting"
    ]

    neutral = [
        a for a in activities
        if a.category == "neutral"
    ]

    productive_seconds = sum(
        a.duration_seconds or 0
        for a in productive
    )

    total_seconds = sum(
        a.duration_seconds or 0
        for a in activities
    )

    focus_hours = round(
        productive_seconds / 3600,
        2
    )

    screen_time_hours = round(
        total_seconds / 3600,
        2
    )

    productivity_score = 0

    if total > 0:

        productivity_score = round(
            (
                len(productive)
                / total
            ) * 100,
            2
        )

    # -----------------------------
    # Weekly trend
    # -----------------------------

    trend_map = defaultdict(
        lambda: {
            "productive": 0,
            "distracting": 0,
            "neutral": 0
        }
    )

    for activity in activities:

        if not activity.created_at:
            continue

        day = activity.created_at.strftime("%a")

        trend_map[day][
            activity.category
        ] += (
            activity.duration_seconds or 0
        )

    daily_trend = []

    ordered_days = [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
    ]

    for day in ordered_days:

        stats = trend_map[day]

        daily_trend.append({
            "date": day,
            "productive": round(
                stats["productive"] / 60,
                2
            ),
            "distracting": round(
                stats["distracting"] / 60,
                2
            ),
            "neutral": round(
                stats["neutral"] / 60,
                2
            )
        })

    # -----------------------------
    # AI insights
    # -----------------------------

    ai_insights = []

    if productivity_score < 40:

        ai_insights.append(
            "High distraction detected. Consider enabling focus mode."
        )

    if len(distracting) > len(productive):

        ai_insights.append(
            "Distracting activity exceeds productive activity."
        )

    if focus_hours > 3:

        ai_insights.append(
            "Excellent deep focus performance today."
        )

    if not ai_insights:

        ai_insights.append(
            "Realtime AI monitoring active."
        )

    # -----------------------------
    # Recent activity
    # -----------------------------

    recent_activity = []

    for activity in activities[:8]:

        recent_activity.append({

            "id": activity.id,

            "domain": activity.domain,

            "category": activity.category,

            "source": activity.source,

            "app_name": activity.app_name,

            "window_title": activity.window_title,

            "distraction_probability":
                activity.distraction_probability
        })

    return {

        "productivity_score":
            productivity_score,

        "focus_hours":
            focus_hours,

        "screen_time_hours":
            screen_time_hours,

        "distraction_count":
            len(distracting),

        "daily_trend":
            daily_trend,

        "ai_insights":
            ai_insights,

        "recent_activity":
            recent_activity
    }