from __future__ import annotations

import uuid

from logging import get_logger
from telemetry import counter

from .celery_app import celery_app
from .runtime import async_app, run_async

logger = get_logger("tasks.eval")

eval_score_gauge = counter("agentai_eval_score", "Last eval run score")


async def _run_eval(tenant_id: str, trigger: str) -> dict:
    async with async_app() as session:
        from application.pipeline.query_pipeline import QueryPipeline
        from application.services.memory import MemoryService
        from application.services.retrieval import RetrievalService
        from application.services.eval_service import EvalService
        from infrastructure.providers.embedding.gateway import default_embedding_gateway
        from infrastructure.providers.llm.gateway import LLMGateway
        from infrastructure.providers.reranker.gateway import default_reranker_gateway
        from infrastructure.providers.vector.qdrant import QdrantVectorStore
        from infrastructure.repository.job_repo import EvalRunRepository, GoldenQuestionRepository

        vector = QdrantVectorStore()
        embeddings = default_embedding_gateway()
        reranker = default_reranker_gateway()
        retrieval = RetrievalService(vector, embeddings, reranker)
        gateway = LLMGateway()
        memory = MemoryService(gateway)
        pipeline = QueryPipeline(retrieval, gateway, memory)
        service = EvalService(
            pipeline,
            GoldenQuestionRepository(session),
            EvalRunRepository(session),
        )
        run = await service.run(uuid.UUID(tenant_id), trigger=trigger)
        score = float(run.score_overall or 0.0)
        eval_score_gauge.add(score, {"tenant_id": tenant_id})
        logger.info("eval_done", tenant_id=tenant_id, trigger=trigger, score=score, passed=run.passed)
        return {"tenant_id": tenant_id, "score": score, "passed": run.passed}


@celery_app.task(name="workers.tasks_eval.run_eval")
def run_eval(tenant_id: str, trigger: str = "manual") -> dict:
    return run_async(lambda: _run_eval(tenant_id, trigger))
