import uuid


def test_list_returns_all_media(client, make_media):
    make_media(title="First")
    make_media(title="Second")

    response = client.get("/media")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert len(body["items"]) == 2


def test_list_filters_by_search_query(client, make_media):
    make_media(title="Product demo")
    make_media(title="Interview")

    response = client.get("/media?q=demo")

    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["title"] == "Product demo"


def test_list_filters_by_status(client, make_media):
    make_media(title="Done", status="ready")
    make_media(title="Broken", status="failed")

    response = client.get("/media?status=failed")

    items = response.json()["items"]
    assert [item["title"] for item in items] == ["Broken"]


def test_list_paginates_but_reports_full_total(client, make_media):
    for title in ("A", "B", "C"):
        make_media(title=title)

    response = client.get("/media?limit=2")

    body = response.json()
    assert len(body["items"]) == 2
    assert body["total"] == 3


def test_list_rejects_limit_above_maximum(client):
    response = client.get("/media?limit=500")

    assert response.status_code == 422


def test_detail_returns_media(client, make_media):
    media = make_media(title="Keynote")

    response = client.get(f"/media/{media.id}")

    assert response.status_code == 200
    assert response.json()["title"] == "Keynote"


def test_detail_returns_404_for_unknown_id(client):
    response = client.get(f"/media/{uuid.uuid4()}")

    assert response.status_code == 404


def test_update_changes_title(client, make_media):
    media = make_media(title="Old name")

    response = client.patch(f"/media/{media.id}", json={"title": "Renamed"})

    assert response.status_code == 200
    assert response.json()["title"] == "Renamed"


def test_update_leaves_other_fields_alone(client, make_media):
    media = make_media(title="Old name", description="Keep me")

    response = client.patch(f"/media/{media.id}", json={"title": "Renamed"})

    assert response.json()["description"] == "Keep me"


def test_update_rejects_unknown_fields(client, make_media):
    media = make_media()

    response = client.patch(f"/media/{media.id}", json={"status": "ready"})

    assert response.status_code == 422


def test_playback_url_comes_from_source_url(client, make_media):
    media = make_media(source_url="https://example.com/a.mp4")

    response = client.get(f"/media/{media.id}")

    assert response.json()["playback_url"] == "https://example.com/a.mp4"
