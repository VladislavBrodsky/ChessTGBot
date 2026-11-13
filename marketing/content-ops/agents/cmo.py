"""CMO Agent: Chief Marketing Officer & Strategy Director.

Sets Viral & FOMO growth vectors, tone of voice, editorial standards, KPI benchmarks,
and exercises executive authority over campaign gates.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List

from pipeline import brand, gate, hygiene, qa, queue, renderer

REPEAT_DAYS = 45  # small audience: the same followers see every post, so a hook or body that ran in the last ~6 weeks is a repeat
# (2026-11-12 audit: on a 7-day window one Telegram post shipped 5 times and two others 4 times within a month)
DATE_BADGE = re.compile(r"\s*\([A-Z][a-z]{2} \d{1,2}\)\s*$")  # how the pools disguise a recycled hook

@dataclass
class StrategicDirective:
    quarter: str = "Q4 2026"
    positioning: str = "Make useful speed-chess practice and transparent adult competitive matches easy to discover inside Telegram."
    primary_domain: str = "web3chess.online"
    bot_app: str = "https://t.me/chess_matbot/Web3Chess"
    target_kpis: Dict[str, Any] = field(default_factory=lambda: {
        "telegram_ctr": "measure a complete-window baseline, then improve it",
        "viral_forward_rate": "measure forwards per reached user before setting a target",
        "first_game_conversion": "track handoff, authenticated arrival, and first game as separate stages",
        "returning_player_rate": "measure comparable 7-day cohorts before setting a target",
        "creative_render_success": "100% before review",
        "wager_rules_completion": "100% compliant",
        "x_bookmark_rate": "measure a complete-window baseline, then improve it",
        "x_reply_rate": "measure qualified replies, not raw engagement alone",
        "x_profile_click_rate": "measure profile visits and downstream handoffs separately",
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
            "formula": "Match Setup: 'Before you enter matching, check the stake, displayed payout, and time control.'",
            "pillar": "Product"
        },
        {
            "id": "VH3_SPECTATOR_DRAMA",
            "formula": "Clock Drama: 'Four seconds left. The natural recapture loses to one in-between check.'",
            "pillar": "Chess Culture"
        },
        {
            "id": "VH4_ANTI_BRAINROT",
            "formula": "Free Coach Challenge: 'One position. One decisive move. One explanation you can reuse.'",
            "pillar": "Academy"
        },
        {
            "id": "VH5_STREAK_LOSS_AVERSION",
            "formula": "Progress Hook: 'One reviewed pattern today makes tomorrow's calculation faster.'",
            "pillar": "Product"
        },
        {
            "id": "VH6_X_BOOKMARK_MAGNET",
            "formula": "Tactical Calculation: 'White to move. Every natural check loses. Find the only winning move.'",
            "pillar": "Tactics"
        },
        {
            "id": "VH7_X_TECH_MANIFESTO",
            "formula": "Product Architecture: 'Why the server, not the browser, owns the match state.'",
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
                "Zero deceptive hype: urgency may describe only a verified, current deadline or availability window.",
                "Compliance non-negotiable: 18+ wager disclosures whenever stakes are mentioned.",
                "X Docked Link Law: keep outbound links in Reply #1 or the final thread CTA so the root post stays readable.",
                "X Format Hygiene: 0-3 relevant hashtags, max 2 emojis, clean double-spacing between thoughts.",
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

    def recent_posts(self, entry: Dict[str, Any], now: datetime) -> List[Dict[str, Any]]:
        """Posts this channel has sent or committed to in the last REPEAT_DAYS, excluding the entry itself."""
        since = (now - timedelta(days=REPEAT_DAYS)).date().isoformat()
        kinds = {"telegram"} if entry.get("kind") == "telegram" else {"x_post", "x_thread"}
        return [e for e in queue.all_entries()
                if e.get("kind") in kinds and e["id"] != entry["id"] and since <= e.get("date", "") <= entry.get("date", "")
                and e.get("status") in {"approved", "publishing", "published"}]

    def review_for_release(self, entry: Dict[str, Any], now: datetime) -> Dict[str, Any]:
        """The CMO's release decision for one post: the strategic golden rules plus the editorial rule the pools break,
        that nothing recycled goes out as fresh content. Compliance, canvas and QA are the gate's job, not repeated here."""
        alignment = self.review_slot_alignment(entry)
        issues = [] if alignment["approved_by_cmo"] else list(alignment["strategic_notes"])
        hook = (entry.get("hook") or "").strip()
        if DATE_BADGE.search(hook):
            issues.append("hook is a recycled one disguised with a date badge")
        base = DATE_BADGE.sub("", hook).lower()
        text = qa.words(qa.plain(entry.get("text", "")))
        for other in self.recent_posts(entry, now):
            if base and DATE_BADGE.sub("", other.get("hook") or "").strip().lower() == base:
                issues.append(f"hook already ran in {other['id']} within {REPEAT_DAYS} days")
                break
            a, b = qa.shingles(text, 3), qa.shingles(qa.words(qa.plain(other.get("text", ""))), 3)
            if a and b and len(a & b) / len(a | b) > 0.45:
                issues.append(f"copy is near-identical to {other['id']}")
                break
        return {"approved": not issues, "issues": issues, "viral_score": alignment["viral_score"]}

    def release_review(self, entry: Dict[str, Any], now: datetime, dry_run: bool = False) -> Dict[str, Any]:
        """Approve a draft on the CMO's authority, or leave it a draft with the reasons. Returns {id, decision, reasons}.

        The approval is bound to the exact copy and canvas, so any later edit or template change voids it and the next
        review decides again. A draft already reviewed and refused in its current form is not re-argued every tick."""
        if entry.get("status") not in {"draft", "approved"} or hygiene.review_state(entry, now)[0] in {"legacy", "late", "cleared"}:
            return {"id": entry["id"], "decision": "skipped", "reasons": []}
        if gate.canvas_blockers(entry) and not dry_run:
            renderer.render(entry)  # the template moved on since this was drawn; approve the pixels that would ship
        key = {"content": gate.content_hash(entry), "canvas": (entry.get("render") or {}).get("canvas")}
        previous = entry.get("cmo_review") or {}
        if previous.get("approved") is False and {k: previous.get(k) for k in key} == key:
            return {"id": entry["id"], "decision": "held", "reasons": previous.get("issues", [])}
        reasons = gate.content_blockers(entry)
        verdict = self.review_for_release(entry, now) if not reasons else {"approved": False, "issues": reasons, "viral_score": None}
        if dry_run:
            return {"id": entry["id"], "decision": "would approve" if verdict["approved"] else "would refuse", "reasons": verdict["issues"]}
        entry["cmo_review"] = {**key, "approved": verdict["approved"], "issues": verdict["issues"],
                               "viral_score": verdict["viral_score"], "at": queue.iso(now)}
        if verdict["approved"]:
            entry["approval"] = gate.approval(entry, "agent:cmo")
            queue.set_status(entry, "approved", approved_by="agent:cmo")
        else:
            entry.pop("approval", None)
            queue.set_status(entry, "draft")
        return {"id": entry["id"], "decision": "approved" if verdict["approved"] else "refused", "reasons": verdict["issues"]}

    def release_day(self, now: datetime, days: int = 2, dry_run: bool = False) -> List[Dict[str, Any]]:
        """Run the release review over today's and the next days' drafts, earliest slot first."""
        out = []
        for offset in range(days):
            day = (now + timedelta(days=offset)).date().isoformat()
            for entry in queue.all_entries(day=day):
                if entry.get("kind") in hygiene.KINDS and entry.get("status") in {"draft", "approved"}:
                    decision = self.release_review(entry, now, dry_run)
                    if decision["decision"] != "skipped":
                        out.append(decision)
        return out

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
