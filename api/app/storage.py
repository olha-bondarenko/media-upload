from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import boto3
from botocore.config import Config

from app.config import get_settings

URL_EXPIRY_SECONDS = 3600


@dataclass
class CompletedPart:
    part_number: int
    etag: str


class Storage:
    """Wraps the S3 API (Cloudflare R2), so the rest of the app never uses boto3 directly."""

    def __init__(self, client: Any, bucket: str) -> None:
        self._client = client
        self._bucket = bucket

    def create_multipart_upload(self, key: str, content_type: str) -> str:
        """Opens a multipart upload in R2 and returns its upload id."""
        response = self._client.create_multipart_upload(
            Bucket=self._bucket, Key=key, ContentType=content_type
        )
        return response["UploadId"]

    def presign_upload_part(self, key: str, upload_id: str, part_number: int) -> str:
        """Returns a short-lived URL the browser can PUT one chunk to."""
        return self._client.generate_presigned_url(
            "upload_part",
            Params={
                "Bucket": self._bucket,
                "Key": key,
                "UploadId": upload_id,
                "PartNumber": part_number,
            },
            ExpiresIn=URL_EXPIRY_SECONDS,
        )

    def complete_multipart_upload(
        self, key: str, upload_id: str, parts: list[CompletedPart]
    ) -> None:
        """Tells R2 to assemble the uploaded parts into the final file."""
        ordered_parts = sorted(parts, key=lambda part: part.part_number)
        self._client.complete_multipart_upload(
            Bucket=self._bucket,
            Key=key,
            UploadId=upload_id,
            MultipartUpload={
                "Parts": [
                    {"PartNumber": part.part_number, "ETag": part.etag} for part in ordered_parts
                ]
            },
        )

    def abort_multipart_upload(self, key: str, upload_id: str) -> None:
        """Discards an unfinished upload and the parts already sent."""
        self._client.abort_multipart_upload(Bucket=self._bucket, Key=key, UploadId=upload_id)

    def presign_download(self, key: str) -> str:
        """Returns a short-lived download URL, for example for the video player."""
        return self._client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self._bucket, "Key": key},
            ExpiresIn=URL_EXPIRY_SECONDS,
        )

    def delete_object(self, key: str) -> None:
        """Deletes a stored file. Succeeds even if the file is already gone."""
        self._client.delete_object(Bucket=self._bucket, Key=key)


@lru_cache
def get_storage() -> Storage:
    settings = get_settings()
    if not (
        settings.s3_endpoint_url
        and settings.s3_bucket
        and settings.s3_access_key_id
        and settings.s3_secret_access_key
    ):
        raise RuntimeError("Storage is not configured: set the S3_* variables in api/.env")

    client = boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
        config=Config(
            signature_version="s3v4",
            request_checksum_calculation="when_required",
            response_checksum_validation="when_required",
        ),
    )
    return Storage(client, settings.s3_bucket)
