from typing import Callable, Iterable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def _extract_token(request: Request, bearer_token: str | None) -> str | None:
    if bearer_token:
        return bearer_token
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token.removeprefix("Bearer ").strip()
    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    bearer_token: str | None = Depends(oauth2_scheme),
) -> User:
    token = _extract_token(request, bearer_token)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive or missing user")
    return user


def require_roles(roles: Iterable[str]) -> Callable:
    allowed = set(roles)

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return dependency


def can_manage_user(actor: User, target_user_id: int) -> bool:
    if actor.role == "admin":
        return True
    if actor.id == target_user_id:
        return True
    if actor.role == "parent":
        return any(child.id == target_user_id for child in actor.children)
    return False

