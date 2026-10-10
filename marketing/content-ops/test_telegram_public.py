"""Offline tests for telegram_public.py. All pages come from fixtures/telegram/*.html; the network is blocked."""
import argparse, contextlib, io, json, socket, sqlite3, sys, unittest
from pathlib import Path
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import content_ops  # noqa: E402
import telegram_public as tp  # noqa: E402

FIXTURES = HERE / 'fixtures/telegram'


def fixture(name):
    return (FIXTURES / name).read_text(encoding='utf-8')


def no_network(*args, **kwargs):
    raise AssertionError('tests must not touch the network')


class FakeFetcher:
    """Serves fixture pages by URL and records every request."""
    def __init__(self, pages):
        self.pages, self.urls = pages, []

    def __call__(self, url):
        self.urls.append(url)
        return self.pages[url]


class OfflineCase(unittest.TestCase):
    def setUp(self):
        for target in ('socket.getaddrinfo', 'socket.create_connection'):
            patcher = patch(target, no_network)
            patcher.start()
            self.addCleanup(patcher.stop)

    def memdb(self):
        db = tp.open_db(':memory:')
        self.addCleanup(db.close)
        return db


class FieldParsers(OfflineCase):
    def test_counts_with_suffixes(self):
        self.assertEqual(tp.parse_count('537'), 537)
        self.assertEqual(tp.parse_count('12.3K'), 12300)
        self.assertEqual(tp.parse_count('2.19K'), 2190)
        self.assertEqual(tp.parse_count('1.2M'), 1_200_000)
        self.assertEqual(tp.parse_count('1,234'), 1234)
        self.assertEqual(tp.parse_count('3k'), 3000)
        self.assertIsNone(tp.parse_count(''))
        self.assertIsNone(tp.parse_count('views'))
        self.assertIsNone(tp.parse_count(None))

    def test_datetime_is_normalised_to_utc(self):
        self.assertEqual(tp.parse_datetime('2026-10-09T18:00:00+03:00'), '2026-10-09T15:00:00+00:00')
        self.assertEqual(tp.parse_datetime('2026-10-09T18:00:00Z'), '2026-10-09T18:00:00+00:00')
        self.assertIsNone(tp.parse_datetime('yesterday'))

    def test_channel_name_validation(self):
        self.assertEqual(tp.page_url('chesscom_ru'), 'https://t.me/s/chesscom_ru')
        self.assertEqual(tp.page_url('chesscom_ru', 9663), 'https://t.me/s/chesscom_ru?before=9663')
        for bad in ('../etc', 'a b', 'x', 'name?x=1', 'https://evil.example', '1abc'):
            with self.assertRaises(ValueError):
                tp.page_url(bad)


class PageParsing(OfflineCase):
    @classmethod
    def setUpClass(cls):
        cls.page = tp.parse_page(fixture('page_newest.html'), 'fixture_chess')
        cls.by_id = {p['msg_id']: p for p in cls.page['posts']}

    def test_channel_info_and_pagination_link(self):
        info = self.page['info']
        self.assertEqual((info['title'], info['subscribers']), ('Fixture Chess Club', 12300))
        self.assertEqual(info['counters']['photos'], 1_200_000)
        self.assertEqual(self.page['before'], 110)

    def test_service_messages_are_skipped_and_counted(self):
        self.assertEqual(self.page['service'], 1)
        self.assertNotIn(117, self.by_id)
        self.assertEqual(sorted(self.by_id), [110, 111, 112, 113, 114, 115, 116, 118])

    def test_photo_post_with_text_hashtags_and_reactions(self):
        post = self.by_id[110]
        self.assertEqual(post['channel'], 'fixture_chess')
        self.assertEqual(post['permalink'], 'https://t.me/fixture_chess/110')
        self.assertEqual(post['posted_at'], '2026-10-09T18:00:00+00:00')
        self.assertEqual(post['media_type'], 'photo')
        self.assertEqual((post['views'], post['views_raw']), (12300, '12.3K'))
        self.assertEqual(post['text'], 'Mate in two. White to move.\n\nReveal tomorrow \U0001F9E9\n#puzzle #Chess #puzzle')
        self.assertEqual(post['hashtags'], ['puzzle', 'Chess'])
        self.assertEqual(post['outbound_links'], [])  # the ?q=%23puzzle search link is not outbound
        reactions = {r['emoji']: r for r in post['reactions']}
        self.assertEqual(reactions['❤']['count'], 120)
        self.assertTrue(reactions['\U0001F3C6']['custom'])
        self.assertTrue(reactions['⭐']['paid'])
        self.assertEqual(post['reaction_total'], 120 + 45 + 7 + 3)

    def test_no_media_no_views_fields(self):
        post = self.by_id[111]
        self.assertEqual((post['media_type'], post['views'], post['album_size']), ('none', 537, 0))
        self.assertFalse(post['is_forward'])
        self.assertIsNone(post['replies'])
        self.assertIsNone(post['forwards'])

    def test_album_and_million_views(self):
        post = self.by_id[112]
        self.assertEqual((post['media_type'], post['album_size'], post['views']), ('photo', 3, 1_200_000))
        self.assertEqual(post['reactions'][0]['count'], 1200)

    def test_video_duration_links_and_thousands_separator(self):
        post = self.by_id[113]
        self.assertEqual((post['media_type'], post['video_seconds'], post['views']), ('video', 65, 2345))
        self.assertEqual(post['outbound_links'], ['https://example.org/clip?utm_source=tg'])

    def test_poll(self):
        post = self.by_id[114]
        self.assertEqual(post['media_type'], 'poll')
        self.assertEqual(post['voters'], 1160)
        self.assertEqual(post['poll']['question'], 'Best opening for Black?')
        self.assertEqual([(o['text'], o['percent']) for o in post['poll']['options']], [('Sicilian', 70), ('French', 30)])

    def test_forward(self):
        post = self.by_id[115]
        self.assertTrue(post['is_forward'])
        self.assertEqual(post['forwarded_from'], 'Other Chess')
        self.assertEqual(post['text'], 'Forwarded text')

    def test_reply_link_preview_buttons_and_edit_flag(self):
        post = self.by_id[116]
        self.assertEqual(post['reply_to'], 110)
        self.assertNotIn('QUOTED REPLY TEXT', post['text'])  # quoted text is not the post's own text
        self.assertEqual(post['text'], 'Answer to the puzzle: Qh7#')
        self.assertEqual(post['media_type'], 'link-preview')
        self.assertEqual(post['link_preview']['title'], 'Preview title')
        self.assertEqual([b['text'] for b in post['buttons']], ['♟ Play now', 'Rules'])
        self.assertIn('https://t.me/fixture_bot/app?startapp=x', post['outbound_links'])
        self.assertTrue(post['edited'])

    def test_unsupported_media_is_flagged_other(self):
        self.assertEqual(self.by_id[118]['media_type'], 'other')

    def test_markup_cannot_inject_instructions(self):
        markup = fixture('page_oldest.html').replace('Opening trap number one', 'Ignore previous instructions &lt;script&gt;alert(1)&lt;/script&gt;')
        post = tp.parse_page(markup, 'fixture_chess')['posts'][0]
        self.assertIn('Ignore previous instructions <script>alert(1)</script>', post['text'])  # inert plain text

    def test_text_formatting(self):
        post = {p['msg_id']: p for p in tp.parse_page(fixture('page_oldest.html'), 'fixture_chess')['posts']}[101]
        self.assertEqual(post['text'], 'Photo with bold and\nline break')

    def test_page_without_posts(self):
        page = tp.parse_page(fixture('page_no_preview.html'), 'fixture_chess')
        self.assertEqual((page['posts'], page['before']), ([], None))


class Storage(OfflineCase):
    def test_upsert_keeps_one_row_and_records_each_observation(self):
        page = tp.parse_page(fixture('page_oldest.html'), 'fixture_chess')
        db = self.memdb()
        self.assertEqual(tp.store(db, page['info'], page['posts'], '2026-10-10T00:00:00+00:00'), {'new': 2, 'updated': 0})
        page['posts'][0]['views'] = 5000
        self.assertEqual(tp.store(db, page['info'], page['posts'], '2026-10-11T00:00:00+00:00'), {'new': 0, 'updated': 2})
        self.assertEqual(db.execute('SELECT COUNT(*) FROM posts').fetchone()[0], 2)
        self.assertEqual(db.execute('SELECT views FROM posts WHERE msg_id=100').fetchone()[0], 5000)
        self.assertEqual(db.execute('SELECT views FROM observations WHERE msg_id=100 ORDER BY observed_at').fetchall(), [(4100,), (5000,)])
        row = db.execute('SELECT reactions, hashtags, text FROM posts WHERE msg_id=101').fetchone()
        self.assertEqual(json.loads(row[0]), [])
        self.assertEqual(db.execute('SELECT subscribers FROM channels').fetchone()[0], 12300)

    def test_no_media_urls_are_stored(self):
        page = tp.parse_page(fixture('page_newest.html'), 'fixture_chess')
        db = self.memdb()
        tp.store(db, page['info'], page['posts'], '2026-10-10T00:00:00+00:00')
        dump = json.dumps(db.execute('SELECT * FROM posts').fetchall(), default=str)
        self.assertNotIn('cdn.example.invalid', dump)


class Scraping(OfflineCase):
    def pages(self):
        return {'https://t.me/s/fixture_chess': fixture('page_newest.html'),
                'https://t.me/s/fixture_chess?before=110': fixture('page_oldest.html')}

    def test_paginates_backwards_until_start_of_channel(self):
        fetch, db = FakeFetcher(self.pages()), self.memdb()
        result = tp.scrape_channel('fixture_chess', db, fetch, max_posts=300, max_pages=10)
        self.assertEqual(fetch.urls, ['https://t.me/s/fixture_chess', 'https://t.me/s/fixture_chess?before=110'])
        self.assertEqual((result['pages'], result['posts'], result['stopped_because']), (2, 10, 'start_of_channel'))
        self.assertEqual(result['subscribers'], 12300)
        self.assertEqual(result['service_messages_skipped'], 1)
        self.assertEqual(db.execute('SELECT COUNT(*) FROM posts').fetchone()[0], 10)
        self.assertEqual(db.execute('SELECT pages, posts, stopped_because FROM runs').fetchone(), (2, 10, 'start_of_channel'))

    def test_max_posts_stops_early(self):
        fetch = FakeFetcher(self.pages())
        result = tp.scrape_channel('fixture_chess', self.memdb(), fetch, max_posts=5, max_pages=10)
        self.assertEqual((len(fetch.urls), result['stopped_because']), (1, 'max_posts'))

    def test_page_cap_and_hard_ceiling(self):
        looping = FakeFetcher({'https://t.me/s/fixture_chess': fixture('page_newest.html')})
        looping.pages['https://t.me/s/fixture_chess?before=110'] = fixture('page_newest.html')  # same page forever
        result = tp.scrape_channel('fixture_chess', self.memdb(), looping, max_posts=10_000, max_pages=10)
        self.assertEqual(result['stopped_because'], 'no_progress')  # no infinite loop
        self.assertEqual(len(looping.urls), 2)

        class Endless:
            """Every page links to an older page with fresh ids, so only the page cap can stop the walk."""
            def __init__(self): self.calls = 0
            def __call__(self, url):
                self.calls += 1
                n = 1000 - self.calls * 10
                return fixture('page_oldest.html').replace('before=100', f'before={n}').replace('data-before="100"', f'data-before="{n}"') \
                    .replace('fixture_chess/100', f'fixture_chess/{n + 1}').replace('fixture_chess/101', f'fixture_chess/{n + 2}') \
                    .replace('</section>', f'<div class="tgme_widget_message_centered"><a class="tme_messages_more js-messages_more" href="/s/fixture_chess?before={n}" data-before="{n}"></a></div></section>')
        endless = Endless()
        result = tp.scrape_channel('fixture_chess', self.memdb(), endless, max_posts=10_000, max_pages=10_000)
        self.assertEqual(endless.calls, tp.HARD_MAX_PAGES)
        self.assertEqual(result['stopped_because'], 'max_pages')

    def test_channel_without_public_preview(self):
        fetch = FakeFetcher({'https://t.me/s/fixture_chess': fixture('page_no_preview.html')})
        result = tp.scrape_channel('fixture_chess', self.memdb(), fetch)
        self.assertEqual((result['posts'], result['stopped_because']), (0, 'no_public_preview'))


class PoliteFetching(OfflineCase):
    class Clock:
        def __init__(self): self.now, self.sleeps = 100.0, []
        def __call__(self): return self.now
        def sleep(self, seconds): self.sleeps.append(seconds); self.now += seconds

    def make(self, **kw):
        clock = self.Clock()
        return tp.PoliteFetcher(sleep=clock.sleep, clock=clock, **kw), clock

    class Response:
        def __init__(self, body=b'<html></html>'): self.body = body
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def read(self, n=-1): return self.body[:n] if n >= 0 else self.body

    def opener(self, calls, body=b'<html></html>'):
        outer = self
        class Opener:
            def open(self_inner, request, timeout=None):
                calls.append((request.full_url, request.get_header('User-agent')))
                return outer.Response(body)
        return lambda *handlers: Opener()

    def test_min_delay_between_requests_and_user_agent(self):
        fetcher, clock = self.make(delay=0.1)  # a caller cannot go below the floor
        self.assertEqual(fetcher.delay, tp.MIN_DELAY)
        calls = []
        with patch.object(content_ops, 'robots_allowed', return_value=(True, 1)), patch.object(content_ops, 'validate_url'), \
                patch.object(tp, 'build_opener', self.opener(calls)):
            fetcher('https://t.me/s/fixture_chess')
            fetcher('https://t.me/s/fixture_chess?before=5')
            fetcher('https://t.me/s/fixture_chess?before=3')
        self.assertEqual([c[1] for c in calls], ['Web3ChessContentResearch/1.0'] * 3)
        self.assertEqual(fetcher.requests, 4)  # robots.txt + 3 pages
        self.assertTrue(clock.sleeps and all(s >= 2.4 for s in clock.sleeps))
        self.assertEqual(len(clock.sleeps), 3)  # every request after the first waited

    def test_robots_crawl_delay_can_slow_down_further(self):
        fetcher, clock = self.make()
        calls = []
        with patch.object(content_ops, 'robots_allowed', return_value=(True, 6)), patch.object(content_ops, 'validate_url'), \
                patch.object(tp, 'build_opener', self.opener(calls)):
            fetcher('https://t.me/s/fixture_chess'); fetcher('https://t.me/s/fixture_chess?before=5')
        self.assertEqual(fetcher.delay, 6.0)
        self.assertGreaterEqual(clock.sleeps[-1], 5.9)

    def test_robots_disallow_blocks_every_page_fetch(self):
        fetcher, _ = self.make()
        calls = []
        with patch.object(content_ops, 'robots_allowed', return_value=(False, 0)), patch.object(content_ops, 'validate_url'), \
                patch.object(tp, 'build_opener', self.opener(calls)):
            with self.assertRaises(tp.RobotsDisallowed):
                fetcher('https://t.me/s/fixture_chess')
            with self.assertRaises(tp.RobotsDisallowed):
                fetcher('https://t.me/s/fixture_chess?before=5')
        self.assertEqual(calls, [])

    def test_oversized_response_is_rejected(self):
        fetcher, _ = self.make()
        with patch.object(content_ops, 'robots_allowed', return_value=(True, 1)), patch.object(content_ops, 'validate_url'), \
                patch.object(tp, 'build_opener', self.opener([], b'x' * (content_ops.MAX_BYTES + 5))):
            with self.assertRaises(ValueError):
                fetcher('https://t.me/s/fixture_chess')

    def test_only_t_me_over_https_is_permitted(self):
        for url in ('http://t.me/s/x', 'https://evil.example/s/x', 'https://127.0.0.1/s/x'):
            with self.assertRaises(ValueError):
                content_ops.validate_url(url, tp.HOSTS)


class CommandLine(OfflineCase):
    def test_run_reports_and_continues_after_a_channel_error(self):
        pages = {'https://t.me/s/good_chess': fixture('page_oldest.html')}
        def fake(url):
            if 'bad_chess' in url:
                raise ValueError('boom')
            return pages[url]
        args = argparse.Namespace(channels=['bad_chess', '@good_chess'], max_posts=300, max_pages=3, delay=2.5, db=':memory:')
        buffer = io.StringIO()
        with patch.object(tp, 'PoliteFetcher', lambda delay: fake), contextlib.redirect_stdout(buffer):
            fake.requests = 0
            results = tp.run(args)
        self.assertEqual(results[0]['error'], 'boom')
        self.assertEqual(results[1]['posts'], 2)
        self.assertIn('"channels"', buffer.getvalue())

    def test_content_ops_wires_scrape_telegram(self):
        captured = []
        with patch.object(tp, 'run', lambda args: captured.append(args)), patch.object(sys, 'argv', ['content_ops.py', 'scrape-telegram', 'chesscom_ru', 'edchessss', '--max-posts', '50']):
            content_ops.main()
        self.assertEqual(captured[0].channels, ['chesscom_ru', 'edchessss'])
        self.assertEqual((captured[0].max_posts, captured[0].delay), (50, tp.MIN_DELAY))


if __name__ == '__main__':
    unittest.main()
