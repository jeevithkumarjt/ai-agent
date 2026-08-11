from __future__ import annotations

"""Golden-dataset regression gate.

Runs the full pipeline against every seeded golden question and asserts the
score thresholds that block regressions. Requires the docker stack (postgres,
redis, qdrant) plus an LLM provider (OPENAI_API_KEY or equivalent).
"""

import pytest

pytestmark = pytest.mark.eval


@pytest.mark.asyncio
async def test_golden_dataset_gate_passes() -> None:
    from application.services.eval_service import EvalService
    from container import Container
    from db.session import SessionFactory
    from infrastructure.repository.job_repo import EvalRunRepository, GoldenQuestionRepository
    from infrastructure.repository.source_repo import TenantRepository

    async with SessionFactory() as session:
        tenant = await TenantRepository(session).get_or_create(name="Default", slug="default")
        await session.flush()

        container = Container()
        service = EvalService(container.pipeline, GoldenQuestionRepository(session), EvalRunRepository(session))
        run = await service.run(tenant.id, trigger="ci")
        await session.commit()

        print(
            f"\neval gate: overall={run.score_overall} grounded={run.score_grounded} "
            f"citation={run.score_citation} passed={run.passed}"
        )
        assert run.passed, (
            f"eval gate blocked: overall={run.score_overall} (need >=0.5) "
            f"grounded={run.score_grounded} (need >=0.9)"
        )
