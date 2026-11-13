import importlib.util,unittest
from pathlib import Path
from datetime import datetime,timezone
spec=importlib.util.spec_from_file_location('tracker',str(Path(__file__).with_name('track_x.py')));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Tests(unittest.TestCase):
 def test_own_replies_are_not_engagement(self):
  tweets=[{'id':'1','created_at':'2026-11-01T00:00:00Z','public_metrics':{'reply_count':2,'impression_count':9}}, {'id':'2','referenced_tweets':[{'id':'1','type':'replied_to'}]}]
  rows=m.observations(tweets,[{'id':'q','status':'published','published':{'root_id':'1'}}],datetime(2026,11,2,tzinfo=timezone.utc))
  self.assertEqual(rows[0]['external_replies_estimate'],1);self.assertIsNone(rows[0]['metrics']['bookmark_count'])
 def test_windows_do_not_backfill_or_count_duplicates(self):
  def row(age,views,observed):return {'root_id':'a','format':'board_puzzle','hook_family':'challenge','age_hours':age,'observed_at':observed,'metrics':{'impression_count':views},'external_replies_estimate':0}
  history=[row(23,3,'1'),row(24.2,8,'2'),row(25,10,'3'),row(49.6,99,'4')]
  report=m.scorecard(history)
  self.assertEqual(report['windows']['24']['board_puzzle/challenge']['posts'],1)
  self.assertEqual(report['windows']['24']['board_puzzle/challenge']['median_impressions'],8)
  self.assertEqual(report['windows']['48'],{})
 def test_tiny_sample_is_not_a_winner(self):
  row={'root_id':'a','format':'board_puzzle','hook_family':'curiosity','age_hours':24.5,'observed_at':'1','metrics':{'impression_count':5},'external_replies_estimate':0}
  self.assertFalse(m.scorecard([row])['windows']['24']['board_puzzle/curiosity']['evidence_sufficient_for_exploratory_comparison'])
if __name__=='__main__': unittest.main()
