"""Initial schema.

Executes database/schema.sql verbatim — that file is the single source of truth
for DDL; this migration guarantees DB parity with it (ADR-001, ADR-004).
"""
from __future__ import annotations

from pathlib import Path

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

_SCHEMA_PATH = Path(__file__).resolve().parents[3] / "database" / "schema.sql"


def upgrade() -> None:
    schema = _SCHEMA_PATH.read_text(encoding="utf-8")
    statements: list[str] = []
    current: list[str] = []
    for raw_line in schema.splitlines():
        line = raw_line.split("--", 1)[0].rstrip()
        if not line.strip():
            continue
        current.append(line)
        if line.endswith(";"):
            statements.append("\n".join(current))
            current = []
    if current:
        statements.append("\n".join(current))
    for statement in statements:
        op.execute(statement.strip())


def downgrade() -> None:
    op.drop_table("tool_calls")
    op.drop_table("document_chunks")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("users")
    op.drop_table("tenants")
