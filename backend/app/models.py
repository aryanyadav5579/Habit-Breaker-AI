from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import backref, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(32), default="user", index=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    children = relationship("User", backref=backref("parent", remote_side=[id]))
    settings = relationship("UserSettings", back_populates="user", uselist=False)


class ChildAccount(Base):
    __tablename__ = "child_accounts"
    __table_args__ = (UniqueConstraint("parent_id", "child_id", name="uq_parent_child"),)

    id = Column(Integer, primary_key=True)
    parent_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    child_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    display_name = Column(String(255), nullable=False)
    study_schedule = Column(JSON, default=dict)
    bedtime_schedule = Column(JSON, default=dict)
    daily_limits = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    parent = relationship("User", foreign_keys=[parent_id])
    child = relationship("User", foreign_keys=[child_id])


class UserSettings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    productive_websites = Column(JSON, default=list)
    distracting_websites = Column(JSON, default=list)
    productive_apps = Column(JSON, default=list)
    distracting_apps = Column(JSON, default=list)
    focus_mode_duration = Column(Integer, default=50)
    alert_sound = Column(String(80), default="soft-bell")
    productivity_goal_minutes = Column(Integer, default=300)
    work_schedule = Column(JSON, default=dict)
    daily_limits = Column(JSON, default=dict)
    distraction_sensitivity = Column(Float, default=0.65)
    blocking_enabled = Column(Boolean, default=False)
    child_safe_mode = Column(Boolean, default=False)
    bedtime_schedule = Column(JSON, default=dict)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="settings")


class BlockedWebsite(Base):
    __tablename__ = "blocked_websites"
    __table_args__ = (UniqueConstraint("user_id", "domain", name="uq_user_blocked_domain"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    domain = Column(String(255), nullable=False, index=True)
    reason = Column(String(255), default="Distracting or unsafe content")
    enforced = Column(Boolean, default=True)
    schedule = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class BlockedApp(Base):
    __tablename__ = "blocked_apps"
    __table_args__ = (UniqueConstraint("user_id", "process_name", name="uq_user_blocked_app"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    process_name = Column(String(255), nullable=False, index=True)
    display_name = Column(String(255), nullable=False)
    reason = Column(String(255), default="Restricted during focus time")
    enforced = Column(Boolean, default=True)
    schedule = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source = Column(String(40), nullable=False, index=True)
    url = Column(Text, nullable=True)
    domain = Column(String(255), nullable=True, index=True)
    app_name = Column(String(255), nullable=True, index=True)
    window_title = Column(Text, nullable=True)
    category = Column(String(40), default="neutral", index=True)
    productivity_weight = Column(Float, default=0.0)
    duration_seconds = Column(Integer, default=0)
    idle_seconds = Column(Integer, default=0)
    distraction_probability = Column(Float, default=0.0)
    blocked = Column(Boolean, default=False)
    extra = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User")


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), default="active", index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    planned_duration_minutes = Column(Integer, default=50)
    productivity_score = Column(Float, default=0.0)
    distraction_count = Column(Integer, default=0)
    notes = Column(Text, nullable=True)


class ProductivityScore(Base):
    __tablename__ = "productivity_scores"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    focus_minutes = Column(Float, default=0)
    distraction_minutes = Column(Float, default=0)
    total_screen_minutes = Column(Float, default=0)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AIPrediction(Base):
    __tablename__ = "AI_predictions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_log_id = Column(Integer, ForeignKey("activity_logs.id", ondelete="CASCADE"), nullable=True)
    probability = Column(Float, nullable=False)
    label = Column(String(40), nullable=False)
    features = Column(JSON, default=dict)
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    child_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    event_type = Column(String(80), nullable=False, index=True)
    severity = Column(String(30), default="medium", index=True)
    message = Column(Text, nullable=False)
    acknowledged = Column(Boolean, default=False)
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

