from __future__ import annotations

import uuid

from fastapi import APIRouter, Request

from config import settings
from container import Container
from domain.schemas.common import Paginated
from domain.schemas.source import CrawlTrigger, JobOut, SourceCreate, SourceOut, SourcePatch, SourceStats
from infrastructure.security.rate_limit import check_rate_limit, rate_key
from interfaces.api.deps import ContainerDep, EditorDep, SessionDep, UserDep

router = APIRouter(prefix="/sources", tags=["sources"])


@router.post("", response_model=SourceOut)
async def create_source(
    data: SourceCreate, session: SessionDep, container: ContainerDep, user: EditorDep
) -> SourceOut:
    service = container.make_sources(session)
    source = await service.create(user.tenant_id, data)
    await session.flush()

    # dispatch full ingestion asynchronously
    from workers.celery_app import celery_app

    celery_app.send_task(
        "workers.tasks_ingest.discover_and_enqueue",
        args=[str(source.id), str(user.tenant_id)],
    )
    return SourceOut.model_validate(source)


@router.get("", response_model=Paginated)
async def list_sources(
    session: SessionDep, container: ContainerDep, user: UserDep, limit: int = 50, offset: int = 0
) -> Paginated:
    service = container.make_sources(session)
    rows, total = await service.list(user.tenant_id, limit=min(limit, 200), offset=offset)
    return Paginated(items=[SourceOut.model_validate(r).model_dump() for r in rows], total=total, limit=limit, offset=offset)


@router.get("/{source_id}", response_model=SourceStats)
async def get_source(source_id: uuid.UUID, session: SessionDep, container: ContainerDep, user: UserDep) -> SourceStats:
    service = container.make_sources(session)
    source = await service.get(user.tenant_id, source_id)
    return await service.stats(user.tenant_id, source)


@router.patch("/{source_id}", response_model=SourceOut)
async def update_source(
    source_id: uuid.UUID, data: SourcePatch, session: SessionDep, container: ContainerDep, user: EditorDep
) -> SourceOut:
    service = container.make_sources(session)
    source = await service.update(user.tenant_id, source_id, data)
    return SourceOut.model_validate(source)


@router.delete("/{source_id}")
async def delete_source(source_id: uuid.UUID, session: SessionDep, container: ContainerDep, user: EditorDep) -> dict:
    service = container.make_sources(session)
    await service.delete(user.tenant_id, source_id)
    return {"deleted": True}


@router.post("/{source_id}/crawl", response_model=JobOut)
async def trigger_crawl(
    source_id: uuid.UUID, data: CrawlTrigger, session: SessionDep, container: ContainerDep, user: EditorDep
) -> JobOut:
    from domain.models import CrawlJob

    service = container.make_sources(session)
    source = await service.get(user.tenant_id, source_id)

    job = CrawlJob(
        tenant_id=user.tenant_id,
        source_id=source_id,
        kind=data.kind,
        status="queued",
    )
    session.add(job)
    await session.flush()

    from workers.celery_app import celery_app

    if data.kind == "single" and data.url:
        celery_app.send_task(
            "workers.tasks_ingest.crawl_page",
            args=[data.url, str(source.id), str(user.tenant_id)],
            queue="crawl",
        )
    else:
        celery_app.send_task(
            "workers.tasks_ingest.discover_and_enqueue",
            args=[str(source.id), str(user.tenant_id)],
        )
    return JobOut.model_validate(job)
