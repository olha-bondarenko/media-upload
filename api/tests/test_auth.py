from datetime import UTC, datetime, timedelta

import jwt
import pytest

from app.auth import ALGORITHM, get_current_user
from app.config import get_settings
from app.main import app


@pytest.fixture
def real_auth(client):
    """The test client without its fake user, so requests go through the real token checks."""
    app.dependency_overrides.pop(get_current_user)
    return client


def sign_in(client, role: str) -> str:
    return client.post("/auth/demo-login", json={"role": role}).json()["token"]


def test_demo_login_returns_a_token_and_the_user(real_auth):
    response = real_auth.post("/auth/demo-login", json={"role": "editor"})

    assert response.status_code == 200
    assert response.json()["user"]["role"] == "editor"
    assert response.json()["token"]


def test_demo_login_rejects_unknown_roles(real_auth):
    response = real_auth.post("/auth/demo-login", json={"role": "superuser"})

    assert response.status_code == 422


def test_me_returns_the_user_behind_a_valid_token(real_auth):
    token = sign_in(real_auth, "admin")

    response = real_auth.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["role"] == "admin"


def test_me_requires_a_token(real_auth):
    assert real_auth.get("/auth/me").status_code == 401


def test_a_token_signed_with_another_secret_is_rejected(real_auth):
    payload = {"sub": "demo-admin", "role": "admin"}
    forged = jwt.encode(payload, "not-our-secret", algorithm=ALGORITHM)

    response = real_auth.get("/auth/me", headers={"Authorization": f"Bearer {forged}"})

    assert response.status_code == 401


def test_an_expired_token_is_rejected(real_auth):
    expired = jwt.encode(
        {"sub": "demo-admin", "role": "admin", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        get_settings().jwt_secret,
        algorithm=ALGORITHM,
    )

    response = real_auth.get("/auth/me", headers={"Authorization": f"Bearer {expired}"})

    assert response.status_code == 401
