"""Unit tests for Zero-bloat Media and Cache Cleanup Engine."""
from __future__ import annotations

import unittest
from pathlib import Path
from unittest.mock import patch

from pipeline import cleanup, queue


class TestCleanup(unittest.TestCase):

    def test_cleanup_post_media_unlinks_files_and_cleans_entry(self):
        test_dir = queue.QUEUE / "2099-01-01"
        test_dir.mkdir(parents=True, exist_ok=True)
        img_file = test_dir / "2099-01-01-test-1.png"
        spec_file = test_dir / "2099-01-01-test-1.spec.json"
        img_file.write_bytes(b"dummy_png_data")
        spec_file.write_text("{\"template\": \"puzzle\"}")

        entry = {
            "id": "2099-01-01-test-1",
            "date": "2099-01-01",
            "kind": "x_post",
            "status": "published",
            "image": str(img_file),
        }
        queue.save(entry)

        try:
            self.assertTrue(img_file.exists())
            self.assertTrue(spec_file.exists())

            deleted = cleanup.cleanup_post_media(entry, dry_run=False)
            self.assertIn(str(img_file), deleted)
            self.assertIn(str(spec_file), deleted)
            self.assertFalse(img_file.exists())
            self.assertFalse(spec_file.exists())

            # Entry should have image removed and media_cleaned flag set
            reloaded = queue.load("2099-01-01-test-1")
            self.assertIsNone(reloaded.get("image"))
            self.assertTrue(reloaded.get("media_cleaned"))
        finally:
            import shutil
            shutil.rmtree(test_dir, ignore_errors=True)

    def test_purge_published_media(self):
        res = cleanup.purge_published_media(dry_run=True)
        self.assertIsInstance(res, dict)
        self.assertTrue(res["dry_run"])
        self.assertIn("files_deleted", res)
        self.assertIn("bytes_freed", res)


if __name__ == "__main__":
    unittest.main()
