import json
import sys
import tempfile
import unittest
from datetime import date, datetime, timezone
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import discovery
import keyword_strategy
from agents.scraper import ScraperAgent
from agents.orchestrator import ContentEngineOrchestrator
from agents.publisher import PublisherAgent
from pipeline import queue
from pipeline import writer
from pipeline import telegram_publisher
from pipeline import x_publisher


class DiscoveryTests(unittest.TestCase):
    def test_portfolio_has_150_unique_queries_and_no_invented_volume(self):
        rows = keyword_strategy.prioritize()
        self.assertEqual(len(rows), 150)
        self.assertEqual(len({r['query'].casefold() for r in rows}), 150)
        self.assertTrue(all(r['search_console'] is None for r in rows))

    def test_keyword_mapping_suggests_existing_page_without_claiming_coverage(self):
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, 'guide.json').write_text(json.dumps({'slug': 'blitz-guide', 'title': 'How to get better at blitz chess'}))
            row = keyword_strategy.article_candidates([{'query': 'how to get better at blitz chess'}], Path(directory))[0]
            self.assertEqual(row['existing_page_candidates'][0]['slug'], 'blitz-guide')
            self.assertEqual(row['editorial_status'], 'review_existing_page')

    def test_search_console_join(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'gsc.csv'
            path.write_text('Query,Clicks,Impressions,CTR,Position\nplay chess on Telegram,7,200,3.5%,8.2\n')
            row = next(r for r in keyword_strategy.prioritize(path) if r['query'] == 'play chess on Telegram')
            self.assertEqual(row['search_console']['impressions'], 200)

    def test_video_outlier_uses_same_channel_baseline(self):
        now = datetime(2026, 10, 22, 12, tzinfo=timezone.utc)
        videos = [{'video_id': str(i), 'channel_id': 'a', 'published_at': '2026-10-22T02:00:00Z', 'views': views} for i, views in enumerate((100, 120, 1000))]
        ranked = discovery.rank_videos(videos, now)
        self.assertEqual(ranked[0]['video_id'], '2')
        self.assertEqual(ranked[0]['signal'], 'outlier')
        self.assertIsNone(discovery.rank_videos(videos[:2], now)[0]['velocity_lift'])

    def test_feed_scout_uses_collector_report(self):
        agent = ScraperAgent()
        with patch('agents.scraper.content_ops.collect', return_value={'sources': [{'id': 'x', 'error': 'unavailable'}], 'candidates': [{'title': 'A'}, {'title': 'B'}]}) as collect:
            self.assertEqual(len(agent.fetch_feed_trends(limit=1)), 1)
            self.assertEqual(agent.feed_status[0]['error'], 'unavailable')
            self.assertTrue(collect.call_args.kwargs['quiet'])

    def test_competitor_preview_has_source_and_unknown_counts(self):
        agent = ScraperAgent()
        post = {'text': 'Move?', 'views': None, 'posted_at': '2026-10-22T10:00:00Z', 'permalink': 'https://t.me/chesscom_ru/1'}
        with patch('agents.scraper.telegram_public.PoliteFetcher', return_value=lambda url: '<html></html>'), patch('agents.scraper.telegram_public.parse_page', return_value={'posts': [post]}):
            rows = agent.inspect_telegram_competitors(['chesscom_ru'])
        self.assertIsNone(rows[0]['views'])
        self.assertEqual(rows[0]['permalink'], post['permalink'])

    def test_schedule_is_six_slots_three_hours_apart(self):
        cfg = json.loads((Path(__file__).parent / 'pipeline/config.json').read_text())
        for channel in ('telegram', 'x'):
            times = cfg[channel]['slots_utc']
            self.assertEqual(len(times), 6)
            minutes = [int(t[:2]) * 60 + int(t[3:]) for t in times]
            self.assertEqual([b - a for a, b in zip(minutes, minutes[1:])], [180] * 5)
            self.assertTrue(all(len(rotation) == 6 for rotation in cfg[channel]['rotation'].values()))
            self.assertEqual(cfg['mode'][channel], 'review')

    def test_x_batch_fills_planned_slots_without_rewriting_reviewed_post(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(queue, 'QUEUE', Path(directory)):
            day = date(2099, 5, 1)
            queue.plan_day(day, 'x_post')
            agent = ContentEngineOrchestrator(plan_date=day)
            batch = agent.generate_x_daily_batch(render_images=False)
            self.assertEqual(batch['posts_created'], 6)
            first = queue.load(f'{day}-x-1')
            self.assertEqual(first['status'], 'draft')
            queue.set_status(first, 'approved', approved_by='editor')
            agent.generate_x_daily_batch(render_images=False)
            self.assertEqual(queue.load(first['id'])['status'], 'approved')
            self.assertEqual(len(queue.all_entries(kind='x_post', day=str(day))), 6)

    def test_x_brief_uses_x_contract_and_marks_research_unverified(self):
        entry = {'id': '2099-05-01-x-1', 'kind': 'x_post', 'date': '2099-05-01', 'slot': 1,
                 'category': 'Tactics', 'scheduled_at': '2099-05-01T06:00:00Z'}
        brief = writer.brief_for(entry, research={'captured_at': '2099-05-01T00:00:00Z',
                                                   'news': [{'title': 'Result', 'url': 'https://example.com/story'}]})
        self.assertIn('280', brief['output']['text'])
        self.assertTrue(brief['research']['verification_required'])
        self.assertEqual(brief['research']['news_candidates'][0]['url'], 'https://example.com/story')

    def test_single_telegram_dispatch_rejects_unapproved_item(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(queue, 'QUEUE', Path(directory)):
            queue.save({'id': '2099-05-01-tg-1', 'date': '2099-05-01', 'kind': 'telegram',
                        'status': 'draft', 'text': 'Draft'})
            with self.assertRaisesRegex(ValueError, 'approved'):
                telegram_publisher.publish_post_by_id('2099-05-01-tg-1', dry_run=True)

    def test_daily_caps_block_approved_backlog(self):
        now = datetime(2099, 5, 1, 22, tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as directory, patch.object(queue, 'QUEUE', Path(directory)), patch.object(queue, 'utcnow', return_value=now):
            for kind, prefix in (('telegram', 'tg'), ('x_post', 'x')):
                for slot in range(1, 7):
                    queue.save({'id': f'2099-05-01-{prefix}-{slot}', 'date': '2099-05-01', 'kind': kind,
                                'status': 'published', 'published': {'at': '2099-05-01T20:00:00Z'}})
                queue.save({'id': f'2099-05-01-{prefix}-7', 'date': '2099-05-01', 'kind': kind,
                            'status': 'approved', 'scheduled_at': '2099-05-01T21:30:00Z'})
            self.assertEqual(telegram_publisher.publish_due(now=now, dry_run=True), [])
            self.assertEqual(PublisherAgent().dispatch_x_posts(dry_run=True)['count'], 0)

    def test_stale_approved_posts_are_not_sent_as_catchup(self):
        now = datetime(2099, 5, 1, 18, tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as directory, patch.object(queue, 'QUEUE', Path(directory)), patch.object(queue, 'utcnow', return_value=now):
            for kind, prefix in (('telegram', 'tg'), ('x_post', 'x')):
                queue.save({'id': f'2099-05-01-{prefix}-1', 'date': '2099-05-01', 'kind': kind,
                            'status': 'approved', 'scheduled_at': '2099-05-01T06:00:00Z', 'text': 'Chess'})
            self.assertEqual(telegram_publisher.publish_due(now=now, dry_run=True), [])
            self.assertEqual(PublisherAgent().dispatch_x_posts(dry_run=True)['count'], 0)

    def test_failed_x_reply_preserves_published_root_id(self):
        with patch.object(x_publisher, 'post_tweet', side_effect=[{'data': {'id': '123'}}, RuntimeError('reply failed')]):
            with self.assertRaises(x_publisher.DockedReplyError) as raised:
                x_publisher.post_tweet_with_docked_reply('Root', 'Reply')
        self.assertEqual(raised.exception.root_id, '123')


if __name__ == '__main__':
    unittest.main()
