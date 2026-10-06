"""Tool protocol + registry (02-agent-and-rag-workflow.md §3).

Each tool is a self-contained module. input_schema is a pydantic model so the
orchestrator validates every tool_use input against it before execution; the LLM
wire schema is derived via model_json_schema(). Only `search_knowledge_base` is
wired in phase 1 (05-roadmap.md); the registry makes adding tools a one-liner.

The execute() signature matches the locked contract:
    async def execute(self, *, tenant_id: uuid.UUID, **kwargs) -> BaseModel
Additional needs (e.g. the DB session for RAG) arrive as keyword arguments.
"""
from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from typing import Any

from db.models import ToolCall
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession


class ToolResult(BaseModel):
    """Default output_schema — tools may define a richer one."""

    content: str
    sources: list[str] = []


class BaseTool(ABC):
    name: str
    description: str
    input_schema: type[BaseModel]
    output_schema: type[BaseModel] = ToolResult

    @abstractmethod
    async def execute(self, *, tenant_id: uuid.UUID, **kwargs: Any) -> BaseModel:
        ...

    def schema(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema.model_json_schema(),
        }


async def record_tool_call(
    *,
    session: AsyncSession,
    conversation_id: uuid.UUID,
    tenant_id: uuid.UUID,
    tool_name: str,
    input: dict[str, Any],
    output: dict[str, Any],
    duration_ms: int,
    success: bool,
) -> None:
    """Audit row for every tool execution (02-agent-and-rag-workflow.md §1)."""
    session.add(
        ToolCall(
            conversation_id=conversation_id,
            tenant_id=tenant_id,
            tool_name=tool_name,
            input=input,
            output=output,
            duration_ms=duration_ms,
            success=success,
        )
    )


def build_tool_map(tools: list[BaseTool]) -> dict[str, BaseTool]:
    return {t.name: t for t in tools}
