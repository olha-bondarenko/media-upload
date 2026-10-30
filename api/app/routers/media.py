import uuid

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import require_admin, require_editor
from app.db import get_db
from app.models.media import Media
from app.schemas.media import MediaList, MediaOut, MediaStatus, MediaUpdate
from app.storage import Storage, get_storage

router = APIRouter(prefix="/media", tags=["media"])


def get_media_or_404(media_id: uuid.UUID, db: Session) -> Media:
    media = db.get(Media, media_id)
    if media is None:
        raise HTTPException(status_code=404, detail="Media not found")
    return media


def to_media_out(media: Media, storage: Storage) -> MediaOut:
    """Builds the API response, signing a playback URL for files stored in R2."""
    out = MediaOut.model_validate(media)
    if media.storage_key and media.status == "ready":
        out.playback_url = storage.presign_download(media.storage_key)
    return out


@router.get("", response_model=MediaList)
def list_media(
    q: str | None = Query(default=None, max_length=100),
    status: MediaStatus | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    storage: Storage = Depends(get_storage),
):
    filters = []
    if q:
        filters.append(Media.title.ilike(f"%{q}%"))
    if status is not None:
        filters.append(Media.status == status.value)

    query = select(Media).where(*filters)
    rows = db.scalars(query.order_by(Media.created_at.desc()).limit(limit).offset(offset)).all()
    total = db.scalar(select(func.count()).select_from(Media).where(*filters))

    return MediaList(
        items=[to_media_out(row, storage) for row in rows],
        total=total or 0,
        limit=limit,
        offset=offset,
    )


@router.get("/{media_id}", response_model=MediaOut)
def get_media(
    media_id: uuid.UUID,
    db: Session = Depends(get_db),
    storage: Storage = Depends(get_storage),
):
    return to_media_out(get_media_or_404(media_id, db), storage)


@router.patch("/{media_id}", response_model=MediaOut, dependencies=[Depends(require_editor)])
def update_media(
    media_id: uuid.UUID,
    changes: MediaUpdate,
    db: Session = Depends(get_db),
    storage: Storage = Depends(get_storage),
):
    media = get_media_or_404(media_id, db)

    for field, value in changes.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(media, field, value)

    db.commit()
    db.refresh(media)
    return to_media_out(media, storage)


@router.delete("/{media_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_media(
    media_id: uuid.UUID,
    db: Session = Depends(get_db),
    storage: Storage = Depends(get_storage),
) -> Response:
    media = get_media_or_404(media_id, db)

    if media.status == "uploading":
        raise HTTPException(
            status_code=409, detail="This file is still uploading; cancel the upload instead"
        )

    if media.storage_key:
        try:
            storage.delete_object(media.storage_key)
        except (BotoCoreError, ClientError) as exc:
            raise HTTPException(
                status_code=502, detail="Couldn't delete the file from storage, try again"
            ) from exc

    db.delete(media)
    db.commit()
    return Response(status_code=204)
