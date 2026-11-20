"""Local disk-backed storage provider for development and testing."""

import os
import shutil
from pathlib import Path
from typing import BinaryIO

from app.core.config import settings
from app.integrations.storage.base import StorageProvider


class LocalStorageProvider(StorageProvider):
    def __init__(self, base_directory: str = settings.LOCAL_STORAGE_DIR):
        self.base_dir = Path(base_directory)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def upload_file(
        self,
        file_obj: BinaryIO,
        destination_path: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        target_path = self.base_dir / destination_path
        target_path.parent.mkdir(parents=True, exist_ok=True)
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file_obj, buffer)
        return str(target_path)

    def get_file_url(self, file_path: str, expires_in_seconds: int = 3600) -> str:
        return f"/uploads/{file_path}"

    def delete_file(self, file_path: str) -> bool:
        target_path = self.base_dir / file_path
        if target_path.exists():
            os.remove(target_path)
            return True
        return False
