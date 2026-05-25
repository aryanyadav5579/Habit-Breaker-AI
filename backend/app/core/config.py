import json
from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "Habit Breaker AI"
    ENVIRONMENT: str = "development"
    API_PREFIX: str = "/api"
    SECRET_KEY: str = Field(default="change-this-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    RESET_TOKEN_EXPIRE_MINUTES: int = 30

    DATABASE_URL: str = "sqlite:///./habit_breaker.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    TRUSTED_HOSTS: List[str] = ["*"]
    FORCE_HTTPS: bool = False
    COOKIE_SECURE: bool = False
    RATE_LIMIT_PER_MINUTE: int = 180

    DEFAULT_ADMIN_EMAIL: str = "admin@habitbreaker.ai"
    DEFAULT_ADMIN_PASSWORD: str = "ChangeMe123!"
    DEFAULT_ADMIN_NAME: str = "Habit Breaker Admin"

    FRONTEND_DIST_DIR: str = "frontend/dist"
    RENDER_BACKEND_URL: str = "https://your-app-name.onrender.com"

    @field_validator("CORS_ORIGINS", "TRUSTED_HOSTS", mode="before")
    @classmethod
    def parse_list(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return []
            if value.startswith("["):
                return json.loads(value)
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
