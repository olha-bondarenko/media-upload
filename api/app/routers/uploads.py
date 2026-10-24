import math
import re
import uuid

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.media import Media
from app.schemas.uploads import PART_SIZE, UploadStart, UploadStartOut
from app.storage import Storage, get_storage

router = APIRouter(prefix="/uploads", tags=["uploads"])


def safe_filename(filename: str) -> str:
    """Keeps letters, digits, dots, dashes and underscores, so the storage key is URL-safe."""
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "_", filename)[:100]
    return cleaned or "file"


@router.post("", response_model=UploadStartOut, status_code=201)
def start_upload(
    upload: UploadStart,
    db: Session = Depends(get_db),
    storage: Storage = Depends(get_storage),
):
    media_id = uuid.uuid4()
    storage_key = f"media/{media_id}/{safe_filename(upload.filename)}"

    try:
        upload_id = storage.create_multipart_upload(storage_key, upload.content_type)
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(status_code=502, detail="Storage is unavailable, try again") from exc

    media = Media(
        id=media_id,
        title=upload.resolved_title(),
        status="uploading",
        filename=upload.filename,
        content_type=upload.content_type,
        size_bytes=upload.size_bytes,
        storage_key=storage_key,
        upload_id=upload_id,
    )
    db.add(media)
    db.commit()

    return UploadStartOut(
        media_id=media_id,
        part_size=PART_SIZE,
        part_count=math.ceil(upload.size_bytes / PART_SIZE),
    )