from datetime import UTC, datetime, timedelta
from enum import StrEnum

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.config import get_settings

ALGORITHM = "HS256"
TOKEN_LIFETIME = timedelta(hours=8)


class Role(StrEnum):
    VIEWER = "viewer"
    EDITOR = "editor"
    ADMIN = "admin"


class User(BaseModel):
    id: str
    name: str
    role: Role


DEMO_USERS: dict[Role, User] = {
    Role.VIEWER: User(id="demo-viewer", name="Demo Viewer", role=Role.VIEWER),
    Role.EDITOR: User(id="demo-editor", name="Demo Editor", role=Role.EDITOR),
    Role.ADMIN: User(id="demo-admin", name="Demo Admin", role=Role.ADMIN),
}


def create_token(user: User) -> str:
    """Creates a signed token that proves who the user is, valid for 8 hours."""
    now = datetime.now(UTC)
    payload = {"sub": user.id, "role": user.role.value, "iat": now, "exp": now + TOKEN_LIFETIME}
    return jwt.encode(payload, get_settings().jwt_secret, algorithm=ALGORITHM)


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> User | None:
    """Returns the signed-in user, or None for guests."""
    if credentials is None:
        return None
    try:
        payload = jwt.decode(
            credentials.credentials, get_settings().jwt_secret, algorithms=[ALGORITHM]
        )
        role = Role(payload["role"])
    except (jwt.InvalidTokenError, KeyError, ValueError) as exc:
        raise HTTPException(
            status_code=401, detail="Your session has expired; sign in again"
        ) from exc
    return DEMO_USERS[role]


def require_role(*roles: Role):
    """Builds a dependency that only lets through users with one of the given roles."""

    def check(user: User | None = Depends(get_current_user)) -> User:
        if user is None:
            raise HTTPException(
                status_code=401, detail="Sign in to do this", headers={"WWW-Authenticate": "Bearer"}
            )
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Your role doesn't allow this")

        return user

    return check


require_signed_in = require_role(*Role)
require_editor = require_role(Role.EDITOR, Role.ADMIN)
require_admin = require_role(Role.ADMIN)
