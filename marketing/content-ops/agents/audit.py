"""Content Research & Audit Agent.

Analyzes viral patterns, engagement ratios, hook structures, and prevents low-value filler.
Maintains data-driven format rankings and guardrails based on public Telegram analytics.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

from pipeline import qa

AUDIT_REPORT = Path(__file__).resolve().parents[1] / "reports" / "competitor-audit-2026-10-10.json"


class AuditAgent:
    """Evaluates hook mechanics, audience psychology, and compliance risks."""

    def __init__(self, audit_file: Path = AUDIT_REPORT):
        self.audit_file = audit_file
        self.audit_data = self._load_audit()

    def _load_audit(self) -> Dict[str, Any]:
        if self.audit_file.exists():
            try:
                return json.loads(self.audit_file.read_text())
            except Exception:
                pass
        return {
            "formats_ranked": [
                {"rank": 1, "format": "Emoji-as-answer position puzzle", "score": 9.5},
                {"rank": 2, "format": "High-stakes blunder / brilliancy breakdown", "score": 8.8},
                {"rank": 3, "format": "Arena flash countdown with prize vault", "score": 8.6},
                {"rank": 4, "format": "Opening trap survival carousel", "score": 8.1},
                {"rank": 5, "format": "Short attributed GM quote + concrete lesson", "score": 7.4},
            ],
            "avoid": [
                {"item": "Dry round-by-round tournament tables"},
                {"item": "Unverifiable 'earn crypto' clickbait"},
                {"item": "Wall-of-text tactical explanations (>600 chars without spacing)"},
                {"item": "Generic motivational quotes without a chessboard"},
            ],
        }

    def audit_post(self, post_data: Dict[str, Any]) -> Dict[str, Any]:
        """Performs structural and psychological audit on a candidate post."""
        hook = post_data.get("hook", "")
        text = post_data.get("text", "")
        category = post_data.get("category", "")
        
        strengths: List[str] = []
        improvements: List[str] = []
        score = 75

        # Hook length check
        if len(hook) <= 85:
            strengths.append(f"Punchy hook ({len(hook)} chars) fits mobile push notification preview.")
            score += 10
        elif len(hook) > 110:
            improvements.append(f"Hook exceeds 110 chars ({len(hook)} chars); may truncate on iOS/Android.")
            score -= 10

        # Interactive engagement triggers
        if any(sym in text for sym in ["❤", "🔥", "👏", "🤔", "⚡"]):
            strengths.append("Includes native reaction buttons or emoji voting options.")
            score += 10
        else:
            improvements.append("Consider adding native reaction voting options for instant engagement.")

        # Spoiler tag evaluation
        if "<tg-spoiler>" in text:
            strengths.append("Leverages <tg-spoiler> for interactive solution reveal, boosting dwell time.")
            score += 5

        # Format ranking match
        matched_format = next(
            (f for f in self.audit_data.get("formats_ranked", []) if category.lower() in f.get("format", "").lower()),
            None
        )
        if matched_format:
            strengths.append(f"Matches top-tier ranked format #{matched_format.get('rank')}.")

        return {
            "overall_viral_score": min(score, 100),
            "strengths": strengths,
            "improvements": improvements,
            "recommended_actions": "Proceed to Chess Editor & Copywriter" if score >= 80 else "Refine hook tension before scheduling",
        }

    def get_guardrails(self) -> List[str]:
        """Returns the active list of items to avoid."""
        return [a.get("item", "") for a in self.audit_data.get("avoid", [])]
