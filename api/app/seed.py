from sqlalchemy import func, select

from app.db import SessionLocal
from app.models import Media

SAMPLE_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"

SAMPLES = [
    {
        "title": "Product demo 1",
        "description": "Walkthrough of the new dashboard.",
        "tags": ["demo", "product"],
        "status": "ready",
        "filename": "product-demo.mp4",
        "content_type": "video/mp4",
        "size_bytes": 48_300_000,
        "duration_seconds": 184.0,
        "source_url": SAMPLE_URL,
    },
    {
        "title": "Product demo 2",
        "description": "",
        "tags": ["demo", "product"],
        "status": "uploading",
        "filename": "product-demo.mp4",
        "content_type": "video/mp4",
        "size_bytes": 18_300,
        "duration_seconds": 20.0,
    },
    {
        "title": "Product demo 3",
        "description": "Test test",
        "tags": ["demo", "product", "video"],
        "status": "processing",
        "filename": "product-demo.mp4",
        "content_type": "video/mp4",
        "size_bytes": 78_300_500,
        "duration_seconds": 180.0,
    },
    {
        "title": "Product demo 4",
        "description": "Test test",
        "tags": ["demo", "product", "video"],
        "status": "failed",
        "filename": "product-demo.mp4",
        "content_type": "video/mp4",
        "size_bytes": 700_300_500,
        "duration_seconds": 1758.0,
    },
    {
        "title": "Product demo 5",
        "description": "Test test audio",
        "tags": ["demo", "product", "audio"],
        "status": "ready",
        "filename": "product-demo.mp3",
        "content_type": "audio/mp3",
        "size_bytes": 78_300_500,
        "duration_seconds": 180.0,
        "source_url": SAMPLE_URL,
    },
]


def seed() -> None:
    with SessionLocal() as db:
        existing = db.scalar(select(func.count()).select_from(Media))
        if existing:
            print(f"Skipped: the media table already has {existing} rows.")
            return

        for sample in SAMPLES:
            db.add(Media(**sample))
        db.commit()
        print(f"Added {len(SAMPLES)} media items.")


if __name__ == "__main__":
    seed()
