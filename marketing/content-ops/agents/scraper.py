"""Scraper & Trend Scout Agent.

Automates ethical web scraping, RSS/Atom feed ingestion, and public Telegram channel monitoring
to discover trending tactical positions, viral chess controversies, and speed chess memes.
"""
from __future__ import annotations

import json
from argparse import Namespace
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from pipeline import queue
import content_ops
import telegram_public

HERE = Path(__file__).resolve().parent
SOURCES_FILE = HERE.parent / "sources.json"


class ScraperAgent:
    """Discovers viral trends, tactical ideas, and competitive benchmarks."""

    def __init__(self, sources_path: Path = SOURCES_FILE):
        self.sources_path = sources_path
        self.sources: Dict[str, Any] = {}
        if self.sources_path.exists():
            try:
                self.sources = json.loads(self.sources_path.read_text())
            except Exception:
                self.sources = {}

    def fetch_feed_trends(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Collects latest articles and tactical items from authorized RSS/Atom feeds."""
        feed_sources = self.sources.get("sources", [])
        report = content_ops.collect(
            Namespace(days=2, output=str(HERE.parent / "state" / "latest-feed-intel.json")),
            sources=feed_sources,
            quiet=True,
        )
        self.feed_status = report["sources"]
        return report["candidates"][:limit]

    def inspect_telegram_competitors(self, channels: List[str] | None = None) -> List[Dict[str, Any]]:
        """Gathers engagement benchmarks from public Telegram previews."""
        target_channels = channels or ["chesscom_ru", "edchessss"]
        discovered = []
        self.competitor_failures = []
        fetcher = telegram_public.PoliteFetcher()
        for ch in target_channels:
            try:
                page = telegram_public.parse_page(fetcher(telegram_public.page_url(ch)), ch)
                for p in page["posts"]:
                    discovered.append({
                        "channel": ch,
                        "text": p.get("text", "")[:300],
                        "permalink": p.get("permalink"),
                        "views": p.get("views"),
                        "reactions": p.get("reactions", {}),
                        "published_at": p.get("posted_at"),
                    })
            except Exception as exc:
                self.competitor_failures.append({"channel": ch, "error": str(exc)[:160]})
                continue
        return discovered

    def get_curated_trend_signals(self) -> List[Dict[str, Any]]:
        """Returns evergreen editorial candidates; public performance is never implied."""
        return [
            {
                "topic": "The Stafford Gambit Refutation Debate",
                "category": "Openings",
                "viral_angle": "Why speed-chess players still fall into 1.e4 e5 2.Nf3 Nf6 3.Nxe5 Nc6 traps at 3-minute blitz.",
                "relevance_score": 94,
                "fen": "r1bqkb1r/pppp1ppp/2n5/4P3/4n3/5N2/PPP2PPP/RNBQKB1R w KQkq - 1 5",
            },
            {
                "topic": "The 10-Second Flagging Dilemma: Delay vs Increment",
                "category": "Chess Culture",
                "viral_angle": "When pre-moves help, when they fail, and how delay differs from increment.",
                "relevance_score": 88,
                "fen": "8/8/4k3/8/8/4K3/5P2/8 w - - 0 1",
            },
            {
                "topic": "Smothered Mate Queen Sacrifices in Telegram PvP",
                "category": "Tactics",
                "viral_angle": "The ultimate aesthetic finish: sacrificing a queen to trap the enemy king with its own pieces.",
                "relevance_score": 96,
                "fen": "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
            },
            {
                "topic": "From Match Setup to the Board",
                "category": "Product",
                "viral_angle": "Show the choices a player reviews before matching in the Telegram Mini App.",
                "relevance_score": 91,
                "fen": None,
            },
        ]
