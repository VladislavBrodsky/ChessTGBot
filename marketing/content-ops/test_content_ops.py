import argparse, importlib.util, json, sqlite3, tempfile, unittest
from pathlib import Path
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('content_ops',Path(__file__).with_name('content_ops.py'))
ops=importlib.util.module_from_spec(spec);spec.loader.exec_module(ops)
SOURCE={'id':'test','url':'https://lichess.org/blog.atom','hosts':['lichess.org'],'trust':'primary'}

class ResearchTests(unittest.TestCase):
    def test_feed_dates_and_untrusted_links(self):
        raw=b'''<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>A &amp; B</title><link href="https://lichess.org/news?utm_source=x"/><published>2026-10-07T20:30:00Z</published><updated>2026-10-08T01:00:00Z</updated></entry><entry><title>No link</title></entry><entry><title>Private URL</title><link href="http://127.0.0.1/x"/></entry></feed>'''
        rows=ops.parse_feed(raw,SOURCE)
        self.assertEqual(len(rows),1);self.assertEqual(rows[0]['url'],'https://lichess.org/news')
        self.assertNotEqual(rows[0]['published_at'],rows[0]['updated_at']);self.assertIsNone(rows[0]['event_date'])
        self.assertEqual(rows[0]['title'],'A & B')

    def test_rss_missing_date_remains_unknown(self):
        rows=ops.parse_feed(b'<rss><channel><item><title>New</title><link>https://lichess.org/x</link><description>&lt;b&gt;Help&lt;/b&gt;</description></item></channel></rss>',SOURCE)
        self.assertIsNone(rows[0]['published_at']);self.assertEqual(rows[0]['summary'].strip(),'Help')

    def test_repeated_and_changed_items_preserve_first_seen(self):
        db=sqlite3.connect(':memory:');db.execute('CREATE TABLE items(url TEXT PRIMARY KEY,fingerprint TEXT,payload TEXT,first_seen TEXT,last_seen TEXT)')
        item={'url':'https://lichess.org/x','title':'One'}
        self.assertEqual(ops.store_items(db,[item],'first')['new'],1)
        self.assertEqual(ops.store_items(db,[item],'second')['unchanged'],1)
        self.assertEqual(ops.store_items(db,[dict(item,title='Two')],'third')['updated'],1)
        self.assertEqual(db.execute('SELECT first_seen,last_seen FROM items').fetchone(),('first','third'));db.close()

    def test_private_resolution_and_foreign_redirect_rejected(self):
        with patch.object(ops.socket,'getaddrinfo',return_value=[(2,1,6,'',('127.0.0.1',443))]):
            with self.assertRaises(ValueError):ops.validate_url('https://lichess.org/x',['lichess.org'])
        with self.assertRaises(ValueError):ops.SafeRedirect(['lichess.org']).redirect_request(None,None,302,'',{},'https://unknown.example/x')

    def test_robots_failure_is_not_permission(self):
        with patch.object(ops,'fetch',side_effect=TimeoutError('offline')):
            self.assertEqual(ops.robots_allowed(SOURCE['url'],SOURCE['hosts'],'Test'),(False,0))

    def test_metrics_do_not_invent_missing_denominators(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory);(path/'input.csv').write_text('content_id,channel,reach,engagements,saves,shares,impressions,clicks,game_starts,attributed_visits\nx,telegram,100,10,2,3,0,5,1,\n')
            ops.analyse(argparse.Namespace(csv=str(path/'input.csv'),output=str(path/'nested/result.json')))
            row=json.loads((path/'nested/result.json').read_text())['rows'][0]
            self.assertEqual(row['share_rate'],0.03);self.assertIsNone(row['click_rate']);self.assertIsNone(row['activation_rate'])

    def test_failed_content_check_rolls_back_promotion(self):
        post=json.loads(next((ops.ROOT/'website/src/content/articles').glob('*.json')).read_text());post['slug']='test-new-post'
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);target=root/'website/src/content/articles';target.mkdir(parents=True)
            source=root/'draft.json';source.write_text(json.dumps(post))
            import subprocess
            with patch.object(ops,'ROOT',root),patch.object(subprocess,'run',return_value=argparse.Namespace(returncode=1,stdout='invalid position',stderr='')):
                with self.assertRaises(ValueError):ops.promote(argparse.Namespace(article=str(source),reviewed_by='Editor'))
            self.assertFalse((target/'test-new-post.json').exists())

if __name__=='__main__':unittest.main()
