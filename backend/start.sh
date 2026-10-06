#!/bin/sh
set -e

echo "=== Starting uvicorn ==="
exec uvicorn backend.main:app --host 0.0.0.0 --port 8000 --timeout-graceful-shutdown 5
