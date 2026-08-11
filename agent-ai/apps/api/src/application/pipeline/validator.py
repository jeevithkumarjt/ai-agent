from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ValidationResult:
    valid: bool
    reasons: list[str]
    grounded: bool = True

    def merge(self, other: "ValidationResult") -> "ValidationResult":
        return ValidationResult(
            valid=self.valid and other.valid,
            reasons=[*self.reasons, *other.reasons],
            grounded=self.grounded and other.grounded,
        )


def validate_citations(citations: list[dict]) -> ValidationResult:
    reasons: list[str] = []
    if not citations:
        reasons.append("no citations produced")
        return ValidationResult(valid=False, reasons=reasons, grounded=False)
    for citation in citations:
        url = citation.get("url")
        if not url:
            reasons.append("citation missing url")
    return ValidationResult(valid=not reasons, reasons=reasons)


def validate_length(answer: str, min_chars: int = 20) -> ValidationResult:
    if len(answer.strip()) < min_chars:
        return ValidationResult(valid=False, reasons=["answer too short"])
    return ValidationResult(valid=True, reasons=[])


def validate_refusal_mismatch(answer: str, confidence: float, threshold: float) -> ValidationResult:
    """A refusal answer must not be presented as a confident grounded answer and vice versa."""
    lowered = answer.lower()
    is_refusal_phrase = any(
        phrase in lowered for phrase in ("i couldn't find", "couldn't find a reliable", "no reliable answer")
    )
    if is_refusal_phrase and confidence >= threshold:
        return ValidationResult(valid=False, reasons=["refusal with high confidence"])
    if not is_refusal_phrase and confidence < threshold * 0.6:
        return ValidationResult(valid=False, reasons=["answer with very low confidence"])
    return ValidationResult(valid=True, reasons=[])
