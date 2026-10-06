"""Add lexical tsvector column to document_chunks (hybrid retrieval).

Migration 0001 executes database/schema.sql verbatim, so fresh databases
already contain the generated `tsv` column + GIN index. This migration brings
existing databases to parity: it replaces the old in-memory BM25 store with a
Postgres-backed lexical index (tsvector/ts_rank) so hybrid search runs in one
query against document_chunks (review item: horizontal scaling / one source of
truth). Idempotent — safe to run on fresh and existing databases.
"""
from __future__ import annotations

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

_ADD_TSV = """
    ALTER TABLE document_chunks
        ADD COLUMN IF NOT EXISTS tsv tsvector
        GENERATED ALWAYS AS (to_tsvector('english', chunk_text)) STORED
"""
_CREATE_GIN = "CREATE INDEX IF NOT EXISTS idx_document_chunks_tsv ON document_chunks USING GIN (tsv)"
_DROP_GIN = "DROP INDEX IF EXISTS idx_document_chunks_tsv"
_DROP_TSV = "ALTER TABLE document_chunks DROP COLUMN IF EXISTS tsv"


def upgrade() -> None:
    op.execute(_ADD_TSV)
    op.execute(_CREATE_GIN)


def downgrade() -> None:
    op.execute(_DROP_GIN)
    op.execute(_DROP_TSV)
