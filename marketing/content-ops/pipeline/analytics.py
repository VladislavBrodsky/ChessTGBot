"""Real-Time Performance Analytics & Lead Generation Auditor.

Tracks live impression counts, engagement rates, bookmark ratios, and follower velocity
across X (Twitter) and Telegram to power the CMO Agent's dynamic strategy feedback loop.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests

from . import queue, x_publisher, telegram_publisher

logger = logging.getLogger("analytics")

STATE_DIR = Path(__file__).resolve().parents[1] / "state"
METRICS_FILE = STATE_DIR / "performance_metrics.json"


def fetch_x_metrics(limit: int = 20) -> Dict[str, Any]:
    """Fetches live public metrics for recent tweets and account follower count."""
    try:
        auth = x_publisher.get_oauth1_auth()
        # 1. Account profile metrics
        user_res = requests.get(
            "https://api.x.com/2/users/me?user.fields=public_metrics,description,created_at",
            auth=auth,
            timeout=10,
        )
        if not user_res.ok:
            return {"account": {}, "recent_tweets": [], "error": f"account_http_{user_res.status_code}"}
        user_data = user_res.json().get("data", {})
        if not user_data.get("id"):
            return {"account": {}, "recent_tweets": [], "error": "account_data_unavailable"}

        # 2. Recent tweet metrics
        uid = user_data.get("id")
        tweets_metrics = []
        t_res = requests.get(
            f"https://api.x.com/2/users/{uid}/tweets?max_results={min(limit, 100)}&tweet.fields=public_metrics,created_at,text",
            auth=auth,
            timeout=10,
        )
        if not t_res.ok:
            return {"account": user_data, "recent_tweets": [], "error": f"tweets_http_{t_res.status_code}"}
        tweets_metrics = t_res.json().get("data", [])

        return {
            "account": {
                "username": user_data.get("username"),
                "name": user_data.get("name"),
                "followers": (user_data.get("public_metrics") or {}).get("followers_count", 0),
                "following": (user_data.get("public_metrics") or {}).get("following_count", 0),
                "tweet_count": (user_data.get("public_metrics") or {}).get("tweet_count", 0),
            },
            "recent_tweets": tweets_metrics,
            "available": True,
        }
    except Exception as e:
        logger.warning("Error fetching live X metrics: %s", type(e).__name__)
        return {"account": {}, "recent_tweets": [], "error": type(e).__name__}


def fetch_telegram_metrics() -> Dict[str, Any]:
    """Fetches channel subscriber count and chat metrics."""
    token, channel = telegram_publisher._credentials()
    if not token or not channel:
        return {"members": None, "configured": False, "available": False}
    try:
        res = requests.get(
            f"https://api.telegram.org/bot{token}/getChatMemberCount?chat_id={channel}",
            timeout=10,
        )
        count = res.json().get("result") if res.ok else None
        return {"channel": channel, "members": count, "configured": True, "available": isinstance(count, int)}
    except Exception as e:
        # Request exceptions can embed the bot token in their URL.
        logger.warning("Error fetching Telegram metrics: %s", type(e).__name__)
        return {"members": None, "configured": True, "available": False, "error": type(e).__name__}


def audit_performance() -> Dict[str, Any]:
    """Compiles a full lead generation and audience reach audit report."""
    now_iso = queue.iso(queue.utcnow())
    x_data = fetch_x_metrics(limit=25)
    tg_data = fetch_telegram_metrics()

    tweets = x_data.get("recent_tweets", [])
    total_impressions = sum(t.get("public_metrics", {}).get("impression_count", 0) for t in tweets)
    total_likes = sum(t.get("public_metrics", {}).get("like_count", 0) for t in tweets)
    total_replies = sum(t.get("public_metrics", {}).get("reply_count", 0) for t in tweets)
    total_retweets = sum(t.get("public_metrics", {}).get("retweet_count", 0) for t in tweets)
    total_bookmarks = sum(t.get("public_metrics", {}).get("bookmark_count", 0) for t in tweets)

    x_available = bool(x_data.get("available"))
    avg_impressions = round(total_impressions / len(tweets), 1) if tweets else (0 if x_available else None)
    engagement_rate = (
        round(((total_likes + total_replies + total_retweets + total_bookmarks) / max(total_impressions, 1)) * 100, 2)
        if total_impressions > 0 else (0.0 if x_available else None)
    )

    # Correlate with queue entries to identify top-performing categories
    published_entries = [
        e for e in queue.all_entries()
        if e.get("kind") in ("x_post", "x_thread") and e.get("status") == "published"
    ]

    report = {
        "timestamp": now_iso,
        "x_reach": {
            "available": x_available,
            "error": x_data.get("error"),
            "account": x_data.get("account", {}),
            "tracked_tweets_count": len(tweets) if x_available else None,
            "total_impressions": total_impressions if x_available else None,
            "avg_impressions_per_tweet": avg_impressions,
            "total_likes": total_likes if x_available else None,
            "total_replies": total_replies if x_available else None,
            "total_retweets": total_retweets if x_available else None,
            "total_bookmarks": total_bookmarks if x_available else None,
            "engagement_rate_pct": engagement_rate,
        },
        "telegram_reach": tg_data,
        "cmo_strategic_assessment": {
            "account_stage": "Measure from the connected account before assigning a growth stage",
            "primary_bottleneck": "Compare complete-window reach, handoffs, authenticated arrivals, and first games before assigning a bottleneck.",
            "recommended_growth_vectors": [
                "Answer relevant chess discussions with useful analysis and measure qualified visits.",
                "Share a reviewed puzzle across X and Telegram, then compare attributed handoffs by channel.",
                "Optimize Profile Landing Page: use a Web3Chess banner, a clear value proposition, and a pinned product walkthrough.",
                "Test puzzle and clock-decision formats against comparable windows before scaling them.",
            ],
        },
    }

    try:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        METRICS_FILE.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    except Exception as e:
        logger.warning(f"Could not persist performance report: {e}")

    return report
