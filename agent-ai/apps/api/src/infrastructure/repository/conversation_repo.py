from __future__ import annotations

import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from domain.models import Conversation, Message

from .base import BaseRepository


class ConversationRepository(BaseRepository[Conversation]):
    model = Conversation

    async def list_for_user(
        self, tenant_id: uuid.UUID, user_id: uuid.UUID, *, limit: int = 50, offset: int = 0
    ) -> tuple[list[Conversation], int]:
        count_stmt = (
            select(func.count())
            .select_from(Conversation)
            .where(Conversation.tenant_id == tenant_id, Conversation.user_id == user_id)
        )
        total = (await self.session.execute(count_stmt)).scalar_one()
        stmt = (
            select(Conversation)
            .where(Conversation.tenant_id == tenant_id, Conversation.user_id == user_id)
            .order_by(Conversation.pinned.desc(), Conversation.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        rows = list((await self.session.execute(stmt)).scalars().all())
        return rows, total


class MessageRepository(BaseRepository[Message]):
    model = Message

    async def list_for_session(self, session_id: uuid.UUID, limit: int = 200) -> list[Message]:
        stmt = (
            select(Message)
            .where(Message.session_id == session_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        return list((await self.session.execute(stmt)).scalars().all())

    async def count_for_tenant(self, tenant_id: uuid.UUID) -> int:
        stmt = select(func.count()).select_from(Message).where(Message.tenant_id == tenant_id)
        return (await self.session.execute(stmt)).scalar_one()

    async def mark_tokens(self, message_id: uuid.UUID, tokens_in: int, tokens_out: int) -> None:
        await self.session.execute(
            update(Message)
            .where(Message.id == message_id)
            .values(tokens_in=tokens_in, tokens_out=tokens_out)
        )
