import pytest
from botocore.exceptions import ClientError, EndpointConnectionError
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.auth import DEMO_USERS, Role, get_current_user
from app.db import Base, get_db
from app.main import app
from app.models.media import Media
from app.storage import get_storage


class FakeStorage:
    """Stands in for R2: no network calls, and records every call so tests can check them."""

    def __init__(self) -> None:
        self.created: list[tuple[str, str]] = []
        self.completed: list[tuple[str, str, list]] = []
        self.aborted: list[tuple[str, str]] = []
        self.deleted: list[str] = []
        self.fail_create = False
        self.fail_complete = False

    def create_multipart_upload(self, key: str, content_type: str) -> str:
        if self.fail_create:
            raise EndpointConnectionError(endpoint_url="https://storage.test")
        self.created.append((key, content_type))
        return "upload-123"

    def presign_upload_part(self, key: str, upload_id: str, part_number: int) -> str:
        return f"https://storage.test/{key}?uploadId={upload_id}&partNumber={part_number}"

    def complete_multipart_upload(self, key: str, upload_id: str, parts: list) -> None:
        if self.fail_complete:
            raise ClientError({"Error": {"Code": "InvalidPart"}}, "CompleteMultipartUpload")
        self.completed.append((key, upload_id, parts))

    def abort_multipart_upload(self, key: str, upload_id: str) -> None:
        self.aborted.append((key, upload_id))

    def presign_download(self, key: str) -> str:
        return f"https://storage.test/{key}"

    def delete_object(self, key: str) -> None:
        self.deleted.append(key)


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture
def storage():
    """The fake storage the test client uses; tests can inspect it or make it fail."""
    return FakeStorage()


@pytest.fixture
def current_user():
    """The user the test client acts as. Admin by default; tests can override it."""
    return DEMO_USERS[Role.ADMIN]


@pytest.fixture
def client(db, storage, current_user):
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[get_storage] = lambda: storage
    app.dependency_overrides[get_current_user] = lambda: current_user
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def make_media(db):
    def _make_media(**overrides) -> Media:
        fields = {
            "title": "Sample",
            "filename": "sample.mp4",
            "content_type": "video/mp4",
            "size_bytes": 1024,
        }
        media = Media(**(fields | overrides))
        db.add(media)
        db.commit()
        return media

    return _make_media
