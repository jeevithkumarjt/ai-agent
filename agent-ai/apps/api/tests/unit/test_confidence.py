from __future__ import annotations

from application.pipeline.confidence import ConfidenceInput, confidence_score, freshness_decay
from application.pipeline.grounder import GroundingVerifier
from application.pipeline.validator import validate_citations, validate_refusal_mismatch


def test_confidence_high_with_strong_scores() -> None:
    score = confidence_score(ConfidenceInput(rerank_scores=[0.95, 0.9, 0.8]))
    assert score > 0.6


def test_confidence_low_with_weak_scores() -> None:
    score = confidence_score(ConfidenceInput(rerank_scores=[0.12, 0.1]))
    assert score < 0.3


def test_confidence_zero_when_no_chunks() -> None:
    assert confidence_score(ConfidenceInput(rerank_scores=[])) == 0.0


def test_freshness_decay() -> None:
    from datetime import datetime, timedelta, timezone

    fresh = freshness_decay(datetime.now(timezone.utc) - timedelta(days=30))
    old = freshness_decay(datetime.now(timezone.utc) - timedelta(days=800))
    assert 0.5 < fresh <= 1.0
    assert old < fresh


def test_grounding_verifier_accepts_supported_sentences() -> None:
    verifier = GroundingVerifier(threshold=0.5)
    context = [{"text": "Tryvium provides multilingual AI voice agents and chat agents for enterprise customer service."}]
    grounded, _ = verifier.verify(
        "Tryvium provides multilingual AI voice agents.", context
    )
    assert grounded


def test_grounding_verifier_rejects_unsupported_claims() -> None:
    verifier = GroundingVerifier(threshold=0.5)
    context = [{"text": "Pricing starts at forty nine dollars per month."}]
    grounded, unsupported = verifier.verify(
        "Tryvium's stock price rose by twenty percent last quarter.", context
    )
    assert not grounded
    assert unsupported


def test_validate_citations_requires_urls() -> None:
    result = validate_citations([{"chunk_id": "x"}])
    assert not result.valid
    assert result.grounded is False
    ok = validate_citations([{"url": "https://www.tryvium.ai/pricing"}])
    assert ok.valid


def test_refusal_mismatch() -> None:
    bad = validate_refusal_mismatch("I couldn't find a reliable answer in the available sources.", 0.9, 0.55)
    assert not bad.valid
    good = validate_refusal_mismatch("I couldn't find a reliable answer in the available sources.", 0.2, 0.55)
    assert good.valid
