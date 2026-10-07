import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class MediaStatus(StrEnum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class MediaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    description: str
    tags: list[str]
    filename: str
    content_type: str
    size_bytes: int
    status: MediaStatus
    duration_seconds: float | None
    playback_url: str | None
    created_at: datetime
    updated_at: datetime


class MediaList(BaseModel):
    items: list[MediaOut]
    total: int
    limit: int
    offset: int


class MediaUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    tags: list[str] | None = Field(default=None, max_length=10)
