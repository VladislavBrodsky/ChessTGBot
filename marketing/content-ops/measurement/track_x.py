"""Read-only X experiment measurement; writes local observations, never posts."""
from __future__ import annotations
import json, statistics, sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

OPS = Path(__file__).resolve().parents[1]
if not (OPS / 'pipeline').exists():
    OPS = Path('/Users/grandmaestro/Developer/ChessTGBot/marketing/content-ops')
sys.path.insert(0, str(OPS))
METRICS = ('impression_count', 'like_count', 'retweet_count', 'quote_count', 'bookmark_count', 'reply_count')

def observations(tweets, entries, now):
    by_id = {t['id']: t for t in tweets}
    out = []
    for e in entries:
        receipt = e.get('published') or {}
        tid = receipt.get('root_id')
        if e.get('status') != 'published' or tid not in by_id:
            continue
        t = by_id[tid]
        created = datetime.fromisoformat(t['created_at'].replace('Z', '+00:00'))
        own = sum(any(r.get('type') == 'replied_to' and r.get('id') == tid
                      for r in other.get('referenced_tweets', [])) for other in tweets)
        m = {k: t.get('public_metrics', {}).get(k) for k in METRICS}
        external = max(0, m['reply_count'] - own) if m['reply_count'] is not None else None
        exp = e.get('experiment') or {}
        out.append({'root_id': tid, 'queue_id': e['id'], 'hook': e.get('hook'),
                    'observed_at': now.isoformat(), 'published_at': created.isoformat(),
                    'age_hours': (now-created).total_seconds()/3600,
                    'experiment': exp.get('id', 'legacy'),
                    'format': exp.get('format', 'legacy_board' if e.get('chess') else 'legacy_text'),
                    'hook_family': exp.get('hook_family', 'legacy'),
                    'metrics': m, 'own_direct_replies': own, 'external_replies_estimate': external,
                    'link_clicks': None, 'first_games': None})
    return out

def scorecard(history):
    result = {'windows': {}, 'method': 'Earliest observation in [24,25.5] or [48,49.5] hours; missed windows stay missing. Own direct replies excluded. Observational comparisons, not randomized causal estimates.'}
    for target in (24, 48):
        selected = {}
        for row in sorted(history, key=lambda r: r['observed_at']):
            if target <= row['age_hours'] <= target+1.5:
                selected.setdefault(row['root_id'], row)
        groups = {}
        for row in selected.values():
            key = row['format'] + '/' + row['hook_family']
            groups.setdefault(key, []).append(row)
        summaries = {}
        for key, rows in groups.items():
            views = [r['metrics']['impression_count'] for r in rows if r['metrics']['impression_count'] is not None]
            def total(metric):
                values = [r['metrics'].get(metric) for r in rows]
                return sum(values) if all(v is not None for v in values) else None
            ext = [r['external_replies_estimate'] for r in rows]
            summaries[key] = {'posts': len(rows), 'measured_impressions_posts': len(views),
                'median_impressions': statistics.median(views) if views else None,
                'total_impressions': sum(views) if len(views)==len(rows) else None,
                'bookmarks': total('bookmark_count'), 'reposts': total('retweet_count'),
                'likes': total('like_count'), 'external_replies_estimate': sum(ext) if all(v is not None for v in ext) else None,
                'evidence_sufficient_for_exploratory_comparison': len(rows)>=5 and len(views)==len(rows) and sum(views)>=100}
        result['windows'][str(target)] = summaries
    return result

def main():
    import requests
    from pipeline import queue, x_publisher
    now = datetime.now(timezone.utc)
    auth = x_publisher.get_oauth1_auth()
    account = x_publisher.verify_credentials()['data']
    if account['username'].lower() != 'defi_ambassador':
        raise RuntimeError('Unexpected X account; refusing to measure a different brand')
    tweets=[]; token=None
    for _ in range(4):
        params={'max_results':100, 'tweet.fields':'created_at,public_metrics,referenced_tweets', 'exclude':'retweets'}
        if token: params['pagination_token']=token
        resp=requests.get(f"https://api.x.com/2/users/{account['id']}/tweets",params=params,auth=auth,timeout=20)
        resp.raise_for_status();data=resp.json();batch=data.get('data',[]);tweets.extend(batch)
        token=data.get('meta',{}).get('next_token')
        if not token or not batch or min(t['created_at'] for t in batch)[:10] < (now-timedelta(days=8)).date().isoformat(): break
    entries=[e for e in queue.all_entries() if e.get('kind')=='x_post' and e.get('date','') >= (now-timedelta(days=8)).date().isoformat()]
    rows=observations(tweets,entries,now)
    folder=OPS/'state/x-experiments';folder.mkdir(parents=True,exist_ok=True)
    # Hourly filenames make repeated runs idempotent; atomic replace prevents partial snapshots.
    dest=folder/(now.strftime('%Y-%m-%dT%H')+'.json');tmp=dest.with_suffix('.tmp')
    tmp.write_text(json.dumps({'at':now.isoformat(),'account':account['username'],'rows':rows},indent=2)+'\n');tmp.replace(dest)
    history=[]
    for p in folder.glob('2*.json'): history.extend(json.loads(p.read_text()).get('rows',[]))
    report={'at':now.isoformat(),'observed_roots':len(rows),**scorecard(history)}
    tmp=folder/'scorecard.tmp';tmp.write_text(json.dumps(report,indent=2)+'\n');tmp.replace(folder/'scorecard.json')
    print(json.dumps(report))

if __name__=='__main__': main()
