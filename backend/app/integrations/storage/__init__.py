"""Storage factory resolving provider based on application configuration."""

from app.core.config import settings
from app.integrations.storage.base import StorageProvider
from app.integrations.storage.local import LocalStorageProvider
from app.integrations.storage.s3 import S3StorageProvider


def get_storage_provider() -> StorageProvider:
    if settings.STORAGE_BACKEND == "s3":
        return S3StorageProvider()
    return LocalStorageProvider()
