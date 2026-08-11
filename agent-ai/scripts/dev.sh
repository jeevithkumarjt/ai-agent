#!/usr/bin/env bash
# Local development helpers.
set -euo pipefail

case "${1:-}" in
  up)
    docker compose -f infra/docker/docker-compose.yml up -d --build
    ;;
  down)
    docker compose -f infra/docker/docker-compose.yml down
    ;;
  logs)
    docker compose -f infra/docker/docker-compose.yml logs -f "${2:-api}"
    ;;
  migrate)
    docker compose -f infra/docker/docker-compose.yml exec api alembic upgrade head
    ;;
  test-api)
    cd apps/api && python -m pytest tests/unit -q
    ;;
  seed)
    bash scripts/bootstrap.sh
    ;;
  *)
    echo "usage: $0 {up|down|logs|migrate|test-api|seed}"
    exit 1
    ;;
esac
