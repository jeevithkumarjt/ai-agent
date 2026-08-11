from __future__ import annotations

from dataclasses import dataclass, field
from typing import AsyncIterator, Protocol


@dataclass
class Completion:
    text: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    finish_reason: str | None = None
    extra: dict = field(default_factory=dict)

    @property
    def usage(self) -> dict[str, int]:
        return {
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
        }


def message(role: str, content: str) -> dict:
    return {"role": role, "content": content}


class LLMProvider(Protocol):
    name: str

    async def complete(
        self,
        messages: list[dict],
        *,
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> Completion: ...

    async def stream(
        self,
        messages: list[dict],
        *,
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 1500,
    ) -> AsyncIterator[str]: ...

    async def is_available(self) -> bool: ...
