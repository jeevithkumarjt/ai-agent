from __future__ import annotations

import uuid
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from container import Container, container as container_factory
from db.session import get_session
from domain.errors import ForbiddenError, UnauthorizedError
from infrastructure.repository.source_repo import UserRepository
from infrastructure.security.jwt import TokenType, decode_token


class CurrentUser:
    def __init__(self, id: uuid.UUID, tenant_id: uuid.UUID, role: str) -> None:
        self.id = id
        self.tenant_id = tenant_id
        self.role = role

    @property
    def is_admin(self) -> bool:
        return self.role in {"owner", "admin"}

    @property
    def is_editor(self) -> bool:
        return self.role in {"owner", "admin", "editor"}


async def _resolve_bearer(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedError("missing bearer token")
    return authorization[len("Bearer ") :]


async def get_current_user(
    request: Request, session: AsyncSession = Depends(get_session)
) -> CurrentUser:
    authorization = request.headers.get("Authorization")
    api_key = request.headers.get("X-API-Key")

    if api_key:
        import hashlib

        from infrastructure.repository.source_repo import ApiKeyRepository

        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        repo = ApiKeyRepository(session)
        key = await repo.get_by_hash(key_hash)
        if key is None or key.revoked_at is not None:
            raise UnauthorizedError("invalid api key")
        if key.expires_at and key.expires_at < _now():
            raise UnauthorizedError("api key expired")
        from datetime import datetime

        key.last_used_at = datetime.now()
        return CurrentUser(id=key.user_id, tenant_id=key.tenant_id, role="admin")

    token = await _resolve_bearer(authorization)
    payload = decode_token(token, TokenType.ACCESS)
    return CurrentUser(
        id=uuid.UUID(payload["sub"]),
        tenant_id=uuid.UUID(payload["tenant_id"]),
        role=payload["role"],
    )


def _now():
    from datetime import datetime, timezone

    return datetime.now(timezone.utc)


async def require_admin(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
    if not user.is_admin:
        raise ForbiddenError("admin role required")
    return user


async def require_editor(user: Annotated[CurrentUser, Depends(get_current_user)]) -> CurrentUser:
    if not user.is_editor:
        raise ForbiddenError("editor role required")
    return user


def get_container() -> Container:
    return container_factory()


SessionDep = Annotated[AsyncSession, Depends(get_session)]
UserDep = Annotated[CurrentUser, Depends(get_current_user)]
AdminDep = Annotated[CurrentUser, Depends(require_admin)]
EditorDep = Annotated[CurrentUser, Depends(require_editor)]
ContainerDep = Annotated[Container, Depends(get_container)]
