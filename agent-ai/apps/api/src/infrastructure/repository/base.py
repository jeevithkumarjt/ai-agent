from __future__ import annotations

import uuid
from typing import Generic, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.errors import NotFoundError

T = TypeVar("T")


class BaseRepository(Generic[T]):
    model: type[T]

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get(self, id: uuid.UUID, *, tenant_id: uuid.UUID) -> T:
        stmt = select(self.model).where(self.model.id == id, self.model.tenant_id == tenant_id)
        row = (await self.session.execute(stmt)).scalar_one_or_none()
        if row is None:
            raise NotFoundError(f"{self.model.__name__} {id} not found")
        return row

    async def list_all(self, *, tenant_id: uuid.UUID, limit: int = 50, offset: int = 0) -> tuple[list[T], int]:
        count_stmt = select(func.count()).select_from(self.model).where(self.model.tenant_id == tenant_id)
        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = (
            select(self.model)
            .where(self.model.tenant_id == tenant_id)
            .order_by(self.model.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        rows = list((await self.session.execute(stmt)).scalars().all())
        return rows, total

    async def add(self, entity: T) -> T:
        self.session.add(entity)
        return entity

    async def delete(self, entity: T) -> None:
        await self.session.delete(entity)
