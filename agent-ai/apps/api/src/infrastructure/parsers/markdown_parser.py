from __future__ import annotations

from .base import BaseParser, ParsedDocument, ParsedSection


class MarkdownParser(BaseParser):
    content_type = "text/markdown"

    async def parse(self, raw: bytes, *, url: str | None = None) -> ParsedDocument:
        text = raw.decode("utf-8", errors="replace")
        sections: list[ParsedSection] = []
        path: list[str] = []
        current: list[str] = []
        heading_text: str | None = None

        def flush() -> None:
            body = "\n".join(current).strip()
            if body:
                sections.append(
                    ParsedSection(
                        heading_path="/".join(path) if path else "/",
                        heading=heading_text,
                        text=body,
                    )
                )
            current.clear()

        for line in text.splitlines():
            stripped = line.strip()
            if stripped.startswith("#"):
                flush()
                level = len(stripped) - len(stripped.lstrip("#"))
                h = stripped.lstrip("#").strip()
                while len(path) >= level:
                    path.pop()
                path.append(h)
                heading_text = h
            elif stripped:
                current.append(line)
        flush()

        return ParsedDocument(
            title=None,
            lang=None,
            content_type=self.content_type,
            sections=sections if sections else [ParsedSection("/", None, text.strip())],
        )
