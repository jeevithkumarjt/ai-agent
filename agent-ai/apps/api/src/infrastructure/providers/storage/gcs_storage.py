from __future__ import annotations


class GCSStorage:
    """Google Cloud Storage backend. Requires the ``google-cloud-storage`` package."""

    def __init__(self, bucket: str, credentials_path: str | None = None) -> None:
        try:
            from google.cloud import storage  # type: ignore
        except ImportError as exc:
            raise RuntimeError("google-cloud-storage not installed (install [gcs] extra)") from exc
        self._bucket_name = bucket
        if credentials_path:
            self._client = storage.Client.from_service_account_json(credentials_path)
        else:
            self._client = storage.Client()
        self._bucket = self._client.bucket(bucket)

    async def put(self, key: str, data: bytes, *, content_type: str | None = None) -> str:
        blob = self._bucket.blob(key)
        blob.upload_from_string(data, content_type=content_type or "application/octet-stream")
        return key

    async def get(self, key: str) -> bytes:
        blob = self._bucket.blob(key)
        return blob.download_as_bytes()

    async def exists(self, key: str) -> bool:
        return self._bucket.blob(key).exists()

    async def delete(self, key: str) -> None:
        self._bucket.blob(key).delete()
