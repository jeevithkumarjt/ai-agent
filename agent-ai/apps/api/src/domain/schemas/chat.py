from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from .common import ORMModel


class ChatOptions(BaseModel):
    mode: Literal["hybrid", "dense", "keyword"] = "hybrid"
    rerank: bool = True
    max_context_chars: int = 8000
    use_multi_query: bool = True
    use_rewrite: bool = True


class StreamRequest(BaseModel):
    session_id: uuid.UUID | None = None
    question: str = Field(min_length=1, max_length=8000)
    workspace_id: uuid.UUID | None = None
    options: ChatOptions = Field(default_factory=ChatOptions)


class AnswerRequest(StreamRequest):
    pass


class Citation(BaseModel):
    chunk_id: uuid.UUID
    url: str
    heading: str | None = None
    snippet: str
    score: float | None = None


class Usage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class RetrievalMeta(BaseModel):
    top_k: int
    reranked_top_k: int
    query_rewrites: list[str] = Field(default_factory=list)
    latency_ms: int
    cache_hit: bool = False


class ChatAnswer(BaseModel):
    answer: str
    grounded: bool
    confidence: float
    citations: list[Citation] = Field(default_factory=list)
    model: dict[str, str]
    usage: Usage = Field(default_factory=Usage)
    message_id: uuid.UUID | None = None
    session_id: uuid.UUID | None = None
    retrieval: RetrievalMeta | None = None
    degraded: bool = False
    refusal: bool = False


class SessionCreate(BaseModel):
    title: str | None = None


class SessionOut(ORMModel):
    id: uuid.UUID
    title: str | None
    pinned: bool
    created_at: datetime
    updated_at: datetime


class SessionPatch(BaseModel):
    title: str | None = None
    pinned: bool | None = None


class MessageOut(ORMModel):
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    citations: list[dict]
    confidence: float | None
    grounded: bool | None
    model: str | None
    provider: str | None
    tokens_in: int | None
    tokens_out: int | None
    latency_ms: int | None
    created_at: datetime


class FeedbackCreate(BaseModel):
    message_id: uuid.UUID
    rating: Literal[-1, 0, 1]
    comment: str | None = Field(default=None, max_length=2000)
