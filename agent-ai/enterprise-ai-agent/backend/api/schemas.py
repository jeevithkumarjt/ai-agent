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
    email: EmailStr
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
