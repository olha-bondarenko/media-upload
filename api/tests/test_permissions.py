import uuid

import pytest

from app.auth import DEMO_USERS, Role

GUEST = None
VIEWER = DEMO_USERS[Role.VIEWER]
EDITOR = DEMO_USERS[Role.EDITOR]
ADMIN = DEMO_USERS[Role.ADMIN]
ROLE_IDS = ["guest", "viewer", "editor", "admin"]


# Each test below runs once per role. Parametrizing `current_user` replaces the fixture of
# the same name in conftest.py, so the test client acts as that user for the whole test.


@pytest.mark.parametrize("current_user", [GUEST, VIEWER, EDITOR, ADMIN], ids=ROLE_IDS)
def test_everyone_can_browse(client, make_media, current_user):
    media = make_media(status="ready")

    assert client.get("/media").status_code == 200
    assert client.get(f"/media/{media.id}").status_code == 200


@pytest.mark.parametrize(
    ("current_user", "expected"),
    [(GUEST, 401), (VIEWER, 403), (EDITOR, 201), (ADMIN, 201)],
    ids=ROLE_IDS,
)
def test_who_can_upload(client, current_user, expected):
    response = client.post(
        "/uploads", json={"filename": "a.mp4", "content_type": "video/mp4", "size_bytes": 5}
    )

    assert response.status_code == expected


@pytest.mark.parametrize(
    ("current_user", "expected"),
    [(GUEST, 401), (VIEWER, 403), (EDITOR, 200), (ADMIN, 200)],
    ids=ROLE_IDS,
)
def test_who_can_edit(client, make_media, current_user, expected):
    media = make_media(status="ready")

    response = client.patch(f"/media/{media.id}", json={"title": "Renamed"})

    assert response.status_code == expected


@pytest.mark.parametrize(
    ("current_user", "expected"),
    [(GUEST, 401), (VIEWER, 403), (EDITOR, 403), (ADMIN, 204)],
    ids=ROLE_IDS,
)
def test_who_can_delete(client, make_media, current_user, expected):
    media = make_media(status="ready")

    response = client.delete(f"/media/{media.id}")

    assert response.status_code == expected


@pytest.mark.parametrize("current_user", [VIEWER], ids=["viewer"])
def test_the_whole_uploads_router_is_protected(client, current_user):
    response = client.post(f"/uploads/{uuid.uuid4()}/parts", json={"part_numbers": [1]})

    assert response.status_code == 403


# --- Deleting, as admin (the default user) ----------------------------------------


def test_delete_removes_the_media_and_its_file(client, make_media, storage):
    media = make_media(status="ready", storage_key="media/abc/clip.mp4")

    response = client.delete(f"/media/{media.id}")

    assert response.status_code == 204
    assert storage.deleted == ["media/abc/clip.mp4"]
    assert client.get(f"/media/{media.id}").status_code == 404


def test_delete_seeded_media_skips_storage(client, make_media, storage):
    media = make_media(status="ready", source_url="https://example.com/a.mp4")

    assert client.delete(f"/media/{media.id}").status_code == 204
    assert storage.deleted == []


def test_delete_refuses_uploads_in_progress(client, make_media):
    media = make_media(status="uploading", storage_key="media/abc/clip.mp4")

    assert client.delete(f"/media/{media.id}").status_code == 409


def test_delete_returns_404_for_unknown_media(client):
    assert client.delete(f"/media/{uuid.uuid4()}").status_code == 404
