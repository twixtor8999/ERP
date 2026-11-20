"""Abstract storage service contract for document and asset uploads."""
from abc import ABC, abstractmethod
from typing import BinaryIO


class StorageProvider(ABC):
    """Abstract storage interface ensuring cloud portability (S3, MinIO, GCS, Local)."""

    @abstractmethod
    def upload_file(
        self,
        file_obj: BinaryIO,
        destination_path: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        """Upload a file stream and return its URI / storage path."""
        pass

    @abstractmethod
    def get_file_url(self, file_path: str, expires_in_seconds: int = 3600) -> str:
        """Generate a secure pre-signed download URL or public access link."""
        pass

    @abstractmethod
    def delete_file(self, file_path: str) -> bool:
        """Delete an object from storage."""
        pass
