#!/usr/bin/env bash
# Runs Alembic migrations then starts the API.
set -euo pipefail

echo "[entrypoint] running migrations"
alembic upgrade head

echo "[entrypoint] starting API"
exec uvicorn main:app --host "${API_HOST:-0.0.0.0}" --port "${API_PORT:-8000}" --workers "${API_WORKERS:-2}" --proxy-headers
