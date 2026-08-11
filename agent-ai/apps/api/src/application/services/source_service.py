from __future__ import annotations

import uuid

from domain.errors import NotFoundError, ValidationError
from domain.models import CrawlJob, KnowledgeSource
from domain.schemas.source import SourceCreate, SourceOut, SourcePatch, SourceStats
from infrastructure.repository.document_repo import ChunkRepository, DocumentRepository
from infrastructure.repository.source_repo import SourceRepository
from logging import get_logger

logger = get_logger("service.source")

_WEBSITE_CONFIG_KEYS = {"url", "sitemap_url", "allowed_paths", "excluded_paths", "user_agent", "respect_robots", "strip_query"}


class SourceService:
    def __init__(
        self,
        sources: SourceRepository,
        documents: DocumentRepository,
        chunks: ChunkRepository,
    ) -> None:
        self.sources = sources
        self.documents = documents
        self.chunks = chunks

    async def create(self, tenant_id: uuid.UUID, data: SourceCreate) -> KnowledgeSource:
        self._validate_config(data.type, data.config)
        display_name = data.display_name or self._default_name(data.type, data.config)
        source = KnowledgeSource(
            tenant_id=tenant_id,
            type=data.type,
            display_name=display_name,
            config=data.config,
            schedule=data.schedule.model_dump(),
        )
        await self.sources.add(source)
        return source

    async def update(self, tenant_id: uuid.UUID, source_id: uuid.UUID, patch: SourcePatch) -> KnowledgeSource:
        source = await self.sources.get_for_workspace(source_id, tenant_id)
        if patch.display_name is not None:
            source.display_name = patch.display_name
        if patch.config is not None:
            self._validate_config(source.type, patch.config)
            source.config = patch.config
            source.version += 1
        if patch.state is not None:
            source.state = patch.state
        if patch.schedule is not None:
            source.schedule = patch.schedule.model_dump()
        return source

    async def get(self, tenant_id: uuid.UUID, source_id: uuid.UUID) -> KnowledgeSource:
        return await self.sources.get_for_workspace(source_id, tenant_id)

    async def list(self, tenant_id: uuid.UUID, *, limit: int = 50, offset: int = 0) -> tuple[list[KnowledgeSource], int]:
        return await self.sources.list_all(tenant_id=tenant_id, limit=limit, offset=offset)

    async def stats(self, tenant_id: uuid.UUID, source: KnowledgeSource) -> SourceStats:
        doc_count = await self.documents.count(tenant_id, source.id)
        chunks, _ = await self.chunks.list_all(tenant_id=tenant_id, limit=1)
        return SourceStats(
            **SourceOut.model_validate(source).model_dump(),
            document_count=doc_count,
            chunk_count=0,
            last_job_status=None,
        )

    async def delete(self, tenant_id: uuid.UUID, source_id: uuid.UUID) -> None:
        source = await self.sources.get_for_workspace(source_id, tenant_id)
        await self.sources.delete(source)

    def _validate_config(self, source_type: str, config: dict) -> None:
        if source_type == "website":
            if "url" not in config and "sitemap_url" not in config:
                raise ValidationError("website source requires config.url or config.sitemap_url")
            unknown = set(config.keys()) - _WEBSITE_CONFIG_KEYS
            if unknown:
                raise ValidationError(f"unknown website config keys: {sorted(unknown)}")
        elif source_type == "sitemap":
            if "sitemap_url" not in config:
                raise ValidationError("sitemap source requires config.sitemap_url")

    @staticmethod
    def _default_name(source_type: str, config: dict) -> str:
        url = config.get("url") or config.get("sitemap_url") or ""
        return f"{source_type}: {url}" if url else source_type
