"""Publisher & Distribution Agent.

Manages staging of verified Blog articles into website/src/content/articles/ (for web3chess.online)
and coordinates Telegram broadcast dispatching with receipts and idempotent state tracking.
"""
from __future__ import annotations

import json
import logging
from datetime import timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from pipeline import queue, site_publisher, telegram_publisher

logger = logging.getLogger(__name__)


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
        due_only: bool = True,
        limit: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Dispatches or dry-run previews approved X (Twitter) posts and threads."""
        entries = []
        now_iso = queue.iso(queue.utcnow())
        earliest_due = queue.iso(queue.utcnow() - timedelta(hours=3))
        day = day or now_iso[:10]
        published_today = sum(1 for entry in queue.all_entries(day=day)
                              if entry.get("kind") in ("x_post", "x_thread") and entry.get("status") == "published")
        remaining = max(0, len(queue.CONFIG["x"]["slots_utc"]) - published_today)
        if remaining == 0:
            return {"dry_run": dry_run, "count": 0, "entries": [], "reason": "daily cap reached"}
        last_sent = max(((entry.get("published") or {}).get("at", "") for entry in queue.all_entries()
                         if entry.get("kind") in ("x_post", "x_thread") and entry.get("status") == "published"), default="")
        if last_sent and last_sent > earliest_due:
            return {"dry_run": dry_run, "count": 0, "entries": [], "reason": "three-hour spacing active"}
        limit = min(limit or 1, remaining)
        for entry in queue.all_entries(day=day):
            if entry.get("kind") not in ("x_post", "x_thread"):
                continue
            if not (entry.get("qa") or {}).get("passed"):
                continue
            if not entry.get("scheduled_at") or entry["scheduled_at"] < earliest_due:
                continue
            if post_id:
                if entry.get("id") != post_id:
                    continue
                if entry.get("status") != "approved":
                    continue
                if due_only and entry.get("scheduled_at") and entry["scheduled_at"] > now_iso:
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
                        root_id = res.get("root_id") or (res.get("data") or {}).get("id")
                        root_url = res.get("root_url") or (f"https://x.com/defi_ambassador/status/{root_id}" if root_id else None)
                        queue.set_status(e, "published", published={"root_id": root_id, "root_url": root_url, "at": queue.iso(queue.utcnow())})

                        # Immediately delete rendered image from disk and clear memory
                        try:
                            from pipeline import cleanup
                            cleanup.cleanup_post_media(e)
                        except Exception as clean_err:
                            logger.warning(f"Failed to cleanup media for {eid}: {clean_err}")

                        # Cross-pollinate to Telegram channel only if explicitly requested
                        if root_url and e.get("cross_post_tg", False):
                            try:
                                hook = e.get("hook") or e.get("topic") or e.get("text", "")[:80]
                                tg_res = telegram_publisher.notify_x_post_in_channel(
                                    post_id=eid,
                                    hook=hook,
                                    x_url=root_url,
                                    dry_run=dry_run,
                                )
                                item["tg_cross_post"] = tg_res
                            except Exception as tg_err:
                                logger.warning(f"Failed to cross-post X post to Telegram: {tg_err}")
                    except x_publisher.DockedReplyError as err:
                        item["status"] = "partially_published"
                        item["root_id"] = err.root_id
                        item["error"] = str(err)
                        queue.set_status(e, "failed", published_root_id=err.root_id, last_error=str(err)[:200])
                    except Exception as err:
                        item["status"] = "failed"
                        item["error"] = str(err)
                        queue.set_status(e, "failed", last_error=str(err)[:200])
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
                    img_path = e.get("image")
                    if not img_path and e.get("creative"):
                        cand = queue.QUEUE / e.get("date", eid[:10]) / f"{eid}.png"
                        if cand.exists():
                            img_path = str(cand)
                    if img_path:
                        p = Path(img_path)
                        if not p.is_absolute():
                            if (queue.ROOT / p).exists():
                                img_path = str(queue.ROOT / p)
                            elif (queue.HERE / p).exists():
                                img_path = str(queue.HERE / p)

                    queue.set_status(e, "publishing")
                    try:
                        from pipeline import x_publisher
                        tweet_texts = [t.get("text") for t in e.get("tweets", [])]
                        existing_ids = e.get("published_tweet_ids") or (e.get("published") or {}).get("all_ids")
                        res = x_publisher.post_thread(
                            tweet_texts,
                            image_path=img_path,
                            existing_ids=existing_ids,
                        )
                        item["receipt"] = res
                        item["status"] = "published"
                        e["x_receipt"] = res
                        root_id = res.get("root_id")
                        root_url = res.get("root_url") or (f"https://x.com/defi_ambassador/status/{root_id}" if root_id else None)
                        queue.set_status(e, "published", published={"root_id": root_id, "root_url": root_url, "all_ids": res.get("all_ids"), "at": queue.iso(queue.utcnow())})

                        # Immediately delete rendered image from disk and clear memory
                        try:
                            from pipeline import cleanup
                            cleanup.cleanup_post_media(e)
                        except Exception as clean_err:
                            logger.warning(f"Failed to cleanup media for thread {eid}: {clean_err}")

                        # Cross-pollinate to Telegram channel only if explicitly requested
                        if root_url and e.get("cross_post_tg", False):
                            try:
                                hook = e.get("topic") or tweet_texts[0][:80]
                                tg_res = telegram_publisher.notify_x_post_in_channel(
                                    post_id=eid,
                                    hook=hook,
                                    x_url=root_url,
                                    dry_run=dry_run,
                                )
                                item["tg_cross_post"] = tg_res
                            except Exception as tg_err:
                                logger.warning(f"Failed to cross-post X thread to Telegram: {tg_err}")
                    except x_publisher.ThreadPublishError as t_err:
                        item["status"] = "partially_published"
                        item["error"] = str(t_err)
                        e["published_tweet_ids"] = t_err.published_ids
                        queue.set_status(e, "failed", published_tweet_ids=t_err.published_ids, last_error=str(t_err)[:200])
                    except Exception as err:
                        item["status"] = "failed"
                        item["error"] = str(err)
                        queue.set_status(e, "failed", last_error=str(err)[:200])

            dispatched.append(item)

        return {
            "dry_run": dry_run,
            "count": len(dispatched),
            "entries": dispatched,
        }

