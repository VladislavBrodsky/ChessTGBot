"""Publisher & Distribution Agent.

Manages staging of verified Blog articles into website/src/content/articles/ (for web3chess.online)
and coordinates Telegram broadcast dispatching with receipts and idempotent state tracking.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from pipeline import queue, site_publisher, telegram_publisher


class PublisherAgent:
    """Safely stages web articles and dispatches Telegram broadcasts."""

    def __init__(self):
        pass

    def stage_article_to_blog(self, entry: Dict[str, Any], reviewer: str = "auto-qa:cmo-pipeline", overwrite: bool = True) -> Dict[str, Any]:
        """Stages an approved article entry into website/src/content/articles/."""
        try:
            target_path = site_publisher.stage(entry, reviewed_by=reviewer, overwrite=overwrite)
            queue.set_status(entry, "published", staged_path=str(target_path.relative_to(queue.ROOT)))
            return {
                "success": True,
                "staged_path": str(target_path),
                "slug": entry.get("article", {}).get("slug"),
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "slug": entry.get("article", {}).get("slug"),
            }

    def stage_all_approved_articles(self, day: Optional[str] = None, reviewer: str = "auto-qa:cmo-pipeline", overwrite: bool = True) -> List[Dict[str, Any]]:
        """Stages all approved articles in queue into website/src/content/articles/."""
        results = []
        for entry in queue.all_entries(day=day):
            if entry.get("kind") == "article" and entry.get("status") in {"approved", "published"}:
                res = self.stage_article_to_blog(entry, reviewer=reviewer, overwrite=overwrite)
                results.append(res)
        return results

    def dispatch_telegram_broadcast(self, dry_run: bool = True) -> Dict[str, Any]:
        """Dispatches due approved Telegram posts and scheduled reveals."""
        posts = telegram_publisher.publish_due(dry_run=dry_run)
        reveals = telegram_publisher.publish_reveals(dry_run=dry_run)
        return {
            "dry_run": dry_run,
            "posts_dispatched": posts,
            "reveals_dispatched": reveals,
        }
