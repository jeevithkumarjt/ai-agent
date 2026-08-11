from __future__ import annotations

import csv
import io

from .base import BaseParser, ParsedDocument, ParsedSection


class CSVParser(BaseParser):
    content_type = "text/csv"

    async def parse(self, raw: bytes, *, url: str | None = None) -> ParsedDocument:
        text = raw.decode("utf-8", errors="replace")
        reader = csv.reader(io.StringIO(text))
        rows = list(reader)
        if not rows:
            return ParsedDocument(None, None, self.content_type, [])
        header = rows[0]
        sections: list[ParsedSection] = []
        for i, row in enumerate(rows[1:], start=1):
            if not row:
                continue
            record = "\n".join(f"{header[j] if j < len(header) else 'col' + str(j)}: {value}" for j, value in enumerate(row))
            sections.append(ParsedSection(heading_path=f"/row-{i}", heading=f"Row {i}", text=record))
        return ParsedDocument(
            title=None,
            lang=None,
            content_type=self.content_type,
            sections=sections,
            metadata={"rows": len(rows) - 1, "columns": len(header)},
        )
