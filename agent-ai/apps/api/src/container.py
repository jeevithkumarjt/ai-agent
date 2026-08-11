from __future__ import annotations

from functools import lru_cache

from application.pipeline.query_pipeline import QueryPipeline
from application.services.auth_service import AuthService
from application.services.chat import ChatService
from application.services.eval_service import EvalService
from application.services.memory import MemoryService
from application.services.retrieval import RetrievalService
from application.services.source_service import SourceService
from infrastructure.providers.embedding.gateway import EmbeddingGateway, default_embedding_gateway
from infrastructure.providers.llm.gateway import LLMGateway
from infrastructure.providers.reranker.gateway import RerankerGateway, default_reranker_gateway
from infrastructure.providers.vector.qdrant import QdrantVectorStore


class Container:
    """Composition root. Services are wired once and reused across requests via FastAPI DI."""

    def __init__(self) -> None:
        self.vector_store = QdrantVectorStore()
        self.embeddings: EmbeddingGateway = default_embedding_gateway()
        self.reranker: RerankerGateway = default_reranker_gateway()
        self.llm = LLMGateway()

        self.retrieval = RetrievalService(self.vector_store, self.embeddings, self.reranker)
        self.memory = MemoryService(self.llm)
        self.pipeline = QueryPipeline(self.retrieval, self.llm, self.memory)

    def make_chat(self, session) -> ChatService:
        from infrastructure.repository.conversation_repo import ConversationRepository, MessageRepository
        from infrastructure.repository.source_repo import SourceRepository

        return ChatService(
            self.pipeline,
            ConversationRepository(session),
            MessageRepository(session),
            SourceRepository(session),
            self.memory,
        )

    def make_sources(self, session) -> SourceService:
        from infrastructure.repository.document_repo import ChunkRepository, DocumentRepository
        from infrastructure.repository.source_repo import SourceRepository

        return SourceService(SourceRepository(session), DocumentRepository(session), ChunkRepository(session))

    def make_auth(self, session) -> AuthService:
        from infrastructure.repository.source_repo import TenantRepository, UserRepository

        return AuthService(UserRepository(session), TenantRepository(session), self.memory)

    def make_eval(self, session) -> EvalService:
        from infrastructure.repository.job_repo import EvalRunRepository, GoldenQuestionRepository

        return EvalService(self.pipeline, GoldenQuestionRepository(session), EvalRunRepository(session))


@lru_cache
def container() -> Container:
    return Container()
