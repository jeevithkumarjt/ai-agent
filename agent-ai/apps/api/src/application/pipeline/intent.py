from __future__ import annotations

from enum import Enum


class Intent(str, Enum):
    FACTUAL = "factual"
    HOWTO = "howto"
    COMPARISON = "comparison"
    TROUBLESHOOT = "troubleshoot"
    PRICING = "pricing"
    CONTACT = "contact"
    OUT_OF_SCOPE = "out_of_scope"
    GREETING = "greeting"


_RULE_KEYWORDS: dict[Intent, tuple[str, ...]] = {
    Intent.PRICING: ("price", "pricing", "cost", "how much", "plan", "billing", "subscription", "trial", "free"),
    Intent.TROUBLESHOOT: ("error", "issue", "problem", "not working", "fail", "bug", "doesn't work", "broken"),
    Intent.COMPARISON: ("vs", "versus", "compare", "comparison", "difference", "better", "alternative", "instead of"),
    Intent.HOWTO: ("how to", "how do i", "steps to", "tutorial", "guide", "walkthrough", "setup", "configure", "install"),
    Intent.CONTACT: ("contact", "phone", "email us", "talk to", "demo", "book a", "schedule"),
    Intent.GREETING: ("hello", "hi ", "hey", "good morning", "good afternoon", "thanks", "thank you"),
}


def classify_intent_rule_based(question: str) -> Intent:
    lowered = f" {question.lower()} "
    for intent, keywords in _RULE_KEYWORDS.items():
        for kw in keywords:
            if kw in lowered:
                return intent
    return Intent.FACTUAL
