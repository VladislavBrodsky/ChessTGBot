"""CMO Agent: Chief Marketing Officer & Strategy Director.

Sets Viral & FOMO growth vectors, tone of voice, editorial standards, KPI benchmarks,
and exercises executive authority over campaign gates.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from pipeline import brand, queue

@dataclass
class StrategicDirective:
    quarter: str = "Q4 2026"
    positioning: str = "The definitive cerebral speed chess arena inside Telegram. Anti-brainrot, skill-based, high-stakes."
    primary_domain: str = "aumera.top"
    bot_app: str = "https://t.me/chess_matbot/Web3Chess"
    target_kpis: Dict[str, Any] = field(default_factory=lambda: {
        "telegram_ctr": ">= 8.5%",
        "viral_forward_rate": ">= 4.0%",
        "first_game_conversion": ">= 18.0%",
        "daily_active_streakers": ">= 25.0%",
        "wager_rules_completion": "100% compliant",
    })
    viral_hooks: List[Dict[str, str]] = field(default_factory=lambda: [
        {
            "id": "VH1_CURIOSITY_GAP",
            "formula": "High-ELO Trap: 'White thought they were winning until move 14. Can you spot why?'",
            "pillar": "Tactics"
        },
        {
            "id": "VH2_FOMO_TIME_DROP",
            "formula": "Synchronized Arena Drop: '08:00 UTC Arena starts in 15 mins. $500 Vault. Once the clock starts, registration locks.'",
            "pillar": "Product"
        },
        {
            "id": "VH3_SPECTATOR_DRAMA",
            "formula": "High-Stakes Blunder Breakdown: '1,200 USDT on the board. 4 seconds left. One tragic mouse-slip.'",
            "pillar": "Chess Culture"
        },
        {
            "id": "VH4_ANTI_BRAINROT",
            "formula": "Intellectual Mastery: 'Tap-to-earn was for bots. Real PvP is for minds. Play a grandmaster line.'",
            "pillar": "Academy"
        },
        {
            "id": "VH5_STREAK_LOSS_AVERSION",
            "formula": "Loss Aversion: 'Your 7-day Tactician streak expires at midnight UTC. Protect your status.'",
            "pillar": "Product"
        }
    ])


class CmoAgent:
    """The CMO Agent governs marketing strategy, brand authority, and campaign validation."""

    def __init__(self, directive: StrategicDirective | None = None):
        self.directive = directive or StrategicDirective()

    def get_strategy_brief(self) -> Dict[str, Any]:
        """Provides high-level direction for all downstream agents."""
        return {
            "quarter": self.directive.quarter,
            "mission": self.directive.positioning,
            "primary_domain": self.directive.primary_domain,
            "bot_app": self.directive.bot_app,
            "target_kpis": self.directive.target_kpis,
            "viral_hook_formulas": self.directive.viral_hooks,
            "golden_rules": [
                "Hook in the first 90 characters: No fluff, immediate tension or mystery.",
                "Anti-brainrot high-status framing: Chess players are cerebral tacticians.",
                "1-Tap frictionless CTA: Direct deep link to Telegram Mini App or Blog on aumera.top.",
                "Zero deceptive hype: Authentic FOMO comes from real arena clocks, tournament cutoffs, and streak limits.",
                "Compliance non-negotiable: 18+ wager disclosures whenever stakes are mentioned.",
            ],
        }

    def review_slot_alignment(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        """Executive review of whether a content slot aligns with current CMO goals."""
        issues: List[str] = []
        category = entry.get("category", "")
        text = entry.get("text", "") or ""
        hook = entry.get("hook", "") or ""

        # Check domain routing
        if "aumera.top" not in brand.ALLOWED_LINK_HOSTS:
            issues.append("Primary domain aumera.top missing from whitelist")

        # Check hook impact
        if len(hook) > 110:
            issues.append(f"Hook too long for mobile preview ({len(hook)} chars > 110 max)")

        # Evaluate viral potential score (0 to 100)
        score = 70
        low = (text + " " + hook).lower()
        if any(trigger in low for trigger in ["clock", "mate", "trap", "arena", "streak", "seconds", "puzzle"]):
            score += 15
        if "<tg-spoiler>" in text or "reaction" in low or "❤" in text or "🔥" in text:
            score += 15

        return {
            "approved_by_cmo": len(issues) == 0,
            "viral_score": min(score, 100),
            "strategic_notes": issues if issues else ["Slot aligns with Q4 2026 Viral/FOMO directives"],
        }

    def generate_executive_report(self, planned_entries: List[Dict[str, Any]]) -> str:
        """Generates markdown summary of the marketing pipeline state."""
        report = [
            f"# Web3Chess & aumera.top CMO Executive Brief ({self.directive.quarter})",
            f"**Strategic Mission:** {self.directive.positioning}\n",
            "## Target KPI Benchmarks",
        ]
        for kpi, target in self.directive.target_kpis.items():
            report.append(f"- **{kpi.replace('_', ' ').title()}:** `{target}`")

        report.append("\n## Active Slot Inventory")
        for e in planned_entries:
            eid = e.get("id", "unknown")
            kind = e.get("kind", "")
            cat = e.get("category", "")
            status = e.get("status", "")
            time_utc = e.get("scheduled_at", "")[11:16]
            report.append(f"- `[{time_utc} UTC]` **{eid}** ({kind.upper()}) | Category: *{cat}* | Status: `{status}`")

        return "\n".join(report)
