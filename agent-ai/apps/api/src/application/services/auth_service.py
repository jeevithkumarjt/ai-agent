from __future__ import annotations

import uuid

from application.services.memory import MemoryService
from config import settings
from domain.errors import UnauthorizedError, ValidationError
from domain.schemas.auth import MeOut, TokenPair, UserOut
from infrastructure.repository.source_repo import TenantRepository, UserRepository
from infrastructure.security.jwt import (
    create_access_token,
    create_refresh_token,
    decode_token,
    TokenType,
)
from infrastructure.security.passwords import verify_password
from logging import get_logger

logger = get_logger("service.auth")

ROLE_PERMISSIONS = {
    "owner": {"*"},
    "admin": {"chat", "sources", "admin", "eval", "settings"},
    "editor": {"chat", "sources"},
    "viewer": {"chat"},
}


class AuthService:
    def __init__(self, users: UserRepository, tenants: TenantRepository, memory: MemoryService | None = None):
        self.users = users
        self.tenants = tenants
        self.memory = memory

    async def bootstrap_default_tenant(self) -> uuid.UUID:
        """Create a default workspace + owner for single-tenant deployments."""
        tenant = await self.tenants.get_or_create(name="Default", slug="default")
        await self.users.ensure_owner(tenant.id, "owner@tryvium.ai")
        return tenant.id

    async def login(self, email: str, password: str) -> TokenPair:
        if settings.auth_provider == "oauth":
            raise ValidationError("use OAuth flow")
        tenant = await self.tenants.get_or_create(name="Default", slug="default")
        user = await self.users.get_by_email(tenant.id, email)
        if user is None or not user.password_hash or not verify_password(password, user.password_hash):
            raise UnauthorizedError("invalid credentials")
        if user.status != "active":
            raise UnauthorizedError("account disabled")
        from datetime import datetime, timezone

        user.last_login_at = datetime.now(timezone.utc)
        return TokenPair(
            access_token=create_access_token(str(user.id), user.tenant_id, user.role),
            refresh_token=create_refresh_token(str(user.id), user.tenant_id, user.role),
            expires_in=settings.jwt_access_ttl_minutes * 60,
        )

    async def refresh(self, refresh_token: str) -> TokenPair:
        payload = decode_token(refresh_token, TokenType.REFRESH)
        user = await self.users.get(uuid.UUID(payload["sub"]), tenant_id=uuid.UUID(payload["tenant_id"]))
        if user is None:
            raise UnauthorizedError("user not found")
        return TokenPair(
            access_token=create_access_token(str(user.id), user.tenant_id, user.role),
            refresh_token=create_refresh_token(str(user.id), user.tenant_id, user.role),
            expires_in=settings.jwt_access_ttl_minutes * 60,
        )

    async def me(self, user_id: uuid.UUID, tenant_id: uuid.UUID) -> MeOut:
        user = await self.users.get(user_id, tenant_id=tenant_id)
        out = UserOut.model_validate(user)
        permissions = sorted(ROLE_PERMISSIONS.get(user.role, {"chat"}))
        return MeOut(**out.model_dump(), permissions=permissions)
