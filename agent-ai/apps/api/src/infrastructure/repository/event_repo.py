from __future__ import annotations

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from domain.models import AuditLog, Event, Prompt

from .base import BaseRepository


class EventRepository(BaseRepository[Event]):
    model = Event

    async def record(self, tenant_id: uuid.UUID, type: str, payload: dict, actor: str | None = None) -> Event:
        event = Event(tenant_id=tenant_id, type=type, payload=payload, actor=actor)
        self.session.add(event)
        return event


class AuditRepository(BaseRepository[AuditLog]):
    model = AuditLog

    async def record(
        self,
        tenant_id: uuid.UUID,
        action: str,
        *,
        actor_id: uuid.UUID | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        meta: dict | None = None,
        ip: str | None = None,
    ) -> AuditLog:
        row = AuditLog(
            tenant_id=tenant_id,
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            meta=meta or {},
            ip=ip,
        )
        self.session.add(row)
        return row


class PromptRepository(BaseRepository[Prompt]):
    model = Prompt

    async def get_active(self, tenant_id: uuid.UUID, key: str) -> Prompt | None:
        stmt = select(Prompt).where(Prompt.tenant_id == tenant_id, Prompt.key == key, Prompt.active.is_(True))
        return (await self.session.execute(stmt)).scalars().first()

    async def create_version(self, tenant_id: uuid.UUID, name: str, key: str, template: str, config: dict, user_id: uuid.UUID | None) -> Prompt:
        current = await self.get_active(tenant_id, key)
        version = (current.version + 1) if current else 1
        if current:
            current.active = False
        prompt = Prompt(
            tenant_id=tenant_id,
            name=name,
            key=key,
            version=version,
            template=template,
            config=config,
            active=True,
            created_by=user_id,
        )
        self.session.add(prompt)
        return prompt

    async def rollback(self, tenant_id: uuid.UUID, key: str, version: int) -> Prompt:
        target = (
            await self.session.execute(
                select(Prompt).where(Prompt.tenant_id == tenant_id, Prompt.key == key, Prompt.version == version)
            )
        ).scalar_one_or_none()
        if target is None:
            raise ValueError(f"prompt version {version} not found for key {key}")
        await self.session.execute(update(Prompt).where(Prompt.tenant_id == tenant_id, Prompt.key == key).values(active=False))
        target.active = True
        return target
