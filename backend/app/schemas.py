from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


Role = Literal["user", "parent", "child", "admin"]

class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: Role
    is_active: bool
    parent_id: Optional[int] = None
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    csrf_token: str
    user: UserRead


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8)
    role: Role = "user"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class SettingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    productive_websites: List[str]
    distracting_websites: List[str]
    productive_apps: List[str]
    distracting_apps: List[str]
    focus_mode_duration: int
    alert_sound: str
    productivity_goal_minutes: int
    work_schedule: Dict[str, Any]
    daily_limits: Dict[str, Any]
    distraction_sensitivity: float
    blocking_enabled: bool
    child_safe_mode: bool
    bedtime_schedule: Dict[str, Any]
    updated_at: Optional[datetime] = None


class SettingsUpdate(BaseModel):
    productive_websites: Optional[List[str]] = None
    distracting_websites: Optional[List[str]] = None
    productive_apps: Optional[List[str]] = None
    distracting_apps: Optional[List[str]] = None
    focus_mode_duration: Optional[int] = Field(default=None, ge=5, le=240)
    alert_sound: Optional[str] = None
    productivity_goal_minutes: Optional[int] = Field(default=None, ge=15, le=1440)
    work_schedule: Optional[Dict[str, Any]] = None
    daily_limits: Optional[Dict[str, Any]] = None
    distraction_sensitivity: Optional[float] = Field(default=None, ge=0.05, le=1.0)
    blocking_enabled: Optional[bool] = None
    child_safe_mode: Optional[bool] = None
    bedtime_schedule: Optional[Dict[str, Any]] = None

    @field_validator("productive_websites", "distracting_websites", mode="before")
    @classmethod
    def normalize_domains(cls, value):
        if value is None:
            return value
        return [str(item).lower().strip().replace("https://", "").replace("http://", "").split("/")[0] for item in value if str(item).strip()]


class ActivityCreate(BaseModel):
    source: Literal["browser", "desktop", "manual"] = "browser"
    url: Optional[str] = None
    domain: Optional[str] = None
    app_name: Optional[str] = None
    window_title: Optional[str] = None
    duration_seconds: int = Field(default=0, ge=0, le=86400)
    idle_seconds: int = Field(default=0, ge=0, le=86400)
    switching_frequency: int = Field(default=0, ge=0)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    source: str
    url: Optional[str]
    domain: Optional[str]
    app_name: Optional[str]
    window_title: Optional[str]
    category: str
    productivity_weight: float
    duration_seconds: int
    idle_seconds: int
    distraction_probability: float
    blocked: bool
    created_at: datetime


class ActivityResult(BaseModel):
    activity: ActivityRead
    blocked: bool
    warning: Optional[str]
    recommendation: str
    distraction_probability: float


class FocusStart(BaseModel):
    planned_duration_minutes: int = Field(default=50, ge=5, le=240)
    notes: Optional[str] = None


class FocusRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    status: str
    started_at: datetime
    ended_at: Optional[datetime]
    planned_duration_minutes: int
    productivity_score: float
    distraction_count: int
    notes: Optional[str]


class ChildCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8)
    display_name: Optional[str] = None
    study_schedule: Dict[str, Any] = Field(default_factory=dict)
    bedtime_schedule: Dict[str, Any] = Field(default_factory=dict)
    daily_limits: Dict[str, Any] = Field(default_factory=dict)


class ChildRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    parent_id: int
    child_id: int
    display_name: str
    study_schedule: Dict[str, Any]
    bedtime_schedule: Dict[str, Any]
    daily_limits: Dict[str, Any]
    created_at: datetime
    child: UserRead


class AlertRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    child_id: Optional[int]
    event_type: str
    severity: str
    message: str
    acknowledged: bool
    payload: Dict[str, Any]
    created_at: datetime


class AnalyticsSummary(BaseModel):
    productivity_score: float
    focus_hours: float
    distraction_count: int
    screen_time_hours: float
    top_distracting_websites: List[Dict[str, Any]]
    top_productive_apps: List[Dict[str, Any]]
    daily_trend: List[Dict[str, Any]]
    heatmap: List[Dict[str, Any]]
    ai_insights: List[str]


class ExtensionBootstrap(BaseModel):
    user: UserRead
    settings: SettingsRead
    api_base_url: str
    blocked_websites: List[str]
    blocked_apps: List[str]


class Message(BaseModel):
    message: str
