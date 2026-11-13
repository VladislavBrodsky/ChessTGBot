"""YouTube creator discovery through the official YouTube Data API v3 (needs YOUTUBE_API_KEY).

search.list costs 100 quota units per call and channels.list 1 unit, so the default daily budget of
8 searches stays far below the free 10,000-unit quota. Queries rotate by day across languages, so
each run reaches creators the previous runs did not. No page scraping; business emails are not in
the API and stay a manual lookup (the About page "View email address" is behind a CAPTCHA).
"""
from __future__ import annotations

import json
import os
import re
from datetime import date, datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import scoring
import store

API = "https://www.googleapis.com/youtube/v3"
TME_RE = re.compile(r"t\.me/([A-Za-z][A-Za-z0-9_]{3,31})")
QUERIES = [
    ("en", "chess tactics"), ("en", "chess openings for beginners"), ("en", "chess puzzles"),
    ("en", "chess game analysis"), ("en", "chess improvement tips"), ("en", "blitz chess"),
    ("en", "chess endgame lesson"), ("en", "chess speedrun"), ("en", "chess telegram"),
    ("ru", "шахматы обучение"), ("ru", "шахматы дебюты"), ("ru", "шахматные задачи"), ("ru", "блиц шахматы"),
    ("es", "ajedrez aperturas"), ("es", "ajedrez táctica"), ("pt", "xadrez aberturas"), ("pt", "xadrez tática"),
    ("hi", "chess hindi"), ("tr", "satranç taktik"), ("id", "catur taktik"), ("fa", "شطرنج آموزش"),
    ("de", "schach eröffnung"), ("fr", "échecs ouverture"),
]


def _get(path: str, params: dict, opener=urlopen) -> dict:
    request = Request(f"{API}/{path}?{urlencode(params)}", headers={"Accept": "application/json"})
    with opener(request, timeout=20) as response:
        return json.loads(response.read(2_000_000).decode("utf-8"))


def todays_queries(n: int, today: date | None = None) -> list[tuple[str, str]]:
    today = today or date.today()
    start = (today.toordinal() * n) % len(QUERIES)
    return [QUERIES[(start + i) % len(QUERIES)] for i in range(min(n, len(QUERIES)))]


def channel_lead(item: dict, query_lang: str) -> dict:
    snip, stats = item.get("snippet", {}), item.get("statistics", {})
    subs = None if stats.get("hiddenSubscriberCount") else int(stats.get("subscriberCount") or 0) or None
    handle = (snip.get("customUrl") or item["id"]).lstrip("@")
    description = (snip.get("description") or "")[:500]
    videos = int(stats.get("videoCount") or 0)
    views = int(stats.get("viewCount") or 0)
    return {
        "platform": "youtube",
        "handle": handle.lower(),
        "url": f"https://www.youtube.com/{'@' + handle if snip.get('customUrl') else 'channel/' + item['id']}",
        "name": snip.get("title"),
        "segment": "youtube_chess_creator",
        "audience": subs,
        "audience_source": f"YouTube Data API {date.today().isoformat()}" if subs else None,
        # lifetime views per video is the only engagement proxy channels.list gives
        "median_views": (views // videos) if videos else None,
        "last_post_at": None,
        "posts_30d": None,
        "description": description,
        "relevance": scoring.relevance(snip.get("title"), description, []),
        "language": snip.get("defaultLanguage", "")[:2] or scoring.guess_language(snip.get("title"), description) or query_lang,
        "contact_route": scoring.contact_route(description, handle) or "youtube:about-page",
        "source": "youtube_api",
    }


def discover(db, key: str | None = None, searches: int = 8, min_subs: int = 1_000, max_subs: int = 500_000,
             opener=urlopen, today: date | None = None) -> dict:
    key = key or os.environ.get("YOUTUBE_API_KEY")
    stats = {"requests": 0, "profiled": 0, "new_leads": 0, "frontier_added": 0, "skipped": 0, "errors": 0}
    if not key:
        stats["note"] = "YOUTUBE_API_KEY not set; YouTube discovery skipped"
        return stats
    for lang, query in todays_queries(searches, today):
        try:
            found = _get("search", {"part": "snippet", "type": "channel", "q": query, "maxResults": 25,
                                    "relevanceLanguage": lang, "key": key}, opener)
            stats["requests"] += 1
            ids = [i["id"]["channelId"] for i in found.get("items", []) if i.get("id", {}).get("channelId")]
            if not ids:
                continue
            details = _get("channels", {"part": "snippet,statistics", "id": ",".join(ids), "key": key}, opener)
            stats["requests"] += 1
        except Exception as exc:
            stats["errors"] += 1
            stats["note"] = f"YouTube API error: {type(exc).__name__}"
            continue
        for item in details.get("items", []):
            lead = channel_lead(item, lang)
            stats["profiled"] += 1
            subs = lead["audience"] or 0
            if lead["relevance"] < 0.3 or not (min_subs <= subs <= max_subs) or scoring.negative(lead["name"], lead["description"]):
                stats["skipped"] += 1
                continue
            lead["discovered_from"] = f"yt-search:{query}"
            stats["new_leads"] += store.upsert(db, lead)
            # creators often list their Telegram channel: feed it to the Telegram snowball
            for handle in scoring.HANDLE_RE.findall(lead["description"]) + [
                    m.group(1) for m in TME_RE.finditer(lead["description"])]:
                stats["frontier_added"] += store.add_frontier(db, "telegram", handle, f"yt:{lead['handle']}", 1)
        db.commit()
    return stats
