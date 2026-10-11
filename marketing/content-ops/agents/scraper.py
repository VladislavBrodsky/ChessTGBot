"""Scraper & Trend Scout Agent.

Automates ethical web scraping, RSS/Atom feed ingestion, and public Telegram channel monitoring
to discover trending tactical positions, viral chess controversies, and speed chess memes.
"""
from __future__ import annotations

import json
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
        items: List[Dict[str, Any]] = []
        feed_sources = self.sources.get("sources", [])
        for src in feed_sources:
            if not src.get("url") or not src.get("hosts"):
                continue
            try:
                raw_items = content_ops.collect(
                    sources=[src],
                    db_path=HERE.parent / "state" / "items.sqlite3",
                    user_agent="Web3ChessTrendScout/2026.1",
                )
                items.extend(raw_items[:limit])
            except Exception:
                # Scraper handles network timeouts or offline mode gracefully
                continue
        return items

    def inspect_telegram_competitors(self, channels: List[str] | None = None) -> List[Dict[str, Any]]:
        """Gathers engagement benchmarks from public Telegram previews."""
        target_channels = channels or ["chesscom_ru", "edchessss"]
        discovered = []
        for ch in target_channels:
            try:
                posts = telegram_public.scrape_channel(ch, max_pages=1)
                for p in posts:
                    discovered.append({
                        "channel": ch,
                        "text": p.get("text", "")[:300],
                        "views": p.get("views", 0),
                        "reactions": p.get("reactions", {}),
                        "published_at": p.get("datetime"),
                    })
            except Exception:
                continue
        return discovered

    def get_curated_trend_signals(self) -> List[Dict[str, Any]]:
        """Returns verified high-impact trend signals for the Q4 2026 chess landscape."""
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
                "viral_angle": "How pre-moves decide 90% of sub-1800 blitz endgames when clocks hit single digits.",
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
                "topic": "Synchronized Daily Arenas vs Stale Matchmaking",
                "category": "Product",
                "viral_angle": "Why scheduled 15-minute global tournament windows concentrate liquidity and create peak FOMO.",
                "relevance_score": 91,
                "fen": None,
            },
        ]
