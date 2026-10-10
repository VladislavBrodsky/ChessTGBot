"""Within-channel performance audit of posts stored by telegram_public.py (stdlib only, read-only on the DB).

Public preview counts only: views are Telegram's rounded view counter, not unique reach; there is no demographic data.
Every ratio is normalised WITHIN a channel; nothing here compares raw views across channels.

    python3 marketing/content-ops/telegram_audit.py chesscom_ru edchessss --output /tmp/stats.json
"""
from __future__ import annotations
import argparse, json, re, sqlite3, statistics
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
DB = HERE / 'state/telegram_posts.sqlite3'
PROVISIONAL_HOURS = 168     # posts younger than 7 days are still accumulating views; excluded from rankings and baselines
NEIGHBOURS = 30             # baseline = median views of the 30 posts closest in age (excluding the post itself)
MIN_VIEWS_PERCENTILE = 25   # reaction-rate rankings ignore posts below this views percentile (tiny denominators)
EMOJI_RE = re.compile('[☀-➿\U0001F000-\U0001FAFF⭐⬛⬜⏰⏳‼⁉✅❌❤️]')
FIRST_EMOJI_RE = re.compile('^\\s*(?:[☀-➿\U0001F000-\U0001FAFF⭐⬛⬜⏰✅❌❤]️?⃣?)')


def pct(values, q):
    if not values:
        return None
    values = sorted(values)
    k = (len(values) - 1) * q / 100
    lo, hi = int(k), min(int(k) + 1, len(values) - 1)
    return values[lo] + (values[hi] - values[lo]) * (k - lo)


def median(values):
    values = [v for v in values if v is not None]
    return statistics.median(values) if values else None


def r(value, digits=2):
    return None if value is None else round(value, digits)


def load(channel, db_path=DB):
    db = sqlite3.connect(str(db_path))
    db.row_factory = sqlite3.Row
    posts = []
    for row in db.execute('SELECT * FROM posts WHERE channel=? AND posted_at IS NOT NULL AND views IS NOT NULL ORDER BY posted_at', (channel,)):
        p = dict(row)
        for key in ('media_kinds', 'reactions', 'hashtags', 'outbound_links', 'buttons', 'link_preview', 'poll'):
            p[key] = json.loads(p[key]) if p[key] else None
        p['dt'] = datetime.fromisoformat(p['posted_at'])
        posts.append(p)
    info = db.execute('SELECT * FROM channels WHERE channel=?', (channel,)).fetchone()
    observed = db.execute('SELECT MAX(last_seen) FROM posts WHERE channel=?', (channel,)).fetchone()[0]
    db.close()
    return posts, dict(info) if info else {}, datetime.fromisoformat(observed)


def annotate(posts, observed):
    """Add age and within-channel normalised metrics."""
    for p in posts:
        p['age_h'] = (observed - p['dt']).total_seconds() / 3600
        p['provisional'] = p['age_h'] < PROVISIONAL_HOURS
        p['text_len'] = len(p['text'] or '')
        p['rate'] = p['reaction_total'] / p['views'] if p['views'] else None
    mature = [p for p in posts if not p['provisional']]
    for p in posts:
        # Baseline: median of the NEIGHBOURS mature posts closest in age (so audience growth is controlled for);
        # a young post is therefore compared with mature neighbours and shows its accumulation shortfall.
        near = sorted((q for q in mature if q is not p), key=lambda q: abs(q['age_h'] - p['age_h']))[:NEIGHBOURS]
        p['baseline'] = median([q['views'] for q in near])
        p['norm'] = p['views'] / p['baseline'] if p['baseline'] else None
        p['rate_baseline'] = median([q['rate'] for q in near])
    return posts


# ------------------------------------------------------------------ feature detection

LINK_WORDS = re.compile(r'https?://|t\.me/|www\.', re.I)


def opening_line(text):
    return next((line.strip() for line in (text or '').split('\n') if line.strip()), '')


def opening_pattern(text):
    line = opening_line(text)
    if not line:
        return 'no-text'
    body = FIRST_EMOJI_RE.sub('', line).strip()
    lead_emoji = bool(FIRST_EMOJI_RE.match(line))
    flags = []
    if lead_emoji:
        flags.append('leading-emoji')
    if re.match(r'^[«"“„\']', body) or re.match(r'^[^:]{3,40}:\s*[«"“]', body):
        flags.append('quote/speaker')
    if '?' in line:
        flags.append('question')
    if re.match(r'^\d', body):
        flags.append('number-first')
    if re.match(r'^(find|can you|guess|who|what|why|how|which|solve|name|spot|mate in|white to|black to|найди|кто|что|почему|как|сможете|вы знали|белые|чёрные|черные|мат в)', body, re.I):
        flags.append('imperative/challenge')
    if re.search(r'(breaking|молния|срочно|just in|вышел|новость|announcement)', body, re.I):
        flags.append('news-flag')
    letters = [c for c in body if c.isalpha()]
    if len(letters) > 6 and sum(c.isupper() for c in letters) / len(letters) > 0.8:
        flags.append('all-caps')
    if len(line) <= 40:
        flags.append('short-line')
    return '+'.join(flags) or 'statement'


def cta_types(p):
    text = p['text'] or ''
    kinds = []
    if p['buttons']:
        kinds.append('inline-button')
    if p['media_type'] == 'poll':
        kinds.append('poll-vote')
    if re.search(r'ваш[иа]? (прогноз|мнени|вариан)|пишите в коммент|в комментариях|your move\?|let us know|tell us|comment|what do you think|who wins|кто победит|какой|какую', text, re.I):
        kinds.append('ask-audience')
    if re.search(r'реакци', text, re.I) or re.search(r'❤️? ?[—-]|\U0001F525 ?[—-]|\U0001F44D ?[—-]', text):
        kinds.append('react-to-vote')
    if p['outbound_links'] and not p['buttons']:
        kinds.append('link')
    if re.search(r'подписывай|subscribe|join (our|the)|присоедин', text, re.I):
        kinds.append('join/subscribe')
    if re.search(r'промокод|promo ?code|скидк|discount|бесплатн', text, re.I):
        kinds.append('offer')
    return kinds or ['none']


# Rule-based first pass (ordered, first match wins) + MANUAL corrections after reading the posts.
# Labels describe the content/hook type of the post; they are judgement calls, not ground truth.
RU_RULES = [
    ('puzzle (find the move)', r'\U0001F9E9|мат в \d|ход (белых|черных|чёрных)|(белые|черные|чёрные) начинают|мат в один'),
    ('results table (medals)', r'\U0001F947'),
    ('record / first-ever / milestone', r'рекорд|самый молод|впервые|первый в истории|первая девушка|пересек|стал.{0,12}номером один|ходом 1\.а3|норму|норм[ауы] '),
    ('quote / interview', r'\U0001F399|[«"“].{10,}[»"”]'),
    ('history / anniversary / tribute', r'родился|исполнилось|исполняется|ушёл из жизни|ушел из жизни|рождением|день рождения|скончал'),
    ('audience prompt / UGC', r'подпись к фото|как вы встретили|рубрику|а как вы|ваши прогнозы|ваш любимый|давай'),
    ('channel / admin note', r'Levitov|Илье|YouTube-канал|друзья'),
    ('meme / humour caption', r'^(когда|по факту|мой |кто )|😄|😁|☺'),
    ('blunder / drama moment', r'зевнул|уронил|жертв|ударил|сдался|почти доигрался|добил|разгром|реванш|сенсацион|зрители'),
    ('rating / ranking update', r'лайф-рейтинг|рейтинг|место в|шахматист года|номером один'),
    ('winner announcement', r'(победител|чемпион|выиграл|выигрывает|побеждает|победила|завершен).{0,80}\U0001F3C6|\U0001F3C6.{0,40}(победил|чемпион)'),
    ('preview / schedule', r'завтра|стартует|стартовал|начинается|сыграют|пары |вторые партии|результаты .{0,20}после'),
    ('live standings / round result', r'\u26A1|лидирует|лидер|единоличн|догоняет|побеждает|одерживает|наносит|прерывает|выигрыва|обыграл|проигр|становится|снялся|объявил|тур|партии|счёт|счет'),
]
ED_RULES = [
    ('react-to-vote puzzle', r'(best|winning|defensive|better) (move|position)|which (move|side|promotion|team)|intuition|instinct|evaluating|alekhine|smothered|weird puzzle|what.s the best'),
    ('reaction bait (drop a heart if ...)', r'drop a|hit ❤|smash|if this is (so )?real|always feels'),
    ('find-the-checkmate (answer in chat)', r'find (the )?checkmate|checkmate in|mate in'),
    ('weekly agenda ("what to do this week")', r'what to do (on|in) edchess|what are your plans for the week'),
    ('partner tournament promo (x partner, prize)', r'edchess [×x] |edchess x |bitpapa|totemancer|fightme|onton|tonpoker|artitap|predicta|anycraft|labrador|memhustle|emcd.{0,20}(series|royal|event)'),
    ('Puzzle Pass / quest reminder', r'puzzle pass|quest|chest'),
    ('tournament today / weekend call', r'tournament|arena|blitz|bullet|clash|league'),
    ('product update / how-to guide', r'update|launch|guide|how (do|to)|inventory|marketplace|referral|board|store|payment|upgrade|how much'),
    ('community / creators / social ask', r'creator|vote for|support|invite friends|chat|home screen|icon|stream'),
    ('network status / ops notice', r'ton network|status|delays|transactions'),
]
MANUAL = {  # (channel, msg_id) -> label, after reading the post
    ('chesscom_ru', 9104): 'quote / interview',
    ('chesscom_ru', 9253): 'preview / schedule',
    ('chesscom_ru', 9248): 'winner announcement',
    ('chesscom_ru', 9254): 'audience prompt / UGC',
    ('chesscom_ru', 9160): 'meme / humour caption',
    ('chesscom_ru', 9306): 'meme / humour caption',
    ('chesscom_ru', 9360): 'meme / humour caption',
    ('chesscom_ru', 9495): 'audience prompt / UGC',
    ('chesscom_ru', 9478): 'quote / interview',
    ('chesscom_ru', 9345): 'history / anniversary / tribute',
    ('chesscom_ru', 9153): 'history / anniversary / tribute',
    ('chesscom_ru', 9686): 'record / first-ever / milestone',
    ('chesscom_ru', 9103): 'meme / humour caption',
    ('chesscom_ru', 9111): 'did-you-know fact',
    ('chesscom_ru', 9175): 'meme / humour caption',
    ('chesscom_ru', 9303): 'meme / humour caption',
    ('chesscom_ru', 9402): 'meme / humour caption',
    ('chesscom_ru', 9462): 'audience prompt / UGC',
    ('chesscom_ru', 9352): 'channel / admin note',
    ('chesscom_ru', 9369): 'history / anniversary / tribute',
    ('chesscom_ru', 9378): 'record / first-ever / milestone',
    ('edchessss', 352): 'community / creators / social ask',
    ('edchessss', 356): 'network status / ops notice',
}


def label_post(p):
    if (p['channel'], p['msg_id']) in MANUAL:
        return MANUAL[(p['channel'], p['msg_id'])]
    if p['media_type'] == 'poll':
        return 'native poll / quiz'
    text = (p['text'] or '').strip()
    if not text:
        return 'image/video only (no caption)' if p['media_type'] != 'other' else 'media the preview cannot render'
    low = text.lower()
    rules = ED_RULES if p['channel'] == 'edchessss' else RU_RULES
    for label, pattern in rules:
        if re.search(pattern, low if p['channel'] == 'edchessss' else text, re.I | re.M):
            return label
    return 'other / unclassified'


# ------------------------------------------------------------------ aggregation

def length_bucket(n):
    return '0 (media only)' if n == 0 else '1-100' if n <= 100 else '101-300' if n <= 300 else '301-600' if n <= 600 else '601+'


def group_stats(posts, keyfn, mature_only=True):
    groups = defaultdict(list)
    for p in posts:
        groups[keyfn(p)].append(p)
    rows = []
    for key, items in groups.items():
        mature = [p for p in items if not p['provisional']] if mature_only else items
        rows.append({'key': key, 'posts': len(items), 'share': r(len(items) / len(posts), 3),
                     'median_norm_views': r(median([p['norm'] for p in mature])),
                     'median_views': median([p['views'] for p in mature]),
                     'median_reactions_per_1k_views': r(median([p['rate'] * 1000 for p in mature if p['rate'] is not None]), 1),
                     'share_in_top_decile': None})
    return sorted(rows, key=lambda x: -x['posts'])


def monthly(posts):
    groups = defaultdict(list)
    for p in posts:
        groups[p['posted_at'][:7]].append(p)
    return [{'month': m, 'posts': len(v), 'median_views': median([p['views'] for p in v if not p['provisional']]), 'median_reactions_per_1k_views': r(median([p['rate'] * 1000 for p in v if not p['provisional'] and p['rate'] is not None]), 1)} for m, v in sorted(groups.items())]


def summarise(channel, label_fn=label_post, db_path=DB):
    posts, info, observed = load(channel, db_path)
    annotate(posts, observed)
    mature = [p for p in posts if not p['provisional']]
    span_days = max((posts[-1]['dt'] - posts[0]['dt']).total_seconds() / 86400, 1)
    gaps = [(b['dt'] - a['dt']).total_seconds() / 3600 for a, b in zip(posts, posts[1:])]
    hours = Counter(p['dt'].hour for p in posts)
    weekdays = Counter(p['dt'].strftime('%a') for p in posts)
    by_hour = defaultdict(list)
    for p in mature:
        by_hour[p['dt'].hour].append(p['norm'])
    block_of = lambda h: f'{h // 4 * 4:02d}-{h // 4 * 4 + 3:02d}'
    by_block = defaultdict(list)
    for p in mature:
        by_block[block_of(p['dt'].hour)].append(p['norm'])
    for p in posts:
        p['label'] = label_fn(p)
        p['opening'] = opening_pattern(p['text'])
        p['hook'] = hook_pattern(p)
        p['cta'] = cta_types(p)
    ranked = sorted(mature, key=lambda p: -p['norm'])
    decile = max(1, len(ranked) // 10)
    floor = pct([p['views'] for p in mature], MIN_VIEWS_PERCENTILE)
    by_rate = sorted([p for p in mature if p['views'] >= floor and p['rate'] is not None], key=lambda p: -p['rate'])
    top_ids = {p['msg_id'] for p in ranked[:decile]}
    age_buckets = [(0, 6), (6, 24), (24, 48), (48, 168), (168, 720), (720, 1e9)]
    maturity = []
    for lo, hi in age_buckets:
        group = [p for p in posts if lo <= p['age_h'] < hi]
        maturity.append({'age_hours': f'{lo}-{"+" if hi > 1e8 else hi}', 'posts': len(group), 'median_views': median([p['views'] for p in group])})
    types = group_stats(posts, lambda p: p['label'])
    for row in types:
        row['share_in_top_decile'] = r(sum(1 for p in ranked[:decile] if p['label'] == row['key']) / decile, 2)
    return {
        'channel': channel, 'title': info.get('title'), 'subscribers': info.get('subscribers'), 'observed_at': observed.isoformat(),
        'posts_analysed': len(posts), 'mature_posts': len(mature), 'provisional_posts': len(posts) - len(mature),
        'date_range': [posts[0]['posted_at'], posts[-1]['posted_at']], 'span_days': r(span_days, 1),
        'cadence': {'posts_per_day_overall': r(len(posts) / span_days), 'posts_per_week_overall': r(len(posts) / span_days * 7, 1),
                    'posts_last_30d': sum(1 for p in posts if p['age_h'] <= 720), 'posts_last_90d': sum(1 for p in posts if p['age_h'] <= 2160),
                    'median_gap_hours': r(median(gaps), 1), 'p90_gap_hours': r(pct(gaps, 90), 1), 'max_gap_days': r(max(gaps) / 24, 1),
                    'posts_by_utc_hour': {f'{h:02d}': hours.get(h, 0) for h in range(24)}, 'posts_by_weekday': dict(weekdays),
                    'median_norm_views_by_utc_hour': {f'{h:02d}': {'n': len(v), 'median': r(median(v))} for h, v in sorted(by_hour.items())},
                    'median_norm_views_by_4h_block_utc': {k: {'n': len(v), 'median': r(median(v))} for k, v in sorted(by_block.items())},
                    'median_norm_views_by_weekday': {d: {'n': len([p for p in mature if p['dt'].strftime('%a') == d]), 'median': r(median([p['norm'] for p in mature if p['dt'].strftime('%a') == d]))} for d in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}},
        'views': {'median': median([p['views'] for p in mature]), 'p10': pct([p['views'] for p in mature], 10), 'p90': pct([p['views'] for p in mature], 90),
                  'max': max(p['views'] for p in posts), 'median_views_per_subscriber': r(median([p['views'] for p in mature]) / info['subscribers'], 2) if info.get('subscribers') else None,
                  'by_age_bucket': maturity},
        'reactions': {'median_per_1k_views': r(median([p['rate'] * 1000 for p in mature if p['rate'] is not None]), 1),
                      'posts_with_zero_reactions': sum(1 for p in posts if p['reaction_total'] == 0),
                      'top_emoji': Counter({e: c for e, c in Counter(x['emoji'] for p in posts for x in p['reactions'] for _ in range(x['count'])).items()}).most_common(8)},
        'media_mix': group_stats(posts, lambda p: p['media_type'] + (' (album)' if p['album_size'] > 1 else '')),
        'text_length': {'percentiles': {f'p{q}': r(pct([p['text_len'] for p in posts], q), 0) for q in (10, 25, 50, 75, 90)}, 'max': max(p['text_len'] for p in posts),
                        'buckets': group_stats(posts, lambda p: length_bucket(p['text_len']))},
        'format_flags': {'with_hashtags': sum(1 for p in posts if p['hashtags']), 'with_outbound_link': sum(1 for p in posts if p['outbound_links']),
                         'with_inline_buttons': sum(1 for p in posts if p['buttons']), 'forwards': sum(1 for p in posts if p['is_forward']),
                         'edited': sum(1 for p in posts if p['edited']), 'leading_emoji': sum(1 for p in posts if p['opening'].startswith('leading-emoji')),
                         'with_bold_or_emoji_headline': sum(1 for p in posts if FIRST_EMOJI_RE.match(opening_line(p['text']) or ''))},
        'content_types': types,
        'topic_effects': entity_effects(channel, mature),
        'views_by_month': monthly(posts),
        'hook_patterns': group_stats(posts, lambda p: p['hook']),
        'opening_patterns': group_stats(posts, lambda p: p['opening']),
        'cta_types': group_stats(posts, lambda p: p['cta'][0]),
        'top_by_norm_views': [brief(p) for p in ranked[:25]],
        'top_by_reaction_rate': [brief(p) for p in by_rate[:25]],
        'bottom_decile_by_norm_views': [brief(p) for p in ranked[-decile:]],
        'min_views_for_rate_ranking': floor,
        '_posts': posts,
        '_top_ids': top_ids,
    }


ENTITIES = {  # topic words whose presence is compared with absence, within the channel (mature posts only)
    'chesscom_ru': {'Carlsen': r'карлсен|магнус', 'Nakamura': r'накамур|хикару', 'Sindarov': r'синдаров', 'Abdusattorov': r'абдусатторов', 'Gukesh': r'гукеш',
                    'Nepomniachtchi': r'непомнящ', 'Firouzja': r'фирузджа', 'Caruana': r'каруан', 'Title Tuesday': r'титульн', 'Candidates': r'претендент',
                    'Olympiad': r'олимпиад', 'women players': r'женск|вайшали|асаубаев|горячкин|лагно|музычук', 'puzzle emoji': r'\U0001F9E9'},
    'edchessss': {'$TON': r'\$ton', '$GRAM': r'\$gram', 'USDT': r'usdt', 'prize / win / earn': r'prize|win |earn|reward|claim', 'Puzzle Pass': r'puzzle pass',
                  'react / vote ask': r'react|drop a|hit ❤|vote', 'question mark': r'\?'},
}


def entity_effects(channel, mature):
    rows = []
    for name, pattern in ENTITIES.get(channel, {}).items():
        has = [p for p in mature if re.search(pattern, p['text'] or '', re.I)]
        if len(has) < 8:
            continue
        rest = [p for p in mature if p not in has]
        rows.append({'topic': name, 'posts_with': len(has), 'median_norm_with': r(median([p['norm'] for p in has])), 'median_norm_without': r(median([p['norm'] for p in rest])),
                     'median_reactions_per_1k_with': r(median([p['rate'] * 1000 for p in has]), 1), 'median_reactions_per_1k_without': r(median([p['rate'] * 1000 for p in rest]), 1)})
    return sorted(rows, key=lambda x: -(x['median_norm_with'] or 0))


def hook_pattern(p):
    """How the post opens/asks, independent of topic (rule-based; reviewed on the top and bottom lists)."""
    text = (p['text'] or '').strip()
    line = opening_line(text)
    low = text.lower()
    if p['media_type'] == 'poll':
        return 'native poll'
    if not text:
        return 'no caption (image or clip carries it)'
    if p['channel'] == 'edchessss':
        if re.search(r'react|drop (a|your)|vote:|hit ❤|smash', low) and re.search(r'❤.{0,6}[\u2014-]', text):
            return 'emoji-as-answer vote (each reaction = an option)'
        if re.search(r'edchess [\u00d7x] ', low):
            return 'partner collab "X \u00d7 Y" + prize amount'
        if re.search(r'what to do (on|in) edchess', low):
            return 'recurring weekly agenda post'
        if re.search(r'\d+\s*\$?(ton|gram|usdt)|\$\d+|prize|reward|chest', low[:200]):
            return 'prize / reward amount in the headline'
        if re.search(r'today|tonight|this weekend|last day|only|left|ends|extra', low[:160]):
            return 'deadline / "today" reminder'
        if re.search(r'^\W*(new|big|meet|introducing|launch|update)', low[:40]):
            return 'announcement headline'
        return 'plain announcement'
    if re.search(r'\U0001F9E9|мат в \d|ход (белых|черных|чёрных)|(белые|черные|чёрные) начинают', text, re.I):
        return 'puzzle prompt (position image + one-line task)'
    if '\U0001F947' in text:
        return 'medal list (\U0001F947\U0001F948\U0001F949 results)'
    if re.match(r'^\W*\d', line) or re.match(r'^\W*[^\W\d_]{0,3}\W*\d+[\d:,]*\s*(минут|секунд|пункт|лет|месяц|мил)', line):
        return 'number-first shock stat'
    if re.search(r'рекорд|самый молод|впервые|первый в истории|первая девушка', low):
        return 'record / superlative claim'
    if '\U0001F399' in text or re.search(r'[«"“][^»"”]{8,}[»"”]', text):
        return 'quote card (player voice)'
    if '?' in text:
        return 'question to the audience'
    if re.match(r'^(когда|по факту|мой |хотя бы)', low) or len(text) <= 30:
        return 'short caption / meme'
    if re.search(r'\u26A1|\U0001F3C6', line):
        return 'emoji-led news headline (\u26A1 / \U0001F3C6)'
    return 'plain news headline (name + verb + result)'


def brief(p):
    return {'msg_id': p['msg_id'], 'permalink': p['permalink'], 'posted_at': p['posted_at'], 'age_days': r(p['age_h'] / 24, 1), 'media': p['media_type'] + (f' x{p["album_size"]}' if p['album_size'] > 1 else ''),
            'views': p['views'], 'baseline_views': r(p['baseline'], 0), 'norm_views': r(p['norm']), 'reactions': p['reaction_total'], 'reactions_per_1k_views': r(p['rate'] * 1000, 1) if p['rate'] is not None else None,
            'text_len': p['text_len'], 'label': p.get('label'), 'hook': p.get('hook'), 'opening': p.get('opening'), 'cta': p.get('cta'), 'excerpt': excerpt(p)}


def excerpt(p, limit=160):
    text = re.sub(r'\s+', ' ', (p['text'] or (p['poll'] or {}).get('question') or '')).strip()
    return text[:limit] + ('…' if len(text) > limit else '')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('channels', nargs='+')
    parser.add_argument('--db', default=str(DB))
    parser.add_argument('--output', required=True)
    args = parser.parse_args(argv)
    out = {}
    for ch in args.channels:
        s = summarise(ch, db_path=args.db)
        s.pop('_posts'); s.pop('_top_ids')
        out[ch] = s
    Path(args.output).write_text(json.dumps(out, indent=2, ensure_ascii=False) + '\n')
    print('wrote', args.output)


if __name__ == '__main__':
    main()
