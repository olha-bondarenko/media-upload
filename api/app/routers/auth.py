from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth import DEMO_USERS, Role, User, create_token, require_role

router = APIRouter(prefix="/auth", tags=["auth"])

require_signed_in = require_role(*Role)
require_editor = require_role(Role.EDITOR, Role.ADMIN)
require_admin = require_role(Role.ADMIN)


class DemoLogin(BaseModel):
    role: Role


class AuthSession(BaseModel):
    token: str
    user: User


@router.post("/demo-login", response_model=AuthSession)
def demo_login(body: DemoLogin):
    """Signs in as one of the three demo accounts. There are no passwords in this demo."""
    user = DEMO_USERS[body.role]
    return AuthSession(token=create_token(user), user=user)


@router.get("/me", response_model=User)
def me(user: User = Depends(require_signed_in)):
    """Returns the signed-in user, so the frontend can check a stored token is still valid."""
    return user
