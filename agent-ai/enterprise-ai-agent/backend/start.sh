#!/bin/sh
set -e

echo "=== Running alembic migrations ==="
if alembic -c backend/alembic.ini upgrade head 2>&1; then
    echo "=== Alembic migrations completed ==="
else
    echo "=== Alembic failed, falling back to create_all ==="
    python -c "
import asyncio
from db.session import engine
from db.models import Base
from db.admin_models import AdminBase

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(AdminBase.metadata.create_all)
    print('=== Tables created via create_all ===')

asyncio.run(create_tables())
" 2>&1
fi

echo "=== Seeding database ==="
python -m backend.cli seed 2>&1

echo "=== Starting uvicorn ==="
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000
