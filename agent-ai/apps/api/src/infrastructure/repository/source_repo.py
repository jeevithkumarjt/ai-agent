from __future__ import annotations

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from domain.errors import NotFoundError
from domain.models import ApiKey, KnowledgeSource, Tenant, User
from logging import get_logger

from .base import BaseRepository

logger = get_logger("repo.tenant")


class TenantRepository(BaseRepository[Tenant]):
    model = Tenant

    async def get_or_create(self, name: str, slug: str) -> Tenant:
        tenant = (
            await self.session.execute(select(Tenant).where(Tenant.slug == slug))
        ).scalar_one_or_none()
        if tenant is None:
            tenant = Tenant(name=name, slug=slug)
            self.session.add(tenant)
            await self.session.flush()
        return tenant


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_email(self, tenant_id: uuid.UUID, email: str) -> User | None:
        stmt = select(User).where(User.tenant_id == tenant_id, User.email == email.lower())
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def ensure_owner(self, tenant_id: uuid.UUID, email: str) -> User:
        user = await self.get_by_email(tenant_id, email)
        if user is None:
            from infrastructure.security.passwords import hash_password

            user = User(
                tenant_id=tenant_id,
                email=email.lower(),
                role="owner",
                password_hash=hash_password("ChangeMe123!"),
            )
            self.session.add(user)
            await self.session.flush()
            logger.info("bootstrap_owner_created", tenant_id=str(tenant_id), email=email)
        return user


class SourceRepository(BaseRepository[KnowledgeSource]):
    model = KnowledgeSource

    async def get_for_workspace(self, source_id: uuid.UUID, tenant_id: uuid.UUID) -> KnowledgeSource:
        stmt = select(KnowledgeSource).where(
            KnowledgeSource.id == source_id, KnowledgeSource.tenant_id == tenant_id
        )
        row = (await self.session.execute(stmt)).scalar_one_or_none()
        if row is None:
            raise NotFoundError(f"source {source_id} not found")
        return row

    async def set_state(self, source_id: uuid.UUID, tenant_id: uuid.UUID, state: str) -> KnowledgeSource:
        src = await self.get_for_workspace(source_id, tenant_id)
        src.state = state
        return src

    async def bump_version(self, source_id: uuid.UUID) -> int:
        stmt = (
            update(KnowledgeSource)
            .where(KnowledgeSource.id == source_id)
            .values(version=KnowledgeSource.version + 1)
            .returning(KnowledgeSource.version)
        )
        version = (await self.session.execute(stmt)).scalar_one()
        return version


class ApiKeyRepository(BaseRepository[ApiKey]):
    model = ApiKey

    async def get_by_hash(self, key_hash: str) -> ApiKey | None:
        stmt = select(ApiKey).where(ApiKey.key_hash == key_hash)
        return (await self.session.execute(stmt)).scalar_one_or_none()
