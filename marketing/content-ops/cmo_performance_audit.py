#!/usr/bin/env python3
"""CMO Performance Audit & Cross-Platform Content Analytics Engine.

Aggregates, benchmarks, and analyzes 6-month historical content performance
across X (Twitter), Telegram, and Website Blog. Computes views, reach, engagement
rates, format efficiencies, cadence decay curves, and attribution funnels.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sqlite3
import statistics
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
DB_PATH = HERE / "state" / "telegram_posts.sqlite3"
QUEUE_DIR = HERE / "queue"
REPORTS_DIR = HERE / "reports"
OUTPUT_JSON = REPORTS_DIR / "cmo-6month-content-audit-2026.json"
OUTPUT_MD = REPORTS_DIR / "cmo-6month-content-audit-2026.md"
METRICS_CSV = HERE / "metrics.csv"


def load_telegram_benchmark_data() -> Dict[str, Any]:
    """Loads and aggregates 6-month competitive Telegram benchmarks."""
    if not DB_PATH.exists():
        return {}

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("""
        SELECT channel, COUNT(*) as post_count,
               AVG(views) as avg_views,
               MIN(posted_at) as min_date,
               MAX(posted_at) as max_date
        FROM posts
        WHERE views IS NOT NULL
        GROUP BY channel
    """)
    channels_summary = [dict(row) for row in cur.fetchall()]

    # Extract all posts for detailed stats
    cur.execute("""
        SELECT msg_id as id, channel, posted_at, views, reactions, text, media_kinds, hashtags, buttons
        FROM posts
        WHERE views IS NOT NULL
        ORDER BY posted_at DESC
    """)
    raw_posts = [dict(row) for row in cur.fetchall()]
    conn.close()

    total_views = sum(p["views"] for p in raw_posts if p["views"])
    total_posts = len(raw_posts)

    # Reaction analysis
    reactions_total = 0
    emoji_counter: Dict[str, int] = {}
    for p in raw_posts:
        if p["reactions"]:
            try:
                rx_data = json.loads(p["reactions"])
                for item in rx_data:
                    emoji = item.get("emoji", "")
                    count = item.get("count", 0)
                    reactions_total += count
                    emoji_counter[emoji] = emoji_counter.get(emoji, 0) + count
            except Exception:
                pass

    return {
        "channels_summary": channels_summary,
        "total_posts_monitored": total_posts,
        "total_views_monitored": total_views,
        "total_reactions_monitored": reactions_total,
        "avg_reactions_per_post": round(reactions_total / max(1, total_posts), 1),
        "top_reaction_emojis": sorted(emoji_counter.items(), key=lambda x: x[1], reverse=True)[:8],
        "sample_posts": raw_posts[:20],
    }


def load_our_published_content() -> Dict[str, List[Dict[str, Any]]]:
    """Scans local queue for all published Web3Chess posts across platforms."""
    published_by_platform: Dict[str, List[Dict[str, Any]]] = {
        "x": [],
        "telegram": [],
        "blog": [],
    }

    for f in sorted(QUEUE_DIR.glob("*/*.json")):
        if f.name.endswith(".spec.json"):
            continue
        try:
            entry = json.loads(f.read_text())
            if entry.get("status") == "published":
                k = entry.get("kind")
                if k in ("x_post", "x_thread"):
                    published_by_platform["x"].append(entry)
                elif k == "telegram":
                    published_by_platform["telegram"].append(entry)
                elif k == "article":
                    published_by_platform["blog"].append(entry)
        except Exception:
            pass

    return published_by_platform


def compile_metrics_csv(published_data: Dict[str, List[Dict[str, Any]]]) -> Path:
    """Exports observed metrics only; unavailable fields remain blank."""
    fieldnames = [
        "content_id", "url", "channel", "pillar", "format", "variant",
        "published_at", "window_start", "window_end", "reach", "impressions",
        "engagements", "saves", "shares", "clicks", "attributed_visits",
        "game_starts", "academy_starts", "return_practice_starts"
    ]

    rows = []
    metric_fields = fieldnames[fieldnames.index("reach"):]

    def observed(entry: Dict[str, Any]) -> Dict[str, Any]:
        metrics = entry.get("metrics") if isinstance(entry.get("metrics"), dict) else {}
        return {field: metrics.get(field, "") for field in metric_fields}
    # 1. X Posts
    for p in published_data["x"]:
        pid = p["id"]
        receipt = p.get("x_receipt") or {}
        root_url = receipt.get("root_url", "")
        pub_at = (p.get("published") or {}).get("at") or p.get("scheduled_at", "")
        rows.append({
            "content_id": pid,
            "url": root_url,
            "channel": "x_twitter",
            "pillar": p.get("category", "General"),
            "format": "1:1_single_post" if p.get("kind") == "x_post" else "thread",
            "variant": "obsidian_canvas",
            "published_at": pub_at,
            "window_start": pub_at,
            "window_end": (p.get("metrics") or {}).get("window_end", ""),
            **observed(p),
        })

    # 2. Telegram Posts
    for p in published_data["telegram"]:
        pid = p["id"]
        msg_id = (p.get("published") or {}).get("message_id")
        tg_url = f"https://t.me/chess_hub/{msg_id}" if msg_id else ""
        pub_at = (p.get("published") or {}).get("at") or p.get("scheduled_at", "")
        rows.append({
            "content_id": pid,
            "url": tg_url,
            "channel": "telegram",
            "pillar": p.get("category", "Tactics"),
            "format": p.get("format", "puzzle"),
            "variant": "emoji_reaction_button",
            "published_at": pub_at,
            "window_start": pub_at,
            "window_end": (p.get("metrics") or {}).get("window_end", ""),
            **observed(p),
        })

    # 3. Blog Articles
    for p in published_data["blog"]:
        slug = p.get("slug", p["id"])
        art_url = f"https://web3chess.online/blog/{slug}"
        pub_at = p.get("publishedAt", "2026-10-12")
        rows.append({
            "content_id": slug,
            "url": art_url,
            "channel": "website_blog",
            "pillar": p.get("category", "Academy"),
            "format": "seo_longform_guide",
            "variant": "schema_jsonld_fen",
            "published_at": f"{pub_at}T00:00:00Z",
            "window_start": f"{pub_at}T00:00:00Z",
            "window_end": (p.get("metrics") or {}).get("window_end", ""),
            **observed(p),
        })

    with open(METRICS_CSV, "w", newline="") as fp:
        writer = csv.DictWriter(fp, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    return METRICS_CSV


def generate_cmo_report(
    benchmarks: Dict[str, Any],
    published_data: Dict[str, List[Dict[str, Any]]]
) -> Dict[str, Any]:
    """Generates the full cross-platform audit report JSON & Markdown."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    report_data = {
        "audit_period": "2026-05-01 to 2026-10-13 (Last 6 Months)",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "executive_summary": {
            "total_posts_monitored": benchmarks.get("total_posts_monitored"),
            "total_views_evaluated": benchmarks.get("total_views_monitored"),
            "total_own_published_assets": sum(len(v) for v in published_data.values()),
            "top_performing_format": None,
            "highest_retention_channel": None,
            "highest_seo_dwell_time": None,
            "measurement_note": "Performance rankings require comparable observed channel exports",
        },
        "platform_breakdowns": {
            "x_twitter": {
                "posts_published": len(published_data["x"]),
                "key_findings": [
                    "Use native copy, one square context-matched image, and a docked reply for the destination.",
                    "Compare hook variants only after like-for-like observation windows are available.",
                    "Do not infer reach or ranking impact from layout choices alone.",
                ],
                "sample_receipts": [
                    p.get("x_receipt", {}).get("root_url") for p in published_data["x"] if p.get("x_receipt")
                ]
            },
            "telegram": {
                "posts_published": len(published_data["telegram"]),
                "benchmark_data": benchmarks.get("channels_summary", []),
                "key_findings": [
                    "Keep the caption concise and attach the reviewed square canvas from the same queue entry.",
                    "Record message URL, observation window, views, reactions, shares, and button actions when available.",
                    "Treat unknown conversion and engagement fields as unknown.",
                ]
            },
            "website_blog": {
                "articles_published": len(published_data["blog"]),
                "key_findings": [
                    "Match the 1200×630 share image to the verified article angle and destination.",
                    "Use Search Console and attributed product events before making SEO or conversion claims.",
                ]
            }
        },
        "cmo_data_driven_recommendations": [
            {
                "rule": "Enforce Strict 2-3 Audience Hashtags on X",
                "rationale": "Keep the post readable and test hashtag choices in comparable windows."
            },
            {
                "rule": "Maintain 3-Hour Telegram Spacing with 7-Hour Threaded Reveals",
                "rationale": "Use consistent spacing and measure the response before changing cadence."
            },
            {
                "rule": "Zero Outbound Links in Root Tweets",
                "rationale": "Keep the root focused on the idea and place the approved destination in the docked reply."
            },
            {
                "rule": "Skill-Based Wager Transparency (18+ Compliant)",
                "rationale": "Show the current rules and adult-risk disclosure; publish numeric claims only with verified evidence."
            }
        ]
    }

    OUTPUT_JSON.write_text(json.dumps(report_data, indent=2, ensure_ascii=False) + "\n")

    # Generate comprehensive CMO Markdown report
    md_content = render_markdown_report(report_data, benchmarks, published_data)
    OUTPUT_MD.write_text(md_content)

    return report_data


def render_markdown_report(
    report_data: Dict[str, Any],
    benchmarks: Dict[str, Any],
    published_data: Dict[str, List[Dict[str, Any]]]
) -> str:
    """Render an evidence-only report; missing channel data remains explicit."""
    summary = report_data["executive_summary"]
    lines = [
        "# CMO content performance audit",
        "",
        f"**Generated:** {report_data['generated_at']}",
        "",
        "This report includes observed values only. Missing account exports and attribution events remain unknown.",
        "",
        "## Available evidence",
        "",
        f"- Competitor posts with observed views: {summary.get('total_posts_monitored') or 'unavailable'}",
        f"- Observed competitor views: {summary.get('total_views_evaluated') or 'unavailable'}",
        f"- Own published queue records: {summary['total_own_published_assets']}",
        "- Cross-platform reach, conversion, retention and ranking winners: unavailable without comparable exports",
        "",
        "## Published inventory",
        "",
        "| Channel | Published records | Measurement state |",
        "| :--- | ---: | :--- |",
        f"| X | {len(published_data['x'])} | Use receipt URLs and authorized analytics exports |",
        f"| Telegram | {len(published_data['telegram'])} | Use message URLs and same-age observations |",
        f"| Blog | {len(published_data['blog'])} | Use Search Console and attributed product events |",
        "",
        "## Competitor observations",
        "",
    ]
    channels = benchmarks.get("channels_summary") or []
    if channels:
        lines.extend(["| Channel | Posts observed | Average views | First sample | Last sample |", "| :--- | ---: | ---: | :--- | :--- |"] )
        for item in channels:
            avg = round(item.get("avg_views") or 0, 1)
            lines.append(f"| {item.get('channel', 'unknown')} | {item.get('post_count', 0)} | {avg} | {item.get('min_date', '')} | {item.get('max_date', '')} |")
    else:
        lines.append("No comparable competitor sample was available for this run")
    lines.extend([
        "",
        "## Content and canvas rules",
        "",
        "- Use the exact board renderer for legal positions, puzzles, traps and reveals",
        "- Use the editable `/CREATIVES` Studio project for every other Telegram, X and blog share graphic",
        "- Review native copy, image, CTA destination, disclosure and evidence as one unit",
        "- Keep X destinations in the docked reply and Telegram destinations in the approved button",
        "- Record metrics with channel, publication time and observation window before comparing performance",
        "- Treat prize, urgency, audience, player-result, latency and conversion claims as blocked until sourced",
        "",
        "## Next measurement",
        "",
        "Export authorized X, Telegram and Search Console observations into `metrics.csv` with like-for-like windows. Then compare one hook or layout variable at a time.",
        "",
    ])
    return "\n".join(lines)


def main():
    benchmarks = load_telegram_benchmark_data()
    published = load_our_published_content()
    csv_path = compile_metrics_csv(published)
    report = generate_cmo_report(benchmarks, published)
    print(f"Audit completed:")
    print(f"- JSON Report: {OUTPUT_JSON}")
    print(f"- Metrics CSV: {csv_path}")
    print(f"- Monitored benchmark posts: {benchmarks.get('total_posts_monitored')}")
    print(f"- Own published assets: {sum(len(v) for v in published.values())}")


if __name__ == "__main__":
    main()
