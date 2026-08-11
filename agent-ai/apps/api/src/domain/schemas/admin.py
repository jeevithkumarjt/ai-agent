from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from .common import ORMModel


class AdminOverview(BaseModel):
    sources: int
    documents: int
    chunks: int
    embedded_chunks: int
    conversations: int
    queue_depth: dict[str, int]
    dlq_depth: int
    last_eval: dict[str, Any] | None = None


class DocumentAdminOut(ORMModel):
    id: uuid.UUID
    canonical_url: str
    content_type: str
    title: str | None
    lang: str | None
    sha256: str
    version: int
    status: str
    error: str | None
    published_at: datetime | None
    updated_at: datetime


class DocumentStatusPatch(BaseModel):
    status: Literal["pending", "downloaded", "parsed", "embedded", "failed", "deleted"]
    error: str | None = None


class PromptCreate(BaseModel):
    name: str
    key: str
    template: str = Field(min_length=1)
    config: dict[str, Any] = Field(default_factory=dict)


class PromptOut(ORMModel):
    id: uuid.UUID
    name: str
    key: str
    version: int
    template: str
    config: dict[str, Any]
    active: bool
    created_at: datetime


class ModelConfigCreate(BaseModel):
    provider: str
    model: str
    role: Literal["fast", "default", "reasoning", "embedding", "reranker"] = "default"
    enabled: bool = True
    config: dict[str, Any] = Field(default_factory=dict)


class ModelConfigOut(ORMModel):
    id: uuid.UUID
    provider: str
    model: str
    role: str
    enabled: bool
    config: dict[str, Any]


class ApiKeyCreate(BaseModel):
    name: str
    scopes: list[str] = Field(default_factory=list)
    expires_at: datetime | None = None


class ApiKeyOut(BaseModel):
    id: uuid.UUID
    name: str
    scopes: list[str]
    expires_at: datetime | None
    created_at: datetime
    plaintext: str | None = None


class GoldenQuestionCreate(BaseModel):
    question: str
    answer_fragments: list[str] = Field(default_factory=list)
    source_url: str | None = None
    category: str = "general"


class GoldenQuestionOut(ORMModel):
    id: uuid.UUID
    question: str
    answer_fragments: list[str]
    source_url: str | None
    category: str
    active: bool


class EvalRunOut(ORMModel):
    id: uuid.UUID
    trigger: str
    status: str
    score_overall: float | None
    score_grounded: float | None
    score_citation: float | None
    score_freshness: float | None
    passed: bool | None
    details: dict[str, Any]
    created_at: datetime


class AuditLogOut(ORMModel):
    id: uuid.UUID
    actor_id: uuid.UUID | None
    action: str
    resource_type: str | None
    resource_id: str | None
    meta: dict[str, Any]
    ip: str | None
    created_at: datetime


class UserAdminOut(ORMModel):
    id: uuid.UUID
    email: str
    role: str
    status: str
    created_at: datetime


class UserRolePatch(BaseModel):
    role: Literal["owner", "admin", "editor", "viewer"]
    status: Literal["active", "disabled"] | None = None
