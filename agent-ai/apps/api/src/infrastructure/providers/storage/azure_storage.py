from __future__ import annotations

from pathlib import Path
from typing import Optional


class AzureBlobStorage:
    """Azure Blob Storage backend. Requires the ``azure-storage-blob`` package."""

    def __init__(self, connection_string: str, container: str) -> None:
        try:
            from azure.storage.blob import BlobServiceClient  # type: ignore
        except ImportError as exc:
            raise RuntimeError("azure-storage-blob not installed (install [azure] extra)") from exc
        self._container = container
        self._client = BlobServiceClient.from_connection_string(connection_string)
        self._container_client = self._client.get_container_client(container)
        self._container_client.create_container()  # no-op if it exists

    async def put(self, key: str, data: bytes, *, content_type: str | None = None) -> str:
        blob = self._container_client.get_blob_client(key)
        blob.upload_blob(data, overwrite=True, content_settings=None, content_type=content_type)
        return key

    async def get(self, key: str) -> bytes:
        blob = self._container_client.get_blob_client(key)
        stream = blob.download_blob()
        return stream.readall()

    async def exists(self, key: str) -> bool:
        blob = self._container_client.get_blob_client(key)
        return blob.exists()

    async def delete(self, key: str) -> None:
        blob = self._container_client.get_blob_client(key)
        blob.delete_blob()
