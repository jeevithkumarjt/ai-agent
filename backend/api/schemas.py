"""Pydantic request/response schemas — mirror api/openapi.yaml exactly."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["owner", "admin", "editor", "viewer"]


class Health(BaseModel):
    status: str


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class Conversation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime


class MessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=8000)


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    tenant_id: uuid.UUID
    role: Literal["user", "assistant", "tool"]
    content: str
    tool_calls: dict[str, Any] | list[Any] | None = None
    created_at: datetime


class MessagePage(BaseModel):
    items: list[MessageOut]
    total: int
    limit: int
    offset: int


class TenantSignupRequest(BaseModel):
    tenant_name: str = Field(min_length=1, max_length=100)
    owner_email: EmailStr
    owner_password: str = Field(min_length=6)


class TenantSignupResponse(BaseModel):
    tenant_id: str
    owner_email: str
    access_token: str
    refresh_token: str
    expires_in: int


class TenantListItem(BaseModel):
    id: str
    name: str
    created_at: str
    user_count: int
