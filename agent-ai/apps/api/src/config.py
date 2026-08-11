from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration. Values come from environment / .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["development", "staging", "production"] = "development"
    app_name: str = "agent-ai"
    debug: bool = False
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    log_level: str = "INFO"
    secret_key: str = Field(default="change-me", min_length=16)

    default_source_url: str = "https://www.tryvium.ai"
    default_sitemap_url: str = "https://www.tryvium.ai/sitemap_index.xml"

    # --- Postgres ---
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "agentai"
    postgres_user: str = "agentai"
    postgres_password: str = "agentai"
    database_url: str = "postgresql+asyncpg://agentai:agentai@postgres:5432/agentai"

    # --- Redis ---
    redis_url: str = "redis://redis:6379/0"
    redis_queue_url: str = "redis://redis:6379/1"

    # --- Qdrant ---
    qdrant_url: str = "http://qdrant:6333"
    qdrant_api_key: str | None = None

    # --- Object storage ---
    storage_backend: Literal["local", "s3", "azure", "gcs"] = "local"
    storage_local_dir: str = "data/storage"
    s3_endpoint_url: str | None = None
    s3_bucket: str | None = None
    s3_region: str | None = None
    s3_access_key: str | None = None
    s3_secret_key: str | None = None
    azure_connection_string: str | None = None
    azure_container: str | None = None
    gcs_bucket: str | None = None
    gcs_credentials_path: str | None = None

    # --- Embedding ---
    embedding_provider: Literal["fastembed", "openai", "azure", "huggingface", "vertex"] = "fastembed"
    embedding_model: str = "BAAI/bge-m3"
    embedding_dim: int = 1024
    embedding_batch_size: int = 32
    embedding_max_chars: int = 8192
    embedding_cache_ttl: int = 86400

    # --- Reranker ---
    reranker_provider: Literal["fastembed", "cohere"] = "fastembed"
    reranker_model: str = "BAAI/bge-reranker-v2-m3"

    # --- LLM ---
    llm_default_provider: str = "openai"
    llm_default_model: str = "gpt-4o-mini"
    llm_fast_model: str = "gpt-4o-mini"
    llm_reasoning_model: str = "o3-mini"
    llm_timeout_seconds: int = 120
    llm_max_tokens: int = 1500
    llm_temperature: float = 0.2

    openai_api_key: str | None = None
    openai_base_url: str | None = None
    openai_org_id: str | None = None
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-4-5"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    mistral_api_key: str | None = None
    mistral_model: str = "mistral-large-latest"
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"
    azure_openai_key: str | None = None
    azure_openai_endpoint: str | None = None
    azure_openai_deployment: str | None = None
    ollama_base_url: str = "http://ollama:11434"
    ollama_model: str = "llama3.1"
    local_model_path: str | None = None

    # --- Retrieval ---
    retrieval_top_k: int = 24
    retrieval_rerank_top_k: int = 8
    retrieval_rrf_k: int = 60
    retrieval_min_score: float = 0.35
    retrieval_confidence_threshold: float = 0.55
    retrieval_semantic_weight: float = 1.0
    retrieval_keyword_weight: float = 1.0
    retrieval_mmr_lambda: float = 0.7
    retrieval_mmr_top_k: int = 40

    # --- Search modes ---
    search_use_knowledge_graph: bool = True
    search_use_multi_query: bool = True
    search_use_query_rewrite: bool = True
    search_use_context_compression: bool = True

    # --- Caching ---
    cache_enabled: bool = True
    cache_retrieval_ttl: int = 900
    cache_query_ttl: int = 300
    cache_response_ttl: int = 300
    cache_embedding_ttl: int = 86400
    cache_max_responses: int = 5000

    # --- Crawler ---
    crawler_concurrency: int = 16
    crawler_respect_robots: bool = True
    crawler_user_agent: str = "AgentAI-Crawler/1.0 (+https://www.tryvium.ai/bot)"
    crawler_request_timeout: int = 30
    crawler_max_retries: int = 4
    crawler_retry_base_delay: int = 2
    crawler_max_pages_per_run: int = 100_000
    crawler_download_binaries: bool = True

    # --- Ingestion ---
    chunk_strategy: Literal["heading", "semantic", "fixed"] = "heading"
    chunk_min_chars: int = 600
    chunk_max_chars: int = 1600
    chunk_overlap_chars: int = 120
    parser_max_doc_size_mb: int = 20
    ocr_enabled: bool = True
    ocr_tesseract_path: str = "tesseract"
    video_transcription_enabled: bool = False

    # --- Workers ---
    celery_broker_url: str = "redis://redis:6379/2"
    celery_result_backend: str = "redis://redis:6379/3"
    celery_max_retries: int = 5
    dlq_retry_before_dead: int = 3
    worker_concurrency: int = 4

    # --- Webhooks ---
    webhook_secret: str = "change-me-webhook-secret"

    # --- Security ---
    jwt_secret: str = "change-me-jwt-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_minutes: int = 30
    jwt_refresh_ttl_days: int = 14
    rate_limit_per_minute: int = 60
    rate_limit_chat_per_minute: int = 20
    auth_provider: Literal["internal", "oauth"] = "internal"
    pii_scanner_enabled: bool = True
    prompt_injection_scanner_enabled: bool = True

    # --- Observability ---
    otel_exporter_otlp_endpoint: str | None = None
    otel_service_name: str = "agentai-api"
    sentry_dsn: str | None = None
    sentry_traces_sample_rate: float = 0.1
    metrics_enabled: bool = True

    @property
    def sync_database_url(self) -> str:
        return self.database_url.replace("+asyncpg", "")

    @property
    def redis_uri(self) -> str:
        return self.redis_url

    @property
    def queue_broker_url(self) -> str:
        return self.celery_broker_url

    @property
    def embedding_available(self) -> bool:
        return True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
