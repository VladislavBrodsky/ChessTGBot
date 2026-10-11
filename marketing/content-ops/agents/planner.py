"""Content Planner & Calendar Agent.

Architects the multi-slot daily distribution schedule, balancing educational authority,
viral debate, and high-urgency FOMO tournament drops. Synchronizes Telegram with the Blog on aumera.top.
"""
from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List

from pipeline import queue

SLOT_SCHEDULE = [
    {
        "slot": 1,
        "utc_time": "07:30",
        "pillar": "Tactics",
        "objective": "Morning Tactician Quiz: Habit formation, daily engagement spike via emoji reactions.",
        "template": "puzzle",
        "format": "puzzle",
    },
    {
        "slot": 2,
        "utc_time": "11:00",
        "pillar": "Chess News",
        "objective": "Trend / Controversy: Timely FIDE/tournament news with concrete board takeaway.",
        "template": "news",
        "format": "news",
    },
    {
        "slot": 3,
        "utc_time": "14:30",
        "pillar": "Openings",
        "objective": "Trap Survival / Academy: Practical 3-minute blitz defense against common traps.",
        "template": "trap",
        "format": "trap",
    },
    {
        "slot": 4,
        "utc_time": "17:30",
        "pillar": "Chess Culture",
        "objective": "Spectator Thrill: Brutal time-scramble blunders, GM brilliancies, relatable memes.",
        "template": "culture",
        "format": "culture",
    },
    {
        "slot": 5,
        "utc_time": "20:30",
        "pillar": "Product",
        "objective": "Peak FOMO Arena Alert: Synchronized daily tournament drop ($500 Vault), countdown timer.",
        "template": "product",
        "format": "product",
    },
]


class PlannerAgent:
    """Manages the daily calendar and queue orchestration."""

    def __init__(self, plan_date: date | None = None):
        self.plan_date = plan_date or queue.utcnow().date()

    def generate_daily_plan(self, target_date: date | None = None) -> List[Dict[str, Any]]:
        """Ensures both Telegram and Blog slots exist for the given day in queue."""
        d = target_date or self.plan_date
        tg_entries = queue.plan_day(d, "telegram")
        art_entries = queue.plan_day(d, "article")
        return tg_entries + art_entries

    def get_slot_blueprint(self, slot_number: int) -> Dict[str, Any]:
        """Returns the strategic blueprint for a specific daily slot."""
        for s in SLOT_SCHEDULE:
            if s["slot"] == slot_number:
                return s
        return SLOT_SCHEDULE[0]

    def describe_weekly_cadence(self) -> str:
        """Outputs an ASCII schedule matrix of the 7-day plan."""
        lines = [
            "## Weekly Multi-Slot Broadcast Cadence (Q4 2026)",
            "| Slot | Time (UTC) | Focus Area | Engagement Trigger |",
            "| :--- | :--- | :--- | :--- |",
        ]
        for s in SLOT_SCHEDULE:
            lines.append(f"| S{s['slot']} | {s['utc_time']}Z | {s['pillar']} | {s['objective'][:50]}... |")
        return "\n".join(lines)
