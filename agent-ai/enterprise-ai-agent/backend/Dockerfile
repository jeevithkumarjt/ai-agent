# Enterprise AI Agent — backend image (production / cloud deploy)
# Build from the enterprise-ai-agent directory:
#   docker build -f backend/Dockerfile -t agentai-backend .
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Backend source (installs `api`, `core`, `db`, `services` as top-level imports).
COPY backend/ ./backend/
RUN pip install --no-cache-dir "./backend"

# Database DDL used by the alembic 0001 migration (database/schema.sql).
COPY database/ ./database/

# Knowledge base sources (documents/ + site crawl).
COPY documents/ ./documents/

EXPOSE 8000

# Apply schema, bootstrap the owner, then serve.
CMD ["sh", "-c", "alembic -c backend/alembic.ini upgrade head && python -m backend.cli seed && uvicorn backend.main:app --host 0.0.0.0 --port 8000"]
