"""Read-only chess news and YouTube opportunity report; never drafts or publishes claims."""
from __future__ import annotations

import argparse
import csv
import json
import os
import statistics
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

from agents.scraper import ScraperAgent
from keyword_strategy import article_candidates, prioritize

HERE = Path(__file__).resolve().parent
API = 'https://www.googleapis.com/youtube/v3/'


def _get(endpoint: str, params: dict) -> dict:
    with urlopen(API + endpoint + '?' + urlencode(params), timeout=15) as response:
        return json.load(response)


def _utc(value: str) -> datetime:
    return datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(timezone.utc)


def rank_videos(videos: list[dict], now: datetime | None = None) -> list[dict]:
    """Compare view velocity to each channel's own recent median; signal is a hypothesis."""
    now = now or datetime.now(timezone.utc)
    candidates = []
    for item in videos:
        try:
            age = (now - _utc(item['published_at'])).total_seconds() / 3600
            views = int(item['views'])
        except (KeyError, ValueError, TypeError):
            continue
        if not 1 <= age <= 168 or views < 0:
            continue
        candidates.append({**item, 'age_hours': round(age, 1), 'views_per_hour': round(views / age, 1)})
    by_channel = {}
    for item in candidates:
        by_channel.setdefault(item['channel_id'], []).append(item['views_per_hour'])
    for item in candidates:
        peers = by_channel[item['channel_id']]
        baseline = list(peers)
        baseline.remove(item['views_per_hour'])
        item['baseline_views_per_hour'] = round(statistics.median(baseline), 1) if len(baseline) >= 2 else None
        item['velocity_lift'] = round(item['views_per_hour'] / item['baseline_views_per_hour'], 2) if item['baseline_views_per_hour'] else None
        item['signal'] = 'outlier' if item['velocity_lift'] and item['velocity_lift'] >= 2 else 'unproven'
    return sorted(candidates, key=lambda row: (row['velocity_lift'] or 0, row['views_per_hour']), reverse=True)


def youtube_videos(sources: list[dict], api_key: str, max_channels: int = 12) -> tuple[list[dict], list[dict]]:
    """Uploads playlists plus one batched statistics request; uses the official Data API."""
    raw, failures = [], []
    channels = [s for s in sources if s.get('kind') == 'youtube_channel' and s.get('verified') and s.get('automation_allowed') and s.get('channel_id')]
    for source in sorted(channels, key=lambda s: -s.get('priority', 0))[:max_channels]:
        try:
            playlist = 'UU' + source['channel_id'][2:]
            data = _get('playlistItems', {'part': 'snippet', 'playlistId': playlist, 'maxResults': 8, 'key': api_key})
            for item in data.get('items', []):
                snippet = item['snippet']; video_id = snippet['resourceId']['videoId']
                raw.append({'video_id': video_id, 'channel_id': source['channel_id'], 'channel': source['name'], 'title': snippet['title'], 'published_at': snippet.get('publishedAt'), 'url': 'https://www.youtube.com/watch?v=' + video_id, 'source': 'youtube-data-api'})
        except Exception as exc:
            failures.append({'source': source['id'], 'error': type(exc).__name__, 'http_status': getattr(exc, 'code', None)})
    ids = list(dict.fromkeys(row['video_id'] for row in raw))
    stats = {}
    for start in range(0, len(ids), 50):
        try:
            data = _get('videos', {'part': 'statistics', 'id': ','.join(ids[start:start + 50]), 'key': api_key})
            stats.update({item['id']: item.get('statistics', {}) for item in data.get('items', [])})
        except Exception as exc:
            failures.append({'source': 'youtube-statistics', 'error': type(exc).__name__, 'http_status': getattr(exc, 'code', None)})
    return [{**row, 'views': stats[row['video_id']]['viewCount']} for row in raw if row['video_id'] in stats and 'viewCount' in stats[row['video_id']]], failures


def vidiq_context(path: str | None) -> list[dict]:
    """Optional user-provided vidIQ export. Context only; never combined with API counts."""
    if not path:
        return []
    with Path(path).open(newline='', encoding='utf-8-sig') as stream:
        return [{k: v for k, v in row.items() if k in {'video_id', 'keyword', 'search_volume', 'competition', 'captured_at'}} for row in csv.DictReader(stream)][:500]


def build_report(gsc_csv: str | None = None, vidiq_csv: str | None = None, include_network: bool = True) -> dict:
    now = datetime.now(timezone.utc)
    scraper = ScraperAgent()
    report = {'captured_at': now.isoformat(), 'keywords': article_candidates(prioritize(gsc_csv)), 'news': [], 'competitors': [], 'youtube': [], 'vidiq_context': vidiq_context(vidiq_csv), 'failures': [], 'editorial_rules': ['Read the full primary page and verify event date and chess claims before publishing', 'A velocity outlier is an opportunity signal, not proof a topic will go viral', 'Create original text, diagrams and media; credit sources', 'Do not publish unverified news or product claims']}
    if not include_network:
        return report
    try:
        report['news'] = scraper.fetch_feed_trends(limit=20)
        report['failures'].extend(s for s in getattr(scraper, 'feed_status', []) if s.get('error'))
    except Exception as exc:
        report['failures'].append({'source': 'feeds', 'error': str(exc)[:160]})
    try:
        report['competitors'] = scraper.inspect_telegram_competitors(['chesscom_ru', 'edchessss'])[:30]
        report['failures'].extend(getattr(scraper, 'competitor_failures', []))
    except Exception as exc:
        report['failures'].append({'source': 'telegram', 'error': str(exc)[:160]})
    api_key = os.getenv('YOUTUBE_API_KEY')
    if api_key:
        videos, failures = youtube_videos(scraper.sources.get('viral_sources', []), api_key)
        report['youtube'] = rank_videos(videos, now)
        report['failures'].extend(failures)
    else:
        report['failures'].append({'source': 'youtube', 'error': 'YOUTUBE_API_KEY absent; official video metrics unavailable'})
    return report


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--gsc-csv')
    parser.add_argument('--vidiq-csv')
    parser.add_argument('--offline', action='store_true')
    parser.add_argument('--output', default=str(HERE / 'state' / 'latest-discovery.json'))
    args = parser.parse_args()
    report = build_report(args.gsc_csv, args.vidiq_csv, not args.offline)
    out = Path(args.output); out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'report': str(out), 'keywords': len(report['keywords']), 'news': len(report['news']), 'youtube': len(report['youtube']), 'failures': report['failures']}, indent=2))


if __name__ == '__main__':
    main()
