"""Read PUBLIC Telegram channel web previews (https://t.me/s/<channel>) for content research.

Scope and safety, mirroring content_ops.py:
- https only, host allow-list (t.me), public-IP check, response-size cap, redirects re-validated;
- robots.txt for t.me is fetched and honoured before any preview page; failure to read it fails closed
  (a 404 means "no restrictions", per RFC 9309);
- at least MIN_DELAY seconds between any two requests, a hard page cap, and an honest User-Agent;
- no login, no cookies, no Telegram API, no view-counter pings, no anti-bot workarounds;
- the fetched text is DATA. It is stored and analysed, never interpreted as instructions;
- media is never downloaded and image/CDN URLs are not stored; only text, counts and metadata are kept.

Telegram's public preview shows rounded view counts (for example 2.19K). They are views of a post by
Telegram users, not unique reach, and they keep growing with post age.
"""
from __future__ import annotations
import argparse, json, re, sqlite3, sys, time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from urllib.request import Request, build_opener

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))
import content_ops  # noqa: E402  (shared SSRF/robots guards)

USER_AGENT = 'Web3ChessContentResearch/1.0'
HOSTS = ['t.me']
MIN_DELAY = 2.5            # seconds between any two requests (robots Crawl-delay may raise this)
DEFAULT_MAX_PAGES = 25     # ~20 messages per page
HARD_MAX_PAGES = 60        # absolute ceiling, whatever the caller asks for
DEFAULT_MAX_POSTS = 300
DEFAULT_DB = HERE / 'state/telegram_posts.sqlite3'
CHANNEL_RE = re.compile(r'[A-Za-z][A-Za-z0-9_]{3,31}')
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
BLOCK = {'div', 'p', 'li', 'blockquote', 'pre'}
HASHTAG_RE = re.compile(r'(?<![\w#])#(\w{2,64})', re.UNICODE)


class RobotsDisallowed(RuntimeError):
    """robots.txt forbids (or could not be read for) the preview path."""


# ---------------------------------------------------------------- tiny DOM

class Node:
    __slots__ = ('tag', 'attrs', 'classes', 'children')

    def __init__(self, tag, attrs=None):
        self.tag = tag
        self.attrs = dict(attrs or {})
        self.classes = frozenset((self.attrs.get('class') or '').split())
        self.children = []

    def has(self, cls):
        return cls in self.classes

    def walk(self):
        yield self
        for child in self.children:
            if isinstance(child, Node):
                yield from child.walk()

    def find_all(self, cls=None, tag=None):
        return [n for n in self.walk() if (cls is None or cls in n.classes) and (tag is None or n.tag == tag)]

    def find(self, cls=None, tag=None):
        for n in self.walk():
            if (cls is None or cls in n.classes) and (tag is None or n.tag == tag):
                return n
        return None

    def direct_text(self):
        return ''.join(c for c in self.children if isinstance(c, str))

    def text(self):
        return ''.join(c if isinstance(c, str) else c.text() for c in self.children)


class _Builder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node('#root')
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, {k: (v or '') for k, v in attrs})
        self.stack[-1].children.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(Node(tag, {k: (v or '') for k, v in attrs}))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def parse_dom(markup):
    builder = _Builder()
    builder.feed(markup)
    builder.close()
    return builder.root


# ---------------------------------------------------------------- field parsers

def parse_count(value):
    """'537' -> 537, '12.3K' -> 12300, '1.2M' -> 1200000, '1,234' -> 1234; None if unparseable."""
    if value is None:
        return None
    match = re.fullmatch(r'\s*([0-9][0-9\s, ]*(?:\.[0-9]+)?)\s*([KkMmBb]?)\s*', str(value))
    if not match:
        return None
    number = float(re.sub(r'[\s, ]', '', match.group(1)))
    factor = {'': 1, 'k': 1_000, 'm': 1_000_000, 'b': 1_000_000_000}[match.group(2).lower()]
    return int(round(number * factor))


def parse_datetime(value):
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.strip().replace('Z', '+00:00'))
    except ValueError:
        return None
    return (dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)).astimezone(timezone.utc).isoformat()


def plain_text(node):
    """Plain text of a message-text node: <br> and blocks become newlines, emoji images become their glyph."""
    out = []

    def visit(n):
        for child in n.children:
            if isinstance(child, str):
                out.append(child)
            elif child.tag in {'script', 'style'}:
                continue
            elif child.tag == 'br':
                out.append('\n')
            elif child.tag in BLOCK:
                out.append('\n'); visit(child); out.append('\n')
            else:
                visit(child)

    visit(node)
    text = ''.join(out).replace(' ', ' ')
    text = '\n'.join(re.sub(r'[ \t]+', ' ', line).strip() for line in text.split('\n'))
    return re.sub(r'\n{3,}', '\n\n', text).strip()


def _own_text_blocks(msg):
    """Message text nodes excluding quoted reply text."""
    reply = msg.find('tgme_widget_message_reply')
    skip = set(id(n) for n in reply.walk()) if reply else set()
    return [n for n in msg.find_all('js-message_text') if id(n) not in skip]


def _links_in(node):
    return [a.attrs['href'] for a in node.find_all(tag='a') if a.attrs.get('href')]


def _is_outbound(href):
    if not href.startswith(('http://', 'https://')):
        return False
    p = urlsplit(href)
    if p.hostname == 't.me' and (p.path.startswith('/s/') or 'q' in parse_qs(p.query)):
        return False  # preview-internal hashtag/search links
    return True


def parse_reactions(msg):
    reactions = []
    box = msg.find('tgme_widget_message_reactions')
    if not box:
        return reactions
    for span in box.find_all('tgme_reaction'):
        count = parse_count(span.direct_text().strip()) if span.direct_text().strip() else None
        if count is None:  # custom-emoji markup may nest the number; take the trailing integer token
            match = re.search(r'([0-9][0-9.,]*[KkMm]?)\s*$', span.text().strip())
            count = parse_count(match.group(1)) if match else None
        paid = 'tgme_reaction_paid' in span.classes
        custom = span.find(tag='tg-emoji') is not None
        glyph = span.find(tag='b')
        emoji = '⭐' if paid else (glyph.text().strip() if glyph else '')
        reactions.append({'emoji': emoji, 'count': count or 0, 'paid': paid, 'custom': custom})
    return reactions


def _media(msg):
    """Return (primary media type, album size, ordered distinct kinds, video duration seconds)."""
    kinds = []
    album_size = 0
    grouped = msg.find('js-message_grouped')
    photos = msg.find_all('tgme_widget_message_photo_wrap')
    videos = [n for n in msg.find_all('tgme_widget_message_video_player')] + msg.find_all('tgme_widget_message_roundvideo_player')
    duration = None
    for v in videos:
        d = v.find('message_video_duration')
        if d and re.fullmatch(r'(\d+:)?\d{1,2}:\d{2}', d.text().strip()):
            parts = [int(x) for x in d.text().strip().split(':')]
            duration = sum(p * 60 ** i for i, p in enumerate(reversed(parts)))
            break
    if grouped:
        album_size = len(photos) + len(videos)
    if msg.find('tgme_widget_message_poll'):
        kinds.append('poll')
    if videos:
        kinds.append('video')
    if photos:
        kinds.append('photo')
    if msg.find('tgme_widget_message_document_wrap'):
        kinds.append('document')
    if msg.find('tgme_widget_message_voice') or msg.find('tgme_widget_message_audio_player'):
        kinds.append('voice')
    if msg.find('tgme_widget_message_sticker_wrap'):
        kinds.append('sticker')
    if msg.find('tgme_widget_message_link_preview'):
        kinds.append('link-preview')
    # "Please open Telegram to view this post" marks media the preview cannot render. The video player's own
    # hidden "not supported in your browser" fallback label is not a separate medium.
    label = msg.find('message_media_not_supported_label')
    if label and 'open telegram' in label.text().lower():
        kinds.append('other')
    primary = kinds[0] if kinds else 'none'
    return primary, album_size, kinds, duration


def parse_message(wrap, channel):
    """Parse one tgme_widget_message_wrap node. Returns a dict, or None when it is not a regular post."""
    msg = wrap.find('tgme_widget_message')
    if msg is None or not msg.attrs.get('data-post'):
        return None
    chan, _, wrap_id = msg.attrs['data-post'].partition('/')
    if not wrap_id.isdigit():
        return None
    date_link = msg.find('tgme_widget_message_date', tag='a')
    time_node = date_link.find(tag='time') if date_link else None
    posted_at = parse_datetime(time_node.attrs.get('datetime') if time_node else None)
    # Albums are merged in the preview; the date link points at the message that carries the caption.
    link_id = wrap_id
    if date_link and date_link.attrs.get('href'):
        tail = urlsplit(date_link.attrs['href']).path.rstrip('/').rsplit('/', 1)[-1]
        link_id = tail if tail.isdigit() else wrap_id
    primary, album_size, kinds, duration = _media(msg)
    blocks = _own_text_blocks(msg)
    text = plain_text(blocks[0]) if blocks else ''
    text_links = _links_in(blocks[0]) if blocks else []
    preview = msg.find('tgme_widget_message_link_preview')
    preview_info = None
    if preview:
        title = preview.find('link_preview_title')
        site = preview.find('link_preview_site_name')
        preview_info = {'url': preview.attrs.get('href', ''), 'site': site.text().strip() if site else '', 'title': title.text().strip() if title else ''}
    buttons = [{'text': plain_text(b), 'url': b.attrs.get('href', '')} for b in msg.find_all('tgme_widget_message_inline_button')]
    poll = None
    poll_node = msg.find('tgme_widget_message_poll')
    if poll_node:
        question = poll_node.find('tgme_widget_message_poll_question')
        ptype = poll_node.find('tgme_widget_message_poll_type')
        poll = {'question': plain_text(question) if question else '', 'type': ptype.text().strip() if ptype else '',
                'options': [{'text': (o.find('tgme_widget_message_poll_option_text').text().strip() if o.find('tgme_widget_message_poll_option_text') else ''),
                             'percent': parse_count((o.find('tgme_widget_message_poll_option_percent').text().strip().rstrip('%')) if o.find('tgme_widget_message_poll_option_percent') else None)}
                            for o in poll_node.find_all('tgme_widget_message_poll_option')]}
    views_node = msg.find('tgme_widget_message_views')
    voters_node = msg.find('tgme_widget_message_voters')
    replies_node = next((n for n in msg.walk() if any('replies' in c or 'comments' in c for c in n.classes) and re.search(r'\d', n.text())), None)
    forwards_node = next((n for n in msg.walk() if any('forwards' in c for c in n.classes) and re.search(r'\d', n.text())), None)
    fwd = msg.find('tgme_widget_message_forwarded_from')
    fwd_name = fwd.find('tgme_widget_message_forwarded_from_name') if fwd else None
    reply = msg.find('tgme_widget_message_reply')
    reply_to = None
    if reply and reply.attrs.get('href'):
        tail = urlsplit(reply.attrs['href']).path.rstrip('/').rsplit('/', 1)[-1]
        reply_to = int(tail) if tail.isdigit() else None
    meta_nodes = msg.find_all('tgme_widget_message_meta')
    edited = any(re.search(r'\bedited\b', n.direct_text(), re.I) for n in meta_nodes) or any('tgme_widget_message_edited' in n.classes for n in msg.walk())
    hashtags = []
    for tag in HASHTAG_RE.findall(text):
        if tag.lower() not in [h.lower() for h in hashtags]:
            hashtags.append(tag)
    outbound = []
    for href in text_links + ([preview_info['url']] if preview_info and preview_info['url'] else []) + [b['url'] for b in buttons]:
        if _is_outbound(href) and href not in outbound:
            outbound.append(href)
    reactions = parse_reactions(msg)
    return {
        'channel': chan or channel,
        'msg_id': int(link_id),
        'first_id': int(wrap_id),
        'permalink': f'https://t.me/{chan or channel}/{link_id}',
        'posted_at': posted_at,
        'service': 'service_message' in msg.classes,
        'text': text,
        'media_type': primary,
        'media_kinds': kinds,
        'album_size': album_size,
        'video_seconds': duration,
        'views': parse_count(views_node.text().strip()) if views_node else None,
        'views_raw': views_node.text().strip() if views_node else None,
        'voters': parse_count(voters_node.text().strip()) if voters_node else None,
        'replies': parse_count(re.search(r'[0-9][0-9.,]*[KkMm]?', replies_node.text()).group(0)) if replies_node else None,
        'forwards': parse_count(re.search(r'[0-9][0-9.,]*[KkMm]?', forwards_node.text()).group(0)) if forwards_node else None,
        'reactions': reactions,
        'reaction_total': sum(r['count'] for r in reactions),
        'is_forward': fwd is not None,
        'forwarded_from': fwd_name.text().strip() if fwd_name else (fwd.text().strip()[:120] if fwd else None),
        'reply_to': reply_to,
        'edited': bool(edited),
        'hashtags': hashtags,
        'outbound_links': outbound,
        'buttons': buttons,
        'link_preview': preview_info,
        'poll': poll,
    }


def parse_page(markup, channel):
    """Parse a preview page: returns {'info': channel metadata, 'posts': [...], 'service': n, 'before': next older id}."""
    root = parse_dom(markup)
    title_node = root.find('tgme_channel_info_header_title') or root.find('tgme_header_title')
    counters = {}
    for c in root.find_all('tgme_channel_info_counter'):
        value, kind = c.find('counter_value'), c.find('counter_type')
        if value and kind:
            counters[kind.text().strip()] = parse_count(value.text().strip())
    description = root.find('tgme_channel_info_description')
    info = {'channel': channel, 'title': title_node.text().strip() if title_node else None,
            'subscribers': counters.get('subscribers'), 'counters': counters,
            'description': plain_text(description)[:500] if description else None}
    posts, service = [], 0
    for wrap in root.find_all('tgme_widget_message_wrap'):
        post = parse_message(wrap, channel)
        if post is None:
            continue
        if post['service']:
            service += 1
            continue
        posts.append(post)
    more = root.find('tme_messages_more')
    before = None
    if more is not None:
        raw = more.attrs.get('data-before') or (parse_qs(urlsplit(more.attrs.get('href', '')).query).get('before') or [''])[0]
        before = int(raw) if str(raw).isdigit() else None
    return {'info': info, 'posts': posts, 'service': service, 'before': before}


# ---------------------------------------------------------------- network (rate-limited, robots-aware)

class PoliteFetcher:
    """Fetch preview pages with robots.txt check, minimum delay and the shared SSRF guards."""

    def __init__(self, delay=MIN_DELAY, agent=USER_AGENT, sleep=time.sleep, clock=time.monotonic):
        self.delay = max(float(delay), MIN_DELAY)
        self.agent, self.sleep, self.clock = agent, sleep, clock
        self._last = None
        self._robots_ok = None
        self.requests = 0

    def _wait(self):
        if self._last is not None:
            remaining = self.delay - (self.clock() - self._last)
            if remaining > 0:
                self.sleep(remaining)
        self._last = self.clock()
        self.requests += 1

    def check_robots(self, url):
        if self._robots_ok is None:
            self._wait()
            allowed, crawl_delay = content_ops.robots_allowed(url, HOSTS, self.agent)
            if crawl_delay > 60:
                allowed = False
            self.delay = max(self.delay, float(crawl_delay))
            self._robots_ok = bool(allowed)
        if not self._robots_ok:
            raise RobotsDisallowed('robots.txt for t.me disallows or could not be read; use manual research')

    def __call__(self, url):
        self.check_robots(url)
        self._wait()
        content_ops.validate_url(url, HOSTS)
        request = Request(url, headers={'User-Agent': self.agent, 'Accept': 'text/html'})
        with build_opener(content_ops.SafeRedirect(HOSTS)).open(request, timeout=15) as response:
            data = response.read(content_ops.MAX_BYTES + 1)
        if len(data) > content_ops.MAX_BYTES:
            raise ValueError('Preview page exceeds response-size limit')
        return data.decode('utf-8', 'replace')


def page_url(channel, before=None):
    if not CHANNEL_RE.fullmatch(channel):
        raise ValueError(f'Not a valid public channel username: {channel!r}')
    return f'https://t.me/s/{channel}' + (f'?before={int(before)}' if before else '')


# ---------------------------------------------------------------- storage

SCHEMA = [
    '''CREATE TABLE IF NOT EXISTS channels(channel TEXT PRIMARY KEY, title TEXT, subscribers INTEGER, counters TEXT,
        description TEXT, observed_at TEXT)''',
    '''CREATE TABLE IF NOT EXISTS posts(channel TEXT, msg_id INTEGER, permalink TEXT, posted_at TEXT, text TEXT,
        media_type TEXT, media_kinds TEXT, album_size INTEGER, video_seconds INTEGER, views INTEGER, views_raw TEXT,
        voters INTEGER, replies INTEGER, forwards INTEGER, reactions TEXT, reaction_total INTEGER, is_forward INTEGER,
        forwarded_from TEXT, reply_to INTEGER, edited INTEGER, hashtags TEXT, outbound_links TEXT, buttons TEXT,
        link_preview TEXT, poll TEXT, first_seen TEXT, last_seen TEXT, PRIMARY KEY(channel,msg_id))''',
    '''CREATE TABLE IF NOT EXISTS observations(channel TEXT, msg_id INTEGER, observed_at TEXT, views INTEGER,
        reaction_total INTEGER, PRIMARY KEY(channel,msg_id,observed_at))''',
    '''CREATE TABLE IF NOT EXISTS runs(id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT, started_at TEXT, pages INTEGER,
        posts INTEGER, stopped_because TEXT)''',
]


def open_db(path=DEFAULT_DB):
    path = Path(path)
    if str(path) != ':memory:':
        path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(str(path))
    for statement in SCHEMA:
        db.execute(statement)
    return db


def store(db, info, posts, observed_at):
    counts = {'new': 0, 'updated': 0}
    db.execute('INSERT INTO channels VALUES(?,?,?,?,?,?) ON CONFLICT(channel) DO UPDATE SET title=excluded.title,subscribers=excluded.subscribers,'
               'counters=excluded.counters,description=excluded.description,observed_at=excluded.observed_at',
               (info['channel'], info.get('title'), info.get('subscribers'), json.dumps(info.get('counters') or {}), info.get('description'), observed_at))
    for p in posts:
        existed = db.execute('SELECT 1 FROM posts WHERE channel=? AND msg_id=?', (p['channel'], p['msg_id'])).fetchone()
        counts['updated' if existed else 'new'] += 1
        values = (p['channel'], p['msg_id'], p['permalink'], p['posted_at'], p['text'], p['media_type'], json.dumps(p['media_kinds']),
                  p['album_size'], p['video_seconds'], p['views'], p['views_raw'], p['voters'], p['replies'], p['forwards'],
                  json.dumps(p['reactions'], ensure_ascii=False), p['reaction_total'], int(p['is_forward']), p['forwarded_from'],
                  p['reply_to'], int(p['edited']), json.dumps(p['hashtags'], ensure_ascii=False), json.dumps(p['outbound_links']),
                  json.dumps(p['buttons'], ensure_ascii=False), json.dumps(p['link_preview'], ensure_ascii=False),
                  json.dumps(p['poll'], ensure_ascii=False), observed_at, observed_at)
        db.execute('INSERT INTO posts VALUES(' + ','.join('?' * 27) + ') ON CONFLICT(channel,msg_id) DO UPDATE SET '
                   'permalink=excluded.permalink,posted_at=excluded.posted_at,text=excluded.text,media_type=excluded.media_type,'
                   'media_kinds=excluded.media_kinds,album_size=excluded.album_size,video_seconds=excluded.video_seconds,'
                   'views=excluded.views,views_raw=excluded.views_raw,voters=excluded.voters,replies=excluded.replies,'
                   'forwards=excluded.forwards,reactions=excluded.reactions,reaction_total=excluded.reaction_total,'
                   'is_forward=excluded.is_forward,forwarded_from=excluded.forwarded_from,reply_to=excluded.reply_to,'
                   'edited=excluded.edited,hashtags=excluded.hashtags,outbound_links=excluded.outbound_links,'
                   'buttons=excluded.buttons,link_preview=excluded.link_preview,poll=excluded.poll,last_seen=excluded.last_seen', values)
        db.execute('INSERT OR IGNORE INTO observations VALUES(?,?,?,?,?)', (p['channel'], p['msg_id'], observed_at, p['views'], p['reaction_total']))
    db.commit()
    return counts


# ---------------------------------------------------------------- orchestration

def scrape_channel(channel, db, fetcher, max_posts=DEFAULT_MAX_POSTS, max_pages=DEFAULT_MAX_PAGES, now=None):
    """Walk a channel preview backwards from the newest post. Stops at max_posts, max_pages or the first message."""
    max_pages = max(1, min(int(max_pages), HARD_MAX_PAGES))
    started = (now or datetime.now(timezone.utc)).isoformat()
    seen, before, pages, stopped, info = {}, None, 0, 'max_pages', None
    totals = {'new': 0, 'updated': 0}
    service = 0
    while pages < max_pages:
        markup = fetcher(page_url(channel, before))
        pages += 1
        page = parse_page(markup, channel)
        info = info or page['info']
        service += page['service']
        fresh = [p for p in page['posts'] if p['msg_id'] not in seen]
        if not page['posts'] and pages == 1:
            stopped = 'no_public_preview'  # private channel, preview disabled, or unknown username
            break
        for p in fresh:
            seen[p['msg_id']] = p
        if fresh:
            for key, value in store(db, page['info'], fresh, started).items():
                totals[key] += value
        if len(seen) >= max_posts:
            stopped = 'max_posts'
            break
        next_before = page['before']
        if next_before is None:
            stopped = 'start_of_channel'  # no "older messages" link: nothing earlier is exposed
            break
        if not fresh or (before is not None and next_before >= before):
            stopped = 'no_progress'  # defensive: the same page came back, do not loop
            break
        before = next_before
    db.execute('INSERT INTO runs(channel,started_at,pages,posts,stopped_because) VALUES(?,?,?,?,?)', (channel, started, pages, len(seen), stopped))
    db.commit()
    return {'channel': channel, 'title': (info or {}).get('title'), 'subscribers': (info or {}).get('subscribers'), 'pages': pages,
            'posts': len(seen), 'service_messages_skipped': service, 'stopped_because': stopped, **totals}


def run(args):
    """Entry point shared by `telegram_public.py scrape` and `content_ops.py scrape-telegram`."""
    fetcher = PoliteFetcher(delay=args.delay)
    db = open_db(args.db)
    results = []
    try:
        for channel in args.channels:
            try:
                results.append(scrape_channel(channel.lstrip('@'), db, fetcher, args.max_posts, args.max_pages))
            except RobotsDisallowed as exc:
                results.append({'channel': channel, 'error': str(exc)})
                break
            except Exception as exc:  # per-channel failure must not hide the others
                results.append({'channel': channel, 'error': str(exc)[:240]})
    finally:
        db.close()
    print(json.dumps({'db': str(args.db), 'requests': fetcher.requests, 'channels': results}, indent=2, ensure_ascii=False))
    return results


def add_arguments(parser):
    parser.add_argument('channels', nargs='+', help='public channel usernames, e.g. chesscom_ru')
    parser.add_argument('--max-posts', type=int, default=DEFAULT_MAX_POSTS)
    parser.add_argument('--max-pages', type=int, default=DEFAULT_MAX_PAGES, help=f'hard ceiling {HARD_MAX_PAGES}')
    parser.add_argument('--delay', type=float, default=MIN_DELAY, help=f'seconds between requests (never below {MIN_DELAY})')
    parser.add_argument('--db', default=str(DEFAULT_DB))
    parser.set_defaults(run=run)
    return parser


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    add_arguments(parser.add_subparsers(dest='command', required=True).add_parser('scrape'))
    args = parser.parse_args(argv)
    args.run(args)


if __name__ == '__main__':
    main()
