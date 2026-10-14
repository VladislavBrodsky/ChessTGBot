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
    primary_domain: str = "web3chess.online"
    bot_app: str = "https://t.me/chess_matbot/Web3Chess"
    target_kpis: Dict[str, Any] = field(default_factory=lambda: {
        "telegram_ctr": ">= 8.5%",
        "viral_forward_rate": ">= 4.0%",
        "first_game_conversion": ">= 18.0%",
        "daily_active_streakers": ">= 25.0%",
        "wager_rules_completion": "100% compliant",
        "x_bookmark_rate": ">= 2.5%",
        "x_reply_rate": ">= 1.5%",
        "x_profile_click_rate": ">= 2.0%",
        "x_docked_link_compliance": "100%",
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
        },
        {
            "id": "VH6_X_BOOKMARK_MAGNET",
            "formula": "Tactical Calculation: 'White to move. Every natural check loses. Find the only winning move.'",
            "pillar": "Tactics"
        },
        {
            "id": "VH7_X_TECH_MANIFESTO",
            "formula": "Sub-100ms Tech Architecture: 'Why tap-to-earn died and how real-time WebSockets powered skill gaming.'",
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
                "Hook Punctuation Law: NEVER end hooks or headlines with a period ('.'); keep them open, punchy, or end with '?' to preserve curiosity momentum.",
                "Anti-brainrot high-status framing: Chess players are cerebral tacticians.",
                "1-Tap frictionless CTA: Direct deep link to Telegram Mini App or Blog on web3chess.online.",
                "Zero deceptive hype: Authentic FOMO comes from real arena clocks, tournament cutoffs, and streak limits.",
                "Compliance non-negotiable: 18+ wager disclosures whenever stakes are mentioned.",
                "X Docked Link Law: Zero outbound links in root tweets; links belong in Reply #1 or final thread CTA to preserve 2x algorithmic reach.",
                "X Format Hygiene: Max 1 hashtag, max 2 emojis, clean double-spacing between thoughts.",
            ],
        }

    def review_slot_alignment(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        """Executive review of whether a content slot aligns with current CMO goals across Telegram and X."""
        issues: List[str] = []
        kind = entry.get("kind", "telegram")
        category = entry.get("category", "")
        text = entry.get("text", "") or ""
        hook = entry.get("hook", "") or ""

        # Check domain routing
        if self.directive.primary_domain not in brand.ALLOWED_LINK_HOSTS:
            issues.append(f"Primary domain {self.directive.primary_domain} missing from whitelist")

        # Check hook impact
        if len(hook) > 110:
            issues.append(f"Hook too long for mobile preview ({len(hook)} chars > 110 max)")
        if hook.rstrip().endswith("."):
            issues.append("Hook must never end with a period ('.')")

        score = 70
        low = (text + " " + hook).lower()

        if kind in ("x_post", "x_thread"):
            # X Specific Golden Rules
            if kind == "x_post":
                if "http" in text:
                    issues.append("Root tweet violates Docked Link Law; outbound URLs belong in docked reply")
                if len(text) > 280:
                    issues.append(f"Tweet exceeds 280-char limit ({len(text)} chars)")
            elif kind == "x_thread":
                tweets = entry.get("tweets", [])
                if not tweets:
                    issues.append("Thread must have at least 1 tweet")
                for idx, t in enumerate(tweets, start=1):
                    t_text = t.get("text", "")
                    if len(t_text) > 265:
                        issues.append(f"Thread tweet {idx}/{len(tweets)} exceeds safe 265-char limit ({len(t_text)} chars)")
            creative = entry.get("creative")
            if creative and creative.get("size") != "square":
                issues.append(f"X creative must use 1:1 format (size='square'); got '{creative.get('size')}'")

            # X Viral & Bookmark score triggers
            if any(trigger in low for trigger in ["clock", "mate", "trap", "arena", "streak", "seconds", "puzzle", "white to move", "only move"]):
                score += 15
            if "?" in hook or "🧵" in text or entry.get("docked_reply"):
                score += 15
        else:
            # Telegram Specific triggers
            if any(trigger in low for trigger in ["clock", "mate", "trap", "arena", "streak", "seconds", "puzzle"]):
                score += 15
            if "<tg-spoiler>" in text or "reaction" in low or "❤" in text or "🔥" in text:
                score += 15

        notes = issues if issues else [
            f"Slot aligns with Q4 2026 Viral/FOMO directives on {kind.upper()}"
        ]

        return {
            "approved_by_cmo": len(issues) == 0,
            "viral_score": min(score, 100),
            "strategic_notes": notes,
        }

    def generate_executive_report(self, planned_entries: List[Dict[str, Any]]) -> str:
        """Generates markdown summary of the marketing pipeline state."""
        report = [
            f"# Web3Chess CMO Executive Brief ({self.directive.quarter})",
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
