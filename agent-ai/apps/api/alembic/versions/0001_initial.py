"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-01-01

The schema is derived from the SQLAlchemy models in domain.models so that models stay the
single source of truth. Subsequent migrations must be hand-written (expand/contract).
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    from domain.models import Base
    from db.session import engine

    with engine.begin() as conn:
        conn.run_sync(Base.metadata.create_all)


def downgrade() -> None:
    from domain.models import Base
    from db.session import engine

    with engine.begin() as conn:
        conn.run_sync(Base.metadata.drop_all)
