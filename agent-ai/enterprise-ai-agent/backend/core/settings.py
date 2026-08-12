"""Central configuration (ADR-007: secrets via environment variables only)."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    debug: bool = False

    # --- Database (ADR-001: single Postgres + pgvector) ---
    database_url: str = "postgresql+asyncpg://agentai:agentai@localhost:5432/agentai"

    # --- LLM provider: "anthropic" | "groq" (OpenAI-format) ---
    llm_provider: str = "anthropic"

    # --- LLM (Anthropic Messages API — ADR-002) ---
    anthropic_api_key: str = ""
    anthropic_base_url: str = "https://api.anthropic.com"
    anthropic_model: str = "claude-sonnet-4-5"
    anthropic_max_tokens: int = 2048
    anthropic_version: str = "2023-06-01"

    # --- Embeddings (must match document_chunks.embedding vector(1536)) ---
    embeddings_api_key: str = ""
    embeddings_base_url: str = "https://api.openai.com/v1"
    embeddings_model: str = "text-embedding-3-small"
    embeddings_dim: int = 1536
    embeddings_batch_size: int = 64

    # --- Retrieval ---
    retrieval_top_k: int = 5

    # --- Knowledge store (documents/ folder + site crawl; stdlib only) ---
    knowledge_docs_dir: str = "documents"
    knowledge_sites: list[str] = ["https://www.tryvium.ai/"]
    knowledge_max_site_pages: int = 80
    knowledge_refresh_minutes: int = 360

    # --- Agent loop guardrails (02-agent-and-rag-workflow.md) ---
    agent_max_tool_iterations: int = 5

    # --- Auth (ADR-005) ---
    jwt_secret: str = Field(default="change-me", min_length=16)
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_minutes: int = 30
    jwt_refresh_ttl_days: int = 14

    # --- Anonymous guest sessions (public demo/chat pages) ---
    # Issues viewer-scoped, rate-limited tokens with NO credentials on disk.
    # Enable only when anonymous chat is intentional (public landing/demo).
    guest_enabled: bool = True
    guest_role: str = "viewer"
    guest_tenant_id: str = ""  # optional; defaults to the first tenant
    guest_requests_per_minute: int = 20

    # --- Bootstrap (python -m backend.cli seed) ---
    bootstrap_tenant_name: str = "Default"
    bootstrap_owner_email: str = "owner@example.com"
    bootstrap_owner_password: str = Field(default="ChangeMe123!", min_length=8)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
