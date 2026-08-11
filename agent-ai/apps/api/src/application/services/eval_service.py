from __future__ import annotations

import uuid

from application.pipeline.query_pipeline import QueryContext, QueryPipeline
from domain.models import EvalRun, GoldenQuestion
from infrastructure.repository.job_repo import EvalRunRepository, GoldenQuestionRepository
from logging import get_logger

logger = get_logger("service.eval")


class EvalService:
    """Golden-dataset regression evaluation. Runs the full pipeline for each question and
    scores retrieval quality, citation correctness, and groundedness."""

    def __init__(self, pipeline: QueryPipeline, questions: GoldenQuestionRepository, runs: EvalRunRepository):
        self.pipeline = pipeline
        self.questions = questions
        self.runs = runs

    async def run(self, tenant_id: uuid.UUID, *, trigger: str = "manual") -> EvalRun:
        eval_run = EvalRun(tenant_id=tenant_id, trigger=trigger, status="running")
        await self.runs.add(eval_run)
        await self.runs.session.flush()

        questions = await self.questions.list_active(tenant_id)
        per_question: list[dict] = []
        grounded_scores: list[float] = []
        citation_scores: list[float] = []
        overall_scores: list[float] = []

        for q in questions:
            ctx = QueryContext(
                tenant_id=tenant_id,
                workspace_id=tenant_id,
                session_id=None,
                user_id=uuid.uuid4(),
                question=q.question,
            )
            result = await self.pipeline.run(ctx)
            answer_lower = result.answer.lower()
            fragment_hits = sum(1 for frag in q.answer_fragments if frag.lower() in answer_lower)
            recall = fragment_hits / len(q.answer_fragments) if q.answer_fragments else 0.0
            citation_ok = (q.source_url is None) or any(c.url == q.source_url for c in result.citations)
            grounded = 1.0 if (result.grounded or result.refusal) else 0.0

            grounded_scores.append(grounded)
            citation_scores.append(1.0 if citation_ok else 0.0)
            overall_scores.append(recall)

            per_question.append(
                {
                    "id": str(q.id),
                    "question": q.question,
                    "recall": round(recall, 4),
                    "citation_ok": citation_ok,
                    "grounded": bool(result.grounded),
                    "refusal": result.refusal,
                    "confidence": result.confidence,
                    "answer_snippet": result.answer[:180],
                }
            )

        n = max(len(overall_scores), 1)
        score_overall = sum(overall_scores) / n
        score_grounded = sum(grounded_scores) / n
        score_citation = sum(citation_scores) / n

        eval_run.score_overall = round(score_overall, 4)
        eval_run.score_grounded = round(score_grounded, 4)
        eval_run.score_citation = round(score_citation, 4)
        eval_run.status = "completed"
        eval_run.passed = score_overall >= 0.5 and score_grounded >= 0.9
        eval_run.details = {"per_question": per_question, "count": n}
        logger.info("eval_completed", tenant_id=str(tenant_id), overall=score_overall, grounded=score_grounded)
        return eval_run

    async def latest(self, tenant_id: uuid.UUID) -> EvalRun | None:
        return await self.runs.latest(tenant_id)
