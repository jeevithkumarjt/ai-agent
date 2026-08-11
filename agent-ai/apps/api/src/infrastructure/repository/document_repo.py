from __future__ import annotations

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.models import Chunk, Document

from .base import BaseRepository


class DocumentRepository(BaseRepository[Document]):
    model = Document

    async def get_by_url(self, tenant_id: uuid.UUID, source_id: uuid.UUID, url: str) -> Document | None:
        stmt = select(Document).where(
            Document.tenant_id == tenant_id,
            Document.source_id == source_id,
            Document.canonical_url == url,
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_for_source(
        self, tenant_id: uuid.UUID, source_id: uuid.UUID, *, status: str | None = None, limit: int = 500, offset: int = 0
    ) -> tuple[list[Document], int]:
        conditions = [Document.tenant_id == tenant_id, Document.source_id == source_id]
        if status:
            conditions.append(Document.status == status)
        count_stmt = select(func.count()).select_from(Document).where(*conditions)
        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = (
            select(Document)
            .where(*conditions)
            .order_by(Document.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        rows = list((await self.session.execute(stmt)).scalars().all())
        return rows, total

    async def count(self, tenant_id: uuid.UUID, source_id: uuid.UUID | None = None) -> int:
        conditions = [Document.tenant_id == tenant_id]
        if source_id:
            conditions.append(Document.source_id == source_id)
        stmt = select(func.count()).select_from(Document).where(*conditions)
        return (await self.session.execute(stmt)).scalar_one()


class ChunkRepository(BaseRepository[Chunk]):
    model = Chunk

    async def list_for_document(self, document_id: uuid.UUID) -> list[Chunk]:
        stmt = (
            select(Chunk)
            .where(Chunk.document_id == document_id)
            .order_by(Chunk.char_offset.asc())
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def delete_for_document(self, document_id: uuid.UUID, *, except_ids: list[uuid.UUID] | None = None) -> None:
        stmt = delete(Chunk).where(Chunk.document_id == document_id)
        if except_ids:
            stmt = stmt.where(Chunk.id.not_in(except_ids))
        await self.session.execute(stmt)

    async def count_embedded(self, tenant_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Chunk)
            .where(Chunk.tenant_id == tenant_id, Chunk.embedded.is_(True))
        )
        return (await self.session.execute(stmt)).scalar_one()

    async def unembedded_ids(self, tenant_id: uuid.UUID, limit: int = 500) -> list[uuid.UUID]:
        stmt = (
            select(Chunk.id)
            .where(Chunk.tenant_id == tenant_id, Chunk.embedded.is_(False))
            .limit(limit)
        )
        return list((await self.session.execute(stmt)).scalars().all())
