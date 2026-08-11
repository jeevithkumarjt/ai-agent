from __future__ import annotations

import os
import shutil
from pathlib import Path
from typing import Protocol

from config import settings
from logging import get_logger

logger = get_logger("storage")


class StorageBackend(Protocol):
    async def put(self, key: str, data: bytes, *, content_type: str | None = None) -> str: ...
    async def get(self, key: str) -> bytes: ...
    async def exists(self, key: str) -> bool: ...
    async def delete(self, key: str) -> None: ...


class LocalStorage:
    def __init__(self, base_dir: str | None = None) -> None:
        self._base = Path(base_dir or settings.storage_local_dir)
        self._base.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        safe = Path(key)
        resolved = (self._base / safe).resolve()
        if not str(resolved).startswith(str(self._base.resolve())):
            raise ValueError("storage path traversal blocked")
        return resolved

    async def put(self, key: str, data: bytes, *, content_type: str | None = None) -> str:
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        await _threaded_write(path, data)
        return key

    async def get(self, key: str) -> bytes:
        return await _threaded_read(self._path(key))

    async def exists(self, key: str) -> bool:
        return self._path(key).exists()

    async def delete(self, key: str) -> None:
        path = self._path(key)
        if path.exists():
            await _threaded_delete(path)


async def _threaded_write(path: Path, data: bytes) -> None:
    def _write() -> None:
        path.write_bytes(data)

    import asyncio

    await asyncio.to_thread(_write)


async def _threaded_read(path: Path) -> bytes:
    def _read() -> bytes:
        with path.open("rb") as f:
            return f.read()

    import asyncio

    return await asyncio.to_thread(_read)


async def _threaded_delete(path: Path) -> None:
    def _delete() -> None:
        if path.is_dir():
            shutil.rmtree(path)
        else:
            path.unlink(missing_ok=True)

    import asyncio

    await asyncio.to_thread(_delete)


class S3Storage:
    def __init__(self, *, bucket: str, endpoint: str | None = None, region: str | None = None, access_key: str | None = None, secret_key: str | None = None):
        try:
            import boto3
            from botocore.config import Config
        except ImportError as exc:
            raise RuntimeError("boto3 not installed (install [s3] extra)") from exc
        self._bucket = bucket
        self._client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            region_name=region or "us-east-1",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(retries={"max_attempts": 4, "mode": "standard"}),
        )

    async def put(self, key: str, data: bytes, *, content_type: str | None = None) -> str:
        self._client.put_object(Bucket=self._bucket, Key=key, Body=data, ContentType=content_type or "application/octet-stream")
        return key

    async def get(self, key: str) -> bytes:
        resp = self._client.get_object(Bucket=self._bucket, Key=key)
        return resp["Body"].read()

    async def exists(self, key: str) -> bool:
        try:
            self._client.head_object(Bucket=self._bucket, Key=key)
            return True
        except Exception:
            return False

    async def delete(self, key: str) -> None:
        self._client.delete_object(Bucket=self._bucket, Key=key)


def make_storage() -> StorageBackend:
    if settings.storage_backend == "s3":
        if not (settings.s3_bucket and settings.s3_access_key):
            raise ValueError("s3 storage requires S3_BUCKET and S3_ACCESS_KEY")
        return S3Storage(
            bucket=settings.s3_bucket,
            endpoint=settings.s3_endpoint_url,
            region=settings.s3_region,
            access_key=settings.s3_access_key,
            secret_key=settings.s3_secret_key,
        )
    if settings.storage_backend == "azure":
        from .azure_storage import AzureBlobStorage

        if not (settings.azure_connection_string and settings.azure_container):
            raise ValueError("azure storage requires connection string + container")
        return AzureBlobStorage(settings.azure_connection_string, settings.azure_container)
    if settings.storage_backend == "gcs":
        from .gcs_storage import GCSStorage

        if not settings.gcs_bucket:
            raise ValueError("gcs storage requires GCS_BUCKET")
        return GCSStorage(settings.gcs_bucket, credentials_path=settings.gcs_credentials_path)
    return LocalStorage()


default_storage = make_storage
