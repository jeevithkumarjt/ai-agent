from __future__ import annotations

import uuid

from fastapi import APIRouter, Query

from container import Container
from domain.schemas.admin import (
    AdminOverview,
    ApiKeyCreate,
    ApiKeyOut,
    AuditLogOut,
    DocumentAdminOut,
    DocumentStatusPatch,
    EvalRunOut,
    GoldenQuestionCreate,
    GoldenQuestionOut,
    ModelConfigCreate,
    ModelConfigOut,
    PromptCreate,
    PromptOut,
    UserAdminOut,
    UserRolePatch,
)
from domain.schemas.common import Paginated
from infrastructure.repository.job_repo import EvalRunRepository, GoldenQuestionRepository
from interfaces.api.deps import AdminDep, ContainerDep, SessionDep, UserDep
from infrastructure.security.passwords import generate_api_key, hash_api_key

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview", response_model=AdminOverview)
async def overview(session: SessionDep, container: ContainerDep, user: AdminDep) -> AdminOverview:
    from sqlalchemy import and_, func, select

    from domain.models import Chunk, Conversation, Document, EvalRun, KnowledgeSource

    async def count(model, column=None) -> int:
        stmt = select(func.count()).select_from(model)
        if column is not None:
            stmt = select(func.count()).select_from(model).where(column)
        return (await session.execute(stmt)).scalar_one()

    last_eval = (
        await session.execute(select(EvalRun).order_by(EvalRun.created_at.desc()).limit(1))
    ).scalar_one_or_none()
    return AdminOverview(
        sources=await count(KnowledgeSource),
        documents=await count(Document, Document.tenant_id == user.tenant_id),
        chunks=await count(Chunk, Chunk.tenant_id == user.tenant_id),
        embedded_chunks=await count(Chunk, and_(Chunk.tenant_id == user.tenant_id, Chunk.embedded.is_(True))),
        conversations=await count(Conversation, Conversation.tenant_id == user.tenant_id),
        queue_depth={},
        dlq_depth=0,
        last_eval=dict(EvalRunOut.model_validate(last_eval)) if last_eval else None,
    )


@router.get("/documents", response_model=Paginated)
async def documents(
    session: SessionDep,
    user: AdminDep,
    status: str | None = Query(default=None),
    limit: int = 50,
    offset: int = 0,
) -> Paginated:
    from sqlalchemy import func, select

    from domain.models import Document

    conditions = [Document.tenant_id == user.tenant_id]
    if status:
        conditions.append(Document.status == status)
    total = (
        await session.execute(select(func.count()).select_from(Document).where(*conditions))
    ).scalar_one()
    rows = list(
        (
            await session.execute(
                select(Document).where(*conditions).order_by(Document.updated_at.desc()).limit(limit).offset(offset)
            )
        ).scalars().all()
    )
    return Paginated(items=[DocumentAdminOut.model_validate(r).model_dump() for r in rows], total=total, limit=limit, offset=offset)


@router.patch("/documents/{document_id}/status")
async def set_document_status(
    document_id: uuid.UUID, data: DocumentStatusPatch, session: SessionDep, user: AdminDep
) -> dict:
    from domain.models import Document
    from sqlalchemy import select

    doc = (
        await session.execute(select(Document).where(Document.id == document_id, Document.tenant_id == user.tenant_id))
    ).scalar_one_or_none()
    if doc is None:
        from domain.errors import NotFoundError

        raise NotFoundError("document not found")
    doc.status = data.status
    doc.error = data.error
    return {"updated": True}


@router.get("/prompts", response_model=list[PromptOut])
async def list_prompts(session: SessionDep, user: AdminDep) -> list[PromptOut]:
    from sqlalchemy import select

    from domain.models import Prompt

    rows = list(
        (
            await session.execute(
                select(Prompt).where(Prompt.tenant_id == user.tenant_id, Prompt.active.is_(True)).order_by(Prompt.key)
            )
        ).scalars().all()
    )
    return [PromptOut.model_validate(r) for r in rows]


@router.post("/prompts", response_model=PromptOut)
async def create_prompt(data: PromptCreate, session: SessionDep, user: AdminDep) -> PromptOut:
    from infrastructure.repository.event_repo import PromptRepository

    repo = PromptRepository(session)
    prompt = await repo.create_version(user.tenant_id, data.name, data.key, data.template, data.config, user.id)
    await session.flush()
    return PromptOut.model_validate(prompt)


@router.post("/prompts/{key}/rollback", response_model=PromptOut)
async def rollback_prompt(key: str, version: int, session: SessionDep, user: AdminDep) -> PromptOut:
    from infrastructure.repository.event_repo import PromptRepository

    repo = PromptRepository(session)
    prompt = await repo.rollback(user.tenant_id, key, version)
    return PromptOut.model_validate(prompt)


@router.get("/models", response_model=list[ModelConfigOut])
async def list_models(session: SessionDep, user: AdminDep) -> list[ModelConfigOut]:
    from sqlalchemy import select

    from domain.models import ModelConfig

    rows = list(
        (
            await session.execute(select(ModelConfig).where(ModelConfig.tenant_id == user.tenant_id).order_by(ModelConfig.role))
        ).scalars().all()
    )
    return [ModelConfigOut.model_validate(r) for r in rows]


@router.post("/models", response_model=ModelConfigOut)
async def create_model(data: ModelConfigCreate, session: SessionDep, user: AdminDep) -> ModelConfigOut:
    from domain.models import ModelConfig

    row = ModelConfig(tenant_id=user.tenant_id, **data.model_dump())
    session.add(row)
    await session.flush()
    return ModelConfigOut.model_validate(row)


@router.get("/api-keys", response_model=list[ApiKeyOut])
async def list_api_keys(session: SessionDep, user: AdminDep) -> list[ApiKeyOut]:
    from sqlalchemy import select

    from domain.models import ApiKey

    rows = list(
        (await session.execute(select(ApiKey).where(ApiKey.tenant_id == user.tenant_id))).scalars().all()
    )
    return [ApiKeyOut(id=r.id, name=r.name, scopes=r.scopes, expires_at=r.expires_at, created_at=r.created_at) for r in rows]


@router.post("/api-keys", response_model=ApiKeyOut)
async def create_api_key(data: ApiKeyCreate, session: SessionDep, user: AdminDep) -> ApiKeyOut:
    from domain.models import ApiKey

    plaintext = generate_api_key()
    row = ApiKey(
        tenant_id=user.tenant_id,
        user_id=user.id,
        name=data.name,
        key_hash=hash_api_key(plaintext),
        scopes=data.scopes,
        expires_at=data.expires_at,
    )
    session.add(row)
    await session.flush()
    out = ApiKeyOut(
        id=row.id, name=row.name, scopes=row.scopes, expires_at=row.expires_at, created_at=row.created_at, plaintext=plaintext
    )
    return out


@router.get("/users", response_model=list[UserAdminOut])
async def list_users(session: SessionDep, user: AdminDep) -> list[UserAdminOut]:
    from sqlalchemy import select

    from domain.models import User

    rows = list(
        (await session.execute(select(User).where(User.tenant_id == user.tenant_id))).scalars().all()
    )
    return [UserAdminOut.model_validate(r) for r in rows]


@router.patch("/users/{user_id}", response_model=UserAdminOut)
async def patch_user(
    user_id: uuid.UUID, data: UserRolePatch, session: SessionDep, user: AdminDep
) -> UserAdminOut:
    from domain.models import User
    from sqlalchemy import select

    row = (
        await session.execute(select(User).where(User.id == user_id, User.tenant_id == user.tenant_id))
    ).scalar_one_or_none()
    if row is None:
        from domain.errors import NotFoundError

        raise NotFoundError("user not found")
    row.role = data.role
    if data.status:
        row.status = data.status
    return UserAdminOut.model_validate(row)


@router.get("/audit-logs", response_model=Paginated)
async def audit_logs(
    session: SessionDep, user: AdminDep, limit: int = 50, offset: int = 0
) -> Paginated:
    from sqlalchemy import func, select

    from domain.models import AuditLog

    total = (
        await session.execute(
            select(func.count()).select_from(AuditLog).where(AuditLog.tenant_id == user.tenant_id)
        )
    ).scalar_one()
    rows = list(
        (
            await session.execute(
                select(AuditLog)
                .where(AuditLog.tenant_id == user.tenant_id)
                .order_by(AuditLog.created_at.desc())
                .limit(limit)
                .offset(offset)
            )
        ).scalars().all()
    )
    return Paginated(items=[AuditLogOut.model_validate(r).model_dump() for r in rows], total=total, limit=limit, offset=offset)


@router.get("/golden-questions", response_model=list[GoldenQuestionOut])
async def list_golden(session: SessionDep, user: AdminDep) -> list[GoldenQuestionOut]:
    repo = GoldenQuestionRepository(session)
    rows = await repo.list_active(user.tenant_id)
    return [GoldenQuestionOut.model_validate(r) for r in rows]


@router.post("/golden-questions", response_model=GoldenQuestionOut)
async def create_golden(data: GoldenQuestionCreate, session: SessionDep, user: AdminDep) -> GoldenQuestionOut:
    from domain.models import GoldenQuestion

    row = GoldenQuestion(tenant_id=user.tenant_id, **data.model_dump())
    session.add(row)
    await session.flush()
    return GoldenQuestionOut.model_validate(row)


@router.get("/eval/runs", response_model=list[EvalRunOut])
async def eval_runs(session: SessionDep, user: AdminDep) -> list[EvalRunOut]:
    repo = EvalRunRepository(session)
    rows, _ = await repo.list_all(tenant_id=user.tenant_id, limit=50, offset=0)
    return [EvalRunOut.model_validate(r) for r in rows]


@router.post("/eval/run", response_model=EvalRunOut)
async def trigger_eval(session: SessionDep, user: AdminDep) -> EvalRunOut:
    from workers.celery_app import celery_app

    task = celery_app.send_task(
        "workers.tasks_eval.run_eval", args=[str(user.tenant_id), "manual"], queue="eval"
    )
    return EvalRunOut(id=task.id, trigger="manual", status="queued", score_overall=None, score_grounded=None, score_citation=None, score_freshness=None, passed=None, details={}, created_at=__import__("datetime").datetime.now(__import__("datetime").timezone.utc))
