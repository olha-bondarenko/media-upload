import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.media import Media
from app.schemas.media import MediaList, MediaOut, MediaStatus, MediaUpdate

router = APIRouter(prefix="/media", tags=["media"])


def get_media_or_404(media_id: uuid.UUID, db: Session) -> Media:
    media = db.get(Media, media_id)
    if media is None:
        raise HTTPException(status_code=404, detail="Media not found")
    return media


@router.get("", response_model=MediaList)
def list_media(
    q: str | None = Query(default=None, max_length=100),
    status: MediaStatus | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    filters = []
    if q:
        filters.append(Media.title.ilike(f"%{q}%"))
    if status is not None:
        filters.append(Media.status == status.value)

    query = select(Media).where(*filters)
    rows = db.scalars(query.order_by(Media.created_at.desc()).limit(limit).offset(offset)).all()
    total = db.scalar(select(func.count()).select_from(Media).where(*filters))

    return MediaList(items=rows, total=total or 0, limit=limit, offset=offset)


@router.get("/{media_id}", response_model=MediaOut)
def get_media(media_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_media_or_404(media_id, db)


@router.patch("/{media_id}", response_model=MediaOut)
def update_media(
    media_id: uuid.UUID,
    changes: MediaUpdate,
    db: Session = Depends(get_db),
):
    media = get_media_or_404(media_id, db)

    for field, value in changes.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(media, field, value)

    db.commit()
    db.refresh(media)
    return media
