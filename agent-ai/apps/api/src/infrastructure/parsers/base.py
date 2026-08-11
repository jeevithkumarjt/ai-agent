from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ParsedSection:
    heading_path: str
    heading: str | None
    text: str


@dataclass
class ParsedDocument:
    title: str | None
    lang: str | None
    content_type: str
    sections: list[ParsedSection]
    metadata: dict = field(default_factory=dict)
    links: list[str] = field(default_factory=list)
    images: list[str] = field(default_factory=list)


class BaseParser(ABC):
    content_type: str

    @abstractmethod
    async def parse(self, raw: bytes, *, url: str | None = None) -> ParsedDocument:
        raise NotImplementedError
