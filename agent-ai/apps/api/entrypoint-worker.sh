#!/usr/bin/env bash
# Worker entrypoint. Usage: entrypoint-worker.sh <worker-name>
# worker-name: default | priority | crawl | index | maintenance | eval | monitor
set -euo pipefail

WORKER_NAME="${1:-default}"
echo "[worker] starting: $WORKER_NAME"
exec celery -A workers.celery_app.celery_app worker -Q "$WORKER_NAME" --concurrency "${WORKER_CONCURRENCY:-4}" -l info --max-tasks-per-child=100
