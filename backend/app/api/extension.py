# This module is intentionally a minimal shim.
# All extension bootstrap is handled by app.api.routes with full JWT authentication.
# The router is kept here for import compatibility but registers no routes.

from fastapi import APIRouter

router = APIRouter(prefix="/api/_legacy_extension", tags=["_legacy"])