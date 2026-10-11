"""QA & Compliance Agent.

Zero-compromise deterministic safety inspector. Enforces:
- Telegram Bot API 8.0 HTML validity & length bounds
- Whitelisted domain verification (aumera.top, web3chess.online, t.me)
- Strict wager compliance (18+ disclosure, zero earnings/income guarantees)
- Absolute originality and anti-plagiarism n-gram scoring
- Python-chess tactical verification
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pipeline import qa


class QaComplianceAgent:
    """Rigorous gatekeeper ensuring no non-compliant or broken content reaches the audience."""

    def __init__(self):
        pass

    def inspect_telegram_post(
        self, post: Dict[str, Any], published_corpus: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Runs the complete deterministic Telegram gate suite."""
        result = qa.check_telegram(post, corpus=published_corpus)
        return {
            "passed": result["passed"],
            "issues": result["issues"],
            "gate_summary": "Passed all deterministic Telegram gates" if result["passed"] else f"Failed with {len(result['issues'])} issues",
        }

    def inspect_blog_article(
        self,
        article: Dict[str, Any],
        published_corpus: Optional[List[str]] = None,
        references: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Runs the complete deterministic Website Blog gate suite."""
        result = qa.check_article(article, corpus=published_corpus, references=references)
        return {
            "passed": result["passed"],
            "issues": result["issues"],
            "gate_summary": "Passed all deterministic Article gates" if result["passed"] else f"Failed with {len(result['issues'])} issues",
        }
