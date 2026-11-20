"""S3 and S3-compatible (MinIO / Cloudflare R2 / AWS S3) storage provider."""

from typing import BinaryIO

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings
from app.core.logging import logger
from app.integrations.storage.base import StorageProvider


class S3StorageProvider(StorageProvider):
    def __init__(self) -> None:
        self.bucket = settings.S3_BUCKET_NAME
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            region_name=settings.S3_REGION_NAME,
        )

    def upload_file(
        self,
        file_obj: BinaryIO,
        destination_path: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        self.client.upload_fileobj(
            file_obj,
            self.bucket,
            destination_path,
            ExtraArgs={"ContentType": content_type},
        )
        return f"s3://{self.bucket}/{destination_path}"

    def get_file_url(self, file_path: str, expires_in_seconds: int = 3600) -> str:
        try:
            url: str = self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": file_path},
                ExpiresIn=expires_in_seconds,
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate S3 pre-signed URL: {e}")
            return ""

    def delete_file(self, file_path: str) -> bool:
        try:
            self.client.delete_object(Bucket=self.bucket, Key=file_path)
            return True
        except ClientError as e:
            logger.error(f"Failed to delete S3 object: {e}")
            return False
