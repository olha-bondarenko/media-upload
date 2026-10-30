import math
import re
import uuid

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.media import Media
from app.routers.media import to_media_out
from app.schemas.media import MediaOut
from app.schemas.uploads import (
    PART_SIZE,
    PartUrl,
    PartUrlsOut,
    PartUrlsRequest,
    UploadComplete,
    UploadStart,
    UploadStartOut,
)
from app.storage import CompletedPart, Storage, get_storage

router = APIRouter(prefix="/uploads", tags=["uploads"])


def safe_filename(filename: str) -> str:
    """Keeps letters, digits, dots, dashes and underscores, so the storage key is URL-safe."""
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "_", filename)[:100]
    return cleaned or "file"


def get_uploading_media(media_id: uuid.UUID, db: Session) -> Media:
    media = db.get(Media, media_id)
    if media == None:
        raise HTTPException(status_code=404, detail="Upload not found")
    if media.status != "uploading" or media.upload_id is None:
        raise HTTPException(status_code=409, detail="This upload is no longer in progress")
    return media


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


@router.post("/{media_id}/parts", response_model=PartUrlsOut)
def get_part_urls(
    media_id: uuid.UUID,
    request: PartUrlsRequest,
    db: Session = Depends(get_db),
    storage: Storage = Depends(get_storage),
):
    media = get_uploading_media(media_id, db)

    part_count = math.ceil(media.size_bytes / PART_SIZE)
    if any(number < 1 or number > part_count for number in request.part_numbers):
        raise HTTPException(
            status_code=422, detail=f"Part numbers must be between 1 and {part_count}"
        )

    return PartUrlsOut(
        parts=[
            PartUrl(
                part_number=number,
                url=storage.presign_upload_part(media.storage_key, media.upload_id, number),
            )
            for number in request.part_numbers
        ]
    )


@router.post("/{media_id}/complete", response_model=MediaOut)
def complete_upload(
    media_id: uuid.UUID,
    body: UploadComplete,
    db: Session = Depends(get_db),
    storage: Storage = Depends(get_storage),
):
    media = get_uploading_media(media_id, db)

    part_count = math.ceil(media.size_bytes / PART_SIZE)
    numbers = sorted(part.part_number for part in body.parts)
    if numbers != list(range(1, part_count + 1)):
        raise HTTPException(
            status_code=422, detail=f"Expected parts 1 to {part_count}, each exactly once"
        )

    try:
        storage.complete_multipart_upload(
            media.storage_key,
            media.upload_id,
            [CompletedPart(part_number=p.part_number, etag=p.etag) for p in body.parts],
        )
    except ClientError as exc:
        raise HTTPException(
            status_code=400, detail="Storage rejected the upload; some parts may be missing"
        ) from exc
    except BotoCoreError as exc:
        raise HTTPException(status_code=502, detail="Storage is unavailable, try again") from exc

    media.status = "ready"
    media.upload_id = None
    db.commit()
    db.refresh(media)
    return to_media_out(media, storage)


@router.delete("/{media_id}", status_code=204)
def abort_upload(
    media_id: uuid.UUID,
    db: Session = Depends(get_db),
    storage: Storage = Depends(get_storage),
):
    media = get_uploading_media(media_id, db)

    try:
        storage.abort_multipart_upload(media.storage_key, media.upload_id)
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(
            status_code=502, detail="Couldn't cancel the upload, try again"
        ) from exc

    db.delete(media)
    db.commit()
    return Response(status_code=204)
