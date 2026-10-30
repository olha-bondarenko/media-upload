import uuid

import pytest
from botocore.exceptions import ClientError, EndpointConnectionError

from app.main import app
from app.storage import get_storage

VIDEO_26_MIB = 26_214_400  # three 10 MiB parts: 10 + 10 + 6


class FakeUploadStorage:
    """Stands in for R2: records every call so tests can check what the API asked for."""

    def __init__(self) -> None:
        self.created: list[tuple[str, str]] = []
        self.completed: list[tuple[str, str, list]] = []
        self.aborted: list[tuple[str, str]] = []
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


@pytest.fixture
def storage(client):
    fake = FakeUploadStorage()
    app.dependency_overrides[get_storage] = lambda: fake
    return fake


def start(client, filename="Demo day.mp4", size_bytes=5, content_type="video/mp4"):
    """Starts an upload through the API and returns the response."""
    return client.post(
        "/uploads",
        json={"filename": filename, "content_type": content_type, "size_bytes": size_bytes},
    )


def complete_body(*part_numbers):
    return {"parts": [{"part_number": n, "etag": f'"etag-{n}"'} for n in part_numbers]}


# --- Starting an upload ------------------------------------------------------


def test_start_creates_media_and_opens_upload(client, storage):
    response = start(client, size_bytes=VIDEO_26_MIB)

    assert response.status_code == 201
    body = response.json()
    assert body["part_count"] == 3
    assert body["part_size"] == 10 * 1024 * 1024

    key, content_type = storage.created[0]
    assert key == f"media/{body['media_id']}/Demo_day.mp4"
    assert content_type == "video/mp4"

    media = client.get(f"/media/{body['media_id']}").json()
    assert media["status"] == "uploading"
    assert media["title"] == "Demo day"
    assert media["playback_url"] is None


def test_start_rejects_files_that_are_not_video_or_audio(client, storage):
    response = start(client, filename="cv.pdf", content_type="application/pdf")

    assert response.status_code == 422
    assert storage.created == []


@pytest.mark.parametrize("size_bytes", [0, 200_000_001])
def test_start_rejects_empty_or_too_large_files(client, storage, size_bytes):
    response = start(client, size_bytes=size_bytes)

    assert response.status_code == 422
    assert storage.created == []


def test_start_saves_nothing_when_storage_is_down(client, storage):
    storage.fail_create = True

    response = start(client)

    assert response.status_code == 502
    assert client.get("/media").json()["total"] == 0


# --- Part URLs ----------------------------------------------------------------


def test_part_urls_returns_one_signed_url_per_part(client, storage):
    media_id = start(client, size_bytes=VIDEO_26_MIB).json()["media_id"]

    response = client.post(f"/uploads/{media_id}/parts", json={"part_numbers": [1, 2, 3]})

    assert response.status_code == 200
    parts = response.json()["parts"]
    assert [part["part_number"] for part in parts] == [1, 2, 3]
    assert "partNumber=2" in parts[1]["url"]


@pytest.mark.parametrize("part_number", [0, 4])
def test_part_urls_rejects_numbers_out_of_range(client, storage, part_number):
    media_id = start(client, size_bytes=VIDEO_26_MIB).json()["media_id"]

    response = client.post(f"/uploads/{media_id}/parts", json={"part_numbers": [part_number]})

    assert response.status_code == 422


def test_part_urls_returns_404_for_unknown_upload(client, storage):
    response = client.post(f"/uploads/{uuid.uuid4()}/parts", json={"part_numbers": [1]})

    assert response.status_code == 404


# --- Completing ---------------------------------------------------------------


def test_complete_marks_media_ready_and_playable(client, storage):
    media_id = start(client).json()["media_id"]

    response = client.post(f"/uploads/{media_id}/complete", json=complete_body(1))

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ready"
    assert body["playback_url"] == f"https://storage.test/media/{media_id}/Demo_day.mp4"
    assert len(storage.completed) == 1


def test_complete_requires_every_part(client, storage):
    media_id = start(client, size_bytes=VIDEO_26_MIB).json()["media_id"]

    response = client.post(f"/uploads/{media_id}/complete", json=complete_body(1, 2))

    assert response.status_code == 422
    assert storage.completed == []


def test_complete_twice_returns_409(client, storage):
    media_id = start(client).json()["media_id"]
    client.post(f"/uploads/{media_id}/complete", json=complete_body(1))

    response = client.post(f"/uploads/{media_id}/complete", json=complete_body(1))

    assert response.status_code == 409


def test_complete_returns_400_when_storage_rejects_the_parts(client, storage):
    storage.fail_complete = True
    media_id = start(client).json()["media_id"]

    response = client.post(f"/uploads/{media_id}/complete", json=complete_body(1))

    assert response.status_code == 400
    assert client.get(f"/media/{media_id}").json()["status"] == "uploading"


# --- Aborting -----------------------------------------------------------------


def test_abort_discards_the_upload_and_deletes_the_media(client, storage):
    media_id = start(client).json()["media_id"]

    response = client.delete(f"/uploads/{media_id}")

    assert response.status_code == 204
    assert storage.aborted == [(f"media/{media_id}/Demo_day.mp4", "upload-123")]
    assert client.get(f"/media/{media_id}").status_code == 404


def test_abort_after_completion_returns_409(client, storage):
    media_id = start(client).json()["media_id"]
    client.post(f"/uploads/{media_id}/complete", json=complete_body(1))

    response = client.delete(f"/uploads/{media_id}")

    assert response.status_code == 409
