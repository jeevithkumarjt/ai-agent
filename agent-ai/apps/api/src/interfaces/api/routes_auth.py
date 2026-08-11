from __future__ import annotations

from fastapi import APIRouter

from container import Container
from domain.schemas.auth import LoginRequest, MeOut, RefreshRequest, TokenPair
from interfaces.api.deps import ContainerDep, SessionDep, UserDep

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenPair)
async def login(data: LoginRequest, session: SessionDep, container: ContainerDep) -> TokenPair:
    return await container.make_auth(session).login(data.email, data.password)


@router.post("/refresh", response_model=TokenPair)
async def refresh(data: RefreshRequest, session: SessionDep, container: ContainerDep) -> TokenPair:
    return await container.make_auth(session).refresh(data.refresh_token)


@router.get("/me", response_model=MeOut)
async def me(session: SessionDep, container: ContainerDep, user: UserDep) -> MeOut:
    return await container.make_auth(session).me(user.id, user.tenant_id)
