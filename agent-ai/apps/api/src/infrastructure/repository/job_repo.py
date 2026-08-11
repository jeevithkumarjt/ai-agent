from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from domain.models import CrawlJob, EvalRun, Feedback, GoldenQuestion

from .base import BaseRepository


class CrawlJobRepository(BaseRepository[CrawlJob]):
    model = CrawlJob


class FeedbackRepository(BaseRepository[Feedback]):
    model = Feedback

    async def get_for_message(self, message_id: uuid.UUID) -> Feedback | None:
        stmt = select(Feedback).where(Feedback.message_id == message_id)
        return (await self.session.execute(stmt)).scalar_one_or_none()


class GoldenQuestionRepository(BaseRepository[GoldenQuestion]):
    model = GoldenQuestion

    async def list_active(self, tenant_id: uuid.UUID) -> list[GoldenQuestion]:
        stmt = select(GoldenQuestion).where(
            GoldenQuestion.tenant_id == tenant_id, GoldenQuestion.active.is_(True)
        )
        return list((await self.session.execute(stmt)).scalars().all())


class EvalRunRepository(BaseRepository[EvalRun]):
    model = EvalRun

    async def latest(self, tenant_id: uuid.UUID) -> EvalRun | None:
        stmt = (
            select(EvalRun)
            .where(EvalRun.tenant_id == tenant_id)
            .order_by(EvalRun.created_at.desc())
            .limit(1)
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def count_by_status(self, tenant_id: uuid.UUID) -> int:
        stmt = select(func.count()).select_from(EvalRun).where(EvalRun.tenant_id == tenant_id)
        return (await self.session.execute(stmt)).scalar_one()
