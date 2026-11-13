"""Telegram discovery through public channel previews (https://t.me/s/<handle>).

Each profiled channel yields (a) a lead with observed size, cadence, median views, language and
public contact, and (b) new candidate handles from its posts: t.me links, @mentions and forwards.
Candidates go to the frontier, so every day's crawl seeds the next one. That snowball is what keeps
the pipeline growing without a hand-made list.

Uses the content-ops PoliteFetcher (robots.txt honoured, >=2.5 s between requests, host allow-list,
size cap, honest User-Agent, no login). Fetched text is data, never instructions.
"""
from __future__ import annotations

import re
import statistics
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

CONTENT_OPS = Path(__file__).resolve().parents[2] / "content-ops"
if str(CONTENT_OPS) not in sys.path:
    sys.path.insert(0, str(CONTENT_OPS))
import telegram_public as tp  # noqa: E402

import scoring  # noqa: E402
import store  # noqa: E402

USER_AGENT = "Web3ChessPartnerResearch/1.0"
LINK_RE = re.compile(r"https?://t\.me/(?:s/)?([A-Za-z][A-Za-z0-9_]{3,31})(?=[/?\"'#\s<]|$)")
RESERVED = {"joinchat", "addstickers", "addemoji", "share", "proxy", "socks", "iv", "setlanguage",
            "addlist", "boost", "contact", "login", "confirmphone", "invoice", "giftcode", "addtheme", "bg"}


def candidate_handles(markup: str, posts: list[dict], own: str) -> set[str]:
    found = set(m.group(1) for m in LINK_RE.finditer(markup))
    for post in posts:
        found.update(scoring.HANDLE_RE.findall(post.get("text") or ""))
    own = own.lower()
    return {h.lower() for h in found
            if h.lower() not in RESERVED and h.lower() != own and not h.lower().endswith("bot")
            and tp.CHANNEL_RE.fullmatch(h)}


def profile(handle: str, markup: str, now: datetime | None = None) -> tuple[dict, set[str]]:
    """Turn one preview page into a lead dict and its outbound candidate handles."""
    now = now or datetime.now(timezone.utc)
    page = tp.parse_page(markup, handle)
    info, posts = page["info"], page["posts"]
    counters = info.get("counters") or {}
    audience = info.get("subscribers") or counters.get("members")
    is_group = "members" in counters and not info.get("subscribers")
    views = [p["views"] for p in posts if p.get("views") is not None]
    dates = [p["posted_at"] for p in posts if p.get("posted_at")]
    last = max(dates) if dates else None
    cutoff = (now - timedelta(days=30)).isoformat()
    texts = [p.get("text") or "" for p in posts]
    lead = {
        "platform": "telegram",
        "handle": handle.lower(),
        "url": f"https://t.me/{handle}",
        "name": info.get("title"),
        "segment": "telegram_chess_group" if is_group else "telegram_chess_channel",
        "audience": audience,
        "audience_source": f"t.me preview {now.date().isoformat()}" if audience else None,
        "median_views": int(statistics.median(views)) if views else None,
        "last_post_at": last,
        "posts_30d": sum(1 for d in dates if d >= cutoff) if dates else None,
        "description": (info.get("description") or "")[:500],
        "relevance": scoring.relevance(info.get("title"), info.get("description"), texts),
        "language": scoring.guess_language(info.get("title"), info.get("description"), *texts[:10]),
        "contact_route": scoring.contact_route(info.get("description"), handle),
        "source": "telegram_preview",
    }
    return lead, candidate_handles(markup, posts, handle)


COUNT_RE = re.compile(r"([0-9][0-9 \u00a0.,]*)\s*(members|subscribers|участник|подписчик)", re.I)


def info_url(handle: str) -> str:
    if not tp.CHANNEL_RE.fullmatch(handle):
        raise ValueError("Invalid Telegram handle")
    return f"https://t.me/{handle}"


def profile_info_page(handle: str, markup: str, now: datetime | None = None) -> tuple[dict, set[str]]:
    """Groups (and channels with the preview disabled) have no /s/ page; t.me/<handle> still shows the title,
    the member count and the description."""
    now = now or datetime.now(timezone.utc)
    root = tp.parse_dom(markup)
    title = root.find("tgme_page_title")
    extra = root.find("tgme_page_extra")
    desc = root.find("tgme_page_description")
    name = title.text().strip() if title else None
    description = tp.plain_text(desc)[:500] if desc else ""
    extra_text = extra.text().strip() if extra else ""
    match = COUNT_RE.search(extra_text)
    audience = int(re.sub(r"[^0-9]", "", match.group(1))) if match else None
    is_group = "member" in extra_text.lower() or "участник" in extra_text.lower()
    lead = {
        "platform": "telegram", "handle": handle.lower(), "url": f"https://t.me/{handle}", "name": name,
        "segment": "telegram_chess_group" if is_group else "telegram_chess_channel",
        "audience": audience, "audience_source": f"t.me page {now.date().isoformat()}" if audience else None,
        "median_views": None, "last_post_at": None, "posts_30d": None, "description": description,
        "relevance": scoring.relevance(name, description, []),
        "language": scoring.guess_language(name, description),
        "contact_route": scoring.contact_route(description, handle) or ("tg:group chat (ask an admin there)" if is_group else ""),
        "source": "telegram_info_page",
    }
    # a bot or a private person has no extra counter: not a community
    if not extra_text or "bot" in handle.lower():
        lead["name"] = None
    return lead, candidate_handles(markup, [], handle)


def crawl(db, budget: int, fetcher=None, min_relevance: float = 0.3, max_depth: int = 4, now=None) -> dict:
    """Profile up to `budget` frontier handles. Relevant channels become leads and spread the frontier;
    irrelevant ones are marked and never fetched again."""
    fetcher = fetcher or tp.PoliteFetcher(agent=USER_AGENT)
    stats = {"requests_before": getattr(fetcher, "requests", 0), "profiled": 0, "new_leads": 0,
             "frontier_added": 0, "skipped": 0, "errors": 0}
    attempts, stopped = 0, False
    while attempts < budget and not stopped:
        rows = store.next_frontier(db, "telegram", 1)
        if not rows:
            break
        attempts += 1
        for row in rows:
            handle = row["handle"]
            try:
                markup = fetcher(tp.page_url(handle))
            except tp.RobotsDisallowed:
                stats["note"] = "robots.txt disallows t.me previews; stopped"
                stopped = True
                break
            except Exception as exc:  # network, 404, size cap: record and move on
                store.mark_frontier(db, "telegram", handle, f"error:{type(exc).__name__}")
                stats["errors"] += 1
                continue
            lead, candidates = profile(handle, markup, now=now)
            if not lead["name"] and attempts < budget:  # no public preview: try the plain t.me page once
                try:
                    lead, candidates = profile_info_page(handle, fetcher(info_url(handle)), now=now)
                    attempts += 1
                except Exception:
                    pass
            stats["profiled"] += 1
            bad = scoring.negative(lead["name"], lead["description"])
            if not lead["name"] or lead["relevance"] < min_relevance or bad:
                store.mark_frontier(db, "telegram", handle, f"skipped:{bad or 'not chess' if lead['name'] else 'no preview'}")
                stats["skipped"] += 1
                continue
            lead["discovered_from"] = row["discovered_from"]
            if store.upsert(db, lead):
                stats["new_leads"] += 1
            store.mark_frontier(db, "telegram", handle, "profiled")
            if row["depth"] < max_depth:
                for candidate in candidates:
                    stats["frontier_added"] += store.add_frontier(db, "telegram", candidate, f"tg:{handle}", row["depth"] + 1)
            db.commit()
    stats["requests"] = getattr(fetcher, "requests", 0) - stats.pop("requests_before")
    db.commit()
    return stats
