"""Editorial keyword portfolio. Priority is an intent heuristic, never search volume."""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
KEYWORDS = HERE / 'keywords-150.json'
ARTICLES = HERE.parents[1] / 'website' / 'src' / 'content' / 'articles'
STOPWORDS = {'a', 'an', 'and', 'at', 'for', 'from', 'how', 'in', 'is', 'of', 'on', 'the', 'to', 'vs', 'with', 'your'}


def portfolio() -> list[dict]:
    groups = json.loads(KEYWORDS.read_text())['clusters']
    rows = [dict(query=q, cluster=g['name'], intent=g['intent'], destination=g['destination'], market=g['market'], tier=g['tier']) for g in groups for q in g['queries']]
    folded = [row['query'].casefold() for row in rows]
    if len(rows) != 150 or len(set(folded)) != 150:
        raise ValueError('Keyword portfolio must have exactly 150 unique queries')
    return rows


def prioritize(gsc_csv: str | Path | None = None) -> list[dict]:
    """Join optional Search Console export; absent volume and position remain unknown."""
    rows = portfolio()
    observed = {}
    if gsc_csv:
        with Path(gsc_csv).open(newline='', encoding='utf-8-sig') as stream:
            for item in csv.DictReader(stream):
                query = (item.get('query') or item.get('Query') or '').strip().casefold()
                if query:
                    observed[query] = item
    for row in rows:
        data = observed.get(row['query'].casefold())
        row['search_console'] = None
        if data:
            try:
                row['search_console'] = {
                    'clicks': int(data.get('Clicks', data.get('clicks', 0))),
                    'impressions': int(data.get('Impressions', data.get('impressions', 0))),
                    'ctr': data.get('CTR', data.get('ctr')),
                    'position': data.get('Position', data.get('position')),
                }
            except (TypeError, ValueError):
                pass
        # Prioritize proven relevant impressions, then task fit; no fabricated volume.
        impressions = row['search_console']['impressions'] if row['search_console'] else 0
        row['priority_score'] = (3 if row['tier'] == 'first' else 1) * 10 + min(impressions, 1000) / 100
    return sorted(rows, key=lambda r: (-r['priority_score'], r['cluster'], r['query']))


def article_candidates(rows: list[dict] | None = None, articles_dir: Path = ARTICLES) -> list[dict]:
    """Suggest existing pages for editorial review; word overlap never proves query coverage."""
    articles = []
    for file in articles_dir.glob('*.json'):
        try:
            item = json.loads(file.read_text())
            articles.append({'slug': item['slug'], 'title': item['title'],
                             'terms': _terms(' '.join(str(item.get(k, '')) for k in ('title', 'subtitle', 'excerpt', 'metaDescription')) )})
        except (ValueError, KeyError, TypeError):
            continue
    result = []
    for row in rows or prioritize():
        terms = _terms(row['query'])
        matches = []
        for article in articles:
            overlap = len(terms & article['terms']) / max(1, len(terms))
            if overlap >= 0.5:
                matches.append({'slug': article['slug'], 'title': article['title'], 'term_overlap': round(overlap, 2)})
        result.append({**row, 'existing_page_candidates': sorted(matches, key=lambda m: -m['term_overlap'])[:3],
                       'editorial_status': 'review_existing_page' if matches else 'research_gap'})
    return result


def _terms(value: str) -> set[str]:
    return {term for term in re.findall(r'[^\W_]+', value.casefold()) if term not in STOPWORDS and len(term) > 2}
