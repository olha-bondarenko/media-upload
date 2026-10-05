from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from app.db import get_db
from app.main import app

client = TestClient(app)


def test_health_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_db_returns_ok_when_database_answers():
    class WorkingSession:
        def execute(self, statement):
            return None

    app.dependency_overrides[get_db] = lambda: WorkingSession()
    try:
        response = client.get("/health/db")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200


def test_health_db_returns_503_when_database_is_down():
    class BrokenSession:
        def execute(self, statement):
            raise OperationalError("SELECT 1", {}, Exception("connection refused"))

    app.dependency_overrides[get_db] = lambda: BrokenSession()
    try:
        response = client.get("/health/db")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503


def test_cors_allows_the_configured_frontend_origin():
    response = client.get("/health", headers={"Origin": "http://localhost:4000"})

    assert response.headers["access-control-allow-origin"] == "http://localhost:4000"
