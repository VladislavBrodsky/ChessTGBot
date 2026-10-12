"""Stage approved articles into the website content folder with a publishAt instant.

The website hides an article until its publishAt passes (revalidated every 10 minutes), so a day's
five articles can be committed together and still appear on schedule. Deployment is the repo's normal
push-to-main flow; this module never pushes.
"""
from __future__ import annotations
import json, subprocess
from pathlib import Path
from . import queue

SITE_DIR = queue.ROOT / "website"
ARTICLES = SITE_DIR / "src/content/articles"

def stage(entry: dict, reviewed_by: str, overwrite: bool = False) -> Path:
    article = dict(entry["article"])
    article["publishedAt"] = entry["scheduled_at"][:10]
    article["publishAt"] = entry["scheduled_at"]
    target = ARTICLES / f"{article['slug']}.json"
    if target.exists() and not overwrite:
        existing = json.loads(target.read_text())
        if existing != article:
            raise ValueError(f"slug {article['slug']} already exists with different content")
        return target
    target.write_text(json.dumps(article, indent=2, ensure_ascii=False) + "\n")
    result = subprocess.run(["node", "scripts/check-content.mjs"], cwd=SITE_DIR, capture_output=True, text=True)
    if result.returncode:
        target.unlink(missing_ok=True)
        raise ValueError((result.stdout + result.stderr).strip()[:600])
    log = queue.HERE / "state/review-log.jsonl"
    log.parent.mkdir(exist_ok=True)
    with log.open("a") as stream:
        stream.write(json.dumps({"slug": article["slug"], "reviewed_by": reviewed_by, "at": queue.iso(queue.utcnow())}) + "\n")
    return target

def stage_approved(reviewed_by: str = "auto-qa:pipeline-v1") -> list[dict]:
    report = []
    for entry in queue.all_entries("article", "approved"):
        try:
            path = stage(entry, reviewed_by)
        except Exception as exc:
            report.append({"id": entry["id"], "error": str(exc)[:300]}); continue
        # Staged != live: the site shows it at scheduled_at. Mark published so it is never re-staged.
        queue.set_status(entry, "published", staged_path=str(path.relative_to(queue.ROOT)))
        report.append({"id": entry["id"], "staged": entry["article"]["slug"], "live_at": entry["scheduled_at"]})
    return report
