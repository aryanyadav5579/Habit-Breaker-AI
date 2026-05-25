# Re-export from services.realtime so existing imports continue to work.
# The old broadcast-only ConnectionManager has been replaced with the per-user
# implementation in app.services.realtime.

from app.services.realtime import manager  # noqa: F401

__all__ = ["manager"]