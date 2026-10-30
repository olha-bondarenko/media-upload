import uuid
from pathlib import PurePath

from pydantic import BaseModel, Field, field_validator

MAX_UPLOAD_BYTES = 200 * 1000 * 1000  # 200 MB for the demo
PART_SIZE = 10 * 1024 * 1024  # 10 MiB per chunk; R2 needs at least 5 MiB except for the last


class UploadStart(BaseModel):
    """Browser metadata to start an upload."""

    filename: str = Field(min_length=1, max_length=255)
    content_type: str = Field(max_length=100)
    size_bytes: int
    title: str | None = Field(default=None, max_length=200)
    duration_seconds: float | None = Field(default=None, ge=0, le=24 * 3600)

    @field_validator("content_type")
    @classmethod
    def must_be_video_or_audio(cls, value: str) -> str:
        if not value.startswith(("video/", "audio/")):
            raise ValueError("Only video and audio files can be uploaded")
        return value

    @field_validator("size_bytes")
    @classmethod
    def must_have_valid_size(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("The file is empty")
        if value > MAX_UPLOAD_BYTES:
            raise ValueError("Files can be at most 200 MB")
        return value

    def resolved_title(self) -> str:
        """The title to store: the one given, or the filename without its extension."""
        if self.title and self.title.strip():
            return self.title.strip()
        return PurePath(self.filename).stem or self.filename


class UploadStartOut(BaseModel):
    """What the API sends back so the browser knows how to split the file."""

    media_id: uuid.UUID
    part_size: int
    part_count: int


class PartUrlsRequest(BaseModel):
    """The part numbers the browser wants upload URLs for."""

    part_numbers: list[int] = Field(min_length=1, max_length=100)


class PartUrl(BaseModel):
    part_number: int
    url: str


class PartUrlsOut(BaseModel):
    parts: list[PartUrl]


class CompletedPartIn(BaseModel):
    part_number: int = Field(ge=1)
    etag: str = Field(min_length=1, max_length=200)


class UploadComplete(BaseModel):
    """The parts the browser uploaded, with the ETag R2 returned for each."""

    parts: list[CompletedPartIn] = Field(min_length=1)
