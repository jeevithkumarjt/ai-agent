from __future__ import annotations

from urllib.parse import urljoin

import trafilatura
from bs4 import BeautifulSoup

from logging import get_logger

from .base import BaseParser, ParsedDocument, ParsedSection

logger = get_logger("parser.html")


class HTMLParser(BaseParser):
    content_type = "text/html"

    async def parse(self, raw: bytes, *, url: str | None = None) -> ParsedDocument:
        html = raw.decode("utf-8", errors="replace")
        soup = BeautifulSoup(html, "lxml")

        title = soup.title.get_text(strip=True) if soup.title else None
        html_tag = soup.find("html")
        lang = html_tag.get("lang") if html_tag else None

        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if url:
                href = urljoin(url, href)
            links.append(href)

        images = [img.get("src", "") for img in soup.find_all("img") if img.get("src")]

        extracted = trafilatura.extract(
            html,
            output_format="markdown",
            include_comments=False,
            include_tables=True,
            favor_precision=True,
        )

        canonical = None
        canonical_tag = soup.find("link", rel="canonical")
        if canonical_tag and canonical_tag.get("href"):
            canonical = urljoin(url, canonical_tag["href"]) if url else canonical_tag["href"]

        if extracted is None or not extracted.strip():
            extracted = self._fallback_extract(soup)

        sections = self._to_sections(extracted)
        metadata = {"canonical": canonical} if canonical else {}
        return ParsedDocument(
            title=title,
            lang=lang,
            content_type=self.content_type,
            sections=sections,
            metadata=metadata,
            links=links,
            images=images,
        )

    def _fallback_extract(self, soup: BeautifulSoup) -> str:
        for tag in soup(["script", "style", "nav", "footer", "aside", "header"]):
            tag.decompose()
        return soup.get_text(separator="\n", strip=True)

    def _to_sections(self, markdown: str) -> list[ParsedSection]:
        """Convert markdown into heading-based sections preserving heading paths."""
        sections: list[ParsedSection] = []
        path: list[str] = []
        current_text: list[str] = []
        current_heading = "/"
        current_heading_text: str | None = None

        def flush() -> None:
            text = "\n".join(current_text).strip()
            if text:
                sections.append(
                    ParsedSection(
                        heading_path="/".join(path) if path else "/",
                        heading=current_heading_text,
                        text=text,
                    )
                )
            current_text.clear()

        for line in markdown.splitlines():
            stripped = line.strip()
            if stripped.startswith("#"):
                flush()
                level = len(stripped) - len(stripped.lstrip("#"))
                heading_text = stripped.lstrip("#").strip()
                while len(path) >= level:
                    path.pop()
                path.append(heading_text)
                current_heading_text = heading_text
                current_heading = "/".join(path)
            elif stripped:
                current_text.append(line)
        flush()

        if not sections:
            sections.append(ParsedSection(heading_path="/", heading=None, text=markdown.strip()))
        return sections
