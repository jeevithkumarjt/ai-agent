#!/bin/sh
set -e

echo "=== Running alembic migrations ==="
alembic -c backend/alembic.ini upgrade head 2>&1 || echo "WARN: alembic migration skipped (tables may already exist)"

echo "=== Seeding database ==="
python -m backend.cli seed 2>&1 || echo "WARN: seed skipped"

echo "=== Starting uvicorn ==="
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000 --timeout-graceful-shutdown 5
