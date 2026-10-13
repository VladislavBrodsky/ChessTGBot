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

    def dispatch_telegram_broadcast(self, dry_run: bool = True, day: Optional[str] = None, post_id: Optional[str] = None) -> Dict[str, Any]:
        """Dispatches due approved Telegram posts and scheduled reveals."""
        if post_id:
            res = telegram_publisher.publish_post_by_id(post_id, dry_run=dry_run)
            return {
                "dry_run": dry_run,
                "posts_dispatched": [res],
                "reveals_dispatched": [],
            }
        posts = telegram_publisher.publish_due(dry_run=dry_run, day=day)
        reveals = telegram_publisher.publish_reveals(dry_run=dry_run)
        return {
            "dry_run": dry_run,
            "posts_dispatched": posts,
            "reveals_dispatched": reveals,
        }

    def dispatch_x_posts(
        self,
        day: Optional[str] = None,
        post_id: Optional[str] = None,
        dry_run: bool = True,
        due_only: bool = False,
        limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Dispatches or dry-run previews approved X (Twitter) posts and threads."""
        entries = []
        now_iso = queue.iso(queue.utcnow())
        for entry in queue.all_entries(day=day):
            if entry.get("kind") not in ("x_post", "x_thread"):
                continue
            if post_id:
                if entry.get("id") != post_id:
                    continue
            else:
                if entry.get("status") != "approved":
                    continue
                if due_only and entry.get("scheduled_at") and entry["scheduled_at"] > now_iso:
                    continue
            entries.append(entry)
            if limit and len(entries) >= limit:
                break

        dispatched = []
        for e in entries:
            kind = e.get("kind")
            eid = e.get("id")
            if kind == "x_post":
                img_path = e.get("image")
                if not img_path and e.get("creative"):
                    # Check if rendered file exists in queue/<day>/<id>.png
                    cand = queue.QUEUE / e["date"] / f"{eid}.png"
                    if cand.exists():
                        img_path = str(cand)
                if img_path:
                    p = Path(img_path)
                    if not p.is_absolute():
                        if (queue.ROOT / p).exists():
                            img_path = str(queue.ROOT / p)
                        elif (queue.HERE / p).exists():
                            img_path = str(queue.HERE / p)

                item = {
                    "id": eid,
                    "kind": "x_post",
                    "tweet_text": e.get("text"),
                    "char_count": len(e.get("text", "")),
                    "docked_reply": (e.get("docked_reply") or {}).get("text"),
                    "creative_template": (e.get("creative") or {}).get("template"),
                    "image": img_path,
                    "status": "ready_to_publish" if dry_run else "pending",
                }

                if not dry_run:
                    queue.set_status(e, "publishing")
                    try:
                        from pipeline import x_publisher
                        docked_text = (e.get("docked_reply") or {}).get("text")
                        if docked_text:
                            res = x_publisher.post_tweet_with_docked_reply(
                                root_text=e["text"],
                                reply_text=docked_text,
                                image_path=img_path,
                            )
                        else:
                            res = x_publisher.post_tweet(
                                text=e["text"],
                                image_path=img_path,
                            )
                        item["receipt"] = res
                        item["status"] = "published"
                        e["x_receipt"] = res
                        queue.set_status(e, "published", published={"root_id": res.get("root_id"), "at": queue.iso(queue.utcnow())})
                    except Exception as err:
                        item["status"] = "failed"
                        item["error"] = str(err)
                        queue.set_status(e, "approved", last_error=str(err)[:200])
            else:
                item = {
                    "id": eid,
                    "kind": "x_thread",
                    "topic": e.get("topic"),
                    "tweets_count": len(e.get("tweets", [])),
                    "tweets": [t.get("text") for t in e.get("tweets", [])],
                    "status": "ready_to_publish" if dry_run else "pending",
                }

                if not dry_run:
                    queue.set_status(e, "publishing")
                    try:
                        from pipeline import x_publisher
                        tweet_texts = [t.get("text") for t in e.get("tweets", [])]
                        res = x_publisher.post_thread(tweet_texts)
                        item["receipt"] = res
                        item["status"] = "published"
                        e["x_receipt"] = res
                        queue.set_status(e, "published", published={"root_id": res.get("root_id"), "at": queue.iso(queue.utcnow())})
                    except Exception as err:
                        item["status"] = "failed"
                        item["error"] = str(err)
                        queue.set_status(e, "approved", last_error=str(err)[:200])

            dispatched.append(item)

        return {
            "dry_run": dry_run,
            "count": len(dispatched),
            "entries": dispatched,
        }

