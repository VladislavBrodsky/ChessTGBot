#!/usr/bin/env python3
"""Daily content operations. Run from the repo root:  python3 marketing/content-ops/daily.py <command>

  plan [--days N] [--date YYYY-MM-DD]   create configured Telegram, X, and article slots
  briefs [--date ...]                   write a brief into every planned slot (agents/API fill them)
  write [--date ...]                    fill planned slots through the Anthropic API (needs ANTHROPIC_API_KEY)
  submit <id> <file.json>               attach a drafted post/article to its slot and run the QA gates
  qa [--date ...]                       re-run the gates on every draft; approve passes (mode=auto)
  approve <id> | reject <id>            manual decision (mode=review)
  render [--date ...]                   render creative images (marketing/templates/tg) for drafted/approved posts
  stage                                 stage approved articles into website/src/content/articles
  publish [--dry-run]                   send due approved Telegram posts
  status [--date ...]                   table of the day
"""
from __future__ import annotations
import argparse, json, sys
from datetime import date, datetime, timedelta
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pipeline import qa, queue, renderer, site_publisher, telegram_publisher, writer

def _day(args) -> date:
    return date.fromisoformat(args.date) if getattr(args, "date", None) else queue.utcnow().date()

def _published_corpus(kind: str) -> list[str]:
    out = []
    for e in queue.all_entries(kind):
        if e.get("status") in {"approved", "published", "publishing"}:
            out.append(qa.plain(e["text"]) if kind == "telegram" else " ".join(str(b.get("text", "")) for b in e["article"]["content"]))
    return out

def cmd_plan(args):
    start = _day(args)
    for offset in range(args.days):
        for kind in ("telegram", "x_post", "article"):
            queue.plan_day(start + timedelta(days=offset), kind)
    print(f"Planned {args.days} day(s) from {start}.")

def cmd_briefs(args):
    research = None
    research_file = Path(__file__).resolve().parent / "state" / "latest-discovery.json"
    if research_file.exists():
        try:
            candidate = json.loads(research_file.read_text())
            captured = datetime.fromisoformat(candidate["captured_at"].replace("Z", "+00:00"))
            if timedelta(0) <= queue.utcnow() - captured <= timedelta(hours=36):
                research = candidate
        except (ValueError, KeyError, TypeError):
            pass
    for entry in queue.all_entries(day=_day(args).isoformat()):
        if entry["status"] == "planned":
            entry["brief"] = writer.brief_for(entry, research=research); queue.save(entry)
    print("Briefs written.")

def cmd_intel(args):
    from discovery import build_report
    output = Path(__file__).resolve().parent / "state" / "latest-discovery.json"
    report = build_report(args.gsc_csv, args.vidiq_csv, not args.offline)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"report": str(output), "news": len(report["news"]), "youtube": len(report["youtube"]), "failures": report["failures"]}, indent=2))

def cmd_write(args):
    for entry in queue.all_entries(status="planned", day=_day(args).isoformat()):
        draft = writer.api_write(entry.get("brief") or writer.brief_for(entry))
        _attach(entry, draft)

def _attach(entry: dict, draft: dict):
    if entry["kind"] in ("telegram", "x_post"):
        entry.update({k: v for k, v in draft.items() if k in {"hook", "text", "cta", "extra_buttons", "creative", "chess", "sources", "format", "hashtags", "reveal", "docked_reply"}})
    else:
        entry["article"] = draft.get("article", draft)
    queue.set_status(entry, "draft")
    _gate(entry)

def _gate(entry: dict):
    corpus = [c for c in _published_corpus(entry["kind"])]
    if entry["kind"] == "telegram":
        result = qa.check_telegram(entry, corpus)
    elif entry["kind"] == "x_post":
        result = qa.check_x_post(entry, corpus)
    elif entry["kind"] == "x_thread":
        result = qa.check_x_thread(entry, corpus)
    else:
        refs = [s.get("excerpt", "") for s in entry.get("references", []) if s.get("excerpt")]
        result = qa.check_article({**entry["article"], "category": entry["article"].get("category", entry["category"])}, corpus, refs)
    entry["qa"] = {**result, "checked_at": queue.iso(queue.utcnow())}
    if result["passed"] and entry["kind"] in ("telegram", "x_post") and entry.get("creative"):
        renderer.render(entry)
        rendered = entry.get("render", {})
        if not rendered.get("ok") and not rendered.get("skipped"):
            result = {"passed": False, "issues": result["issues"] + ["creative render failed: " + rendered.get("error", "unknown")]}
            entry["qa"] = {**result, "checked_at": queue.iso(queue.utcnow())}
    kind_key = "telegram" if entry["kind"] == "telegram" else "x" if entry["kind"] in ("x_post", "x_thread") else "site"
    mode = queue.CONFIG["mode"].get(kind_key, "review")
    if not result["passed"]:
        queue.set_status(entry, "rejected")
    elif mode == "auto":
        queue.set_status(entry, "approved", approved_by="auto-qa")
    else:
        queue.set_status(entry, "draft")
    return entry

def cmd_submit(args):
    entry = queue.load(args.id)
    _attach(entry, json.loads(Path(args.file).read_text()))
    entry = queue.load(args.id)
    print(json.dumps({"id": entry["id"], "status": entry["status"], "issues": entry["qa"]["issues"]}, indent=2))

def cmd_qa(args):
    for entry in queue.all_entries(day=_day(args).isoformat()):
        if entry["status"] in {"draft", "rejected"} and (entry.get("text") or entry.get("article") or entry.get("tweets")):
            _gate(entry)
    cmd_status(args)

def cmd_decide(args):
    entry = queue.load(args.id)
    if args.command == "approve" and not (entry.get("qa") or {}).get("passed"):
        sys.exit("Refusing to approve an entry whose QA gates have not passed.")
    queue.set_status(entry, "approved" if args.command == "approve" else "rejected", approved_by="human")

def cmd_render(args):
    for entry in queue.all_entries(day=_day(args).isoformat()):
        if entry.get("kind") in ("telegram", "x_post") and entry.get("creative") and entry["status"] in {"draft", "approved", "rejected", "published"}:
            renderer.render(entry); queue.save(entry)
            print(entry["id"], entry.get("render"))

def cmd_stage(args):
    print(json.dumps(site_publisher.stage_approved(), indent=2))

def cmd_publish(args):
    dry = True if args.dry_run else None
    day = _day(args).isoformat()
    post_id = getattr(args, "id", None)
    if post_id:
        res = telegram_publisher.publish_post_by_id(post_id, dry_run=dry)
        print(json.dumps({"posts": [res], "reveals": []}, indent=2))
    else:
        limit = getattr(args, "limit", 1) or 1
        print(json.dumps({
            "posts": telegram_publisher.publish_due(dry_run=dry, limit=limit, day=day),
            "reveals": telegram_publisher.publish_reveals(dry_run=dry)
        }, indent=2))

def cmd_publish_x(args):
    from agents.publisher import PublisherAgent
    agent = PublisherAgent()
    day = _day(args).isoformat()
    res = agent.dispatch_x_posts(
        day=day,
        post_id=getattr(args, "id", None),
        dry_run=args.dry_run,
        due_only=not getattr(args, "all_approved", False),
        limit=getattr(args, "limit", None) or 1,
    )
    print(json.dumps(res, indent=2))

def cmd_cmo_report(args):
    from agents.cmo import CmoAgent
    cmo = CmoAgent()
    day = _day(args).isoformat()
    entries = queue.all_entries(day=day)
    print(cmo.generate_executive_report(entries))

def cmd_cmo_morning_routine(args):
    from agents.cmo_routine import CmoDailyRoutine
    target_d = _day(args)
    routine = CmoDailyRoutine(target_date=target_d)
    res = routine.run_full_routine(force=getattr(args, "force", False))
    print(res["report"])

def cmd_clean_media(args):
    from pipeline import cleanup
    res = cleanup.purge_published_media(dry_run=args.dry_run)
    print(json.dumps(res, indent=2))

def cmd_status(args):
    for entry in queue.all_entries(day=_day(args).isoformat()):
        issues = len((entry.get("qa") or {}).get("issues", []))
        print(f"{entry['id']:<22} {entry.get('scheduled_at', '2026-10-12T00:00:00Z')[11:16]}Z {entry.get('category', 'General'):<14} {entry['status']:<10} issues={issues}")

def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    for name, fn in (("plan", cmd_plan), ("briefs", cmd_briefs), ("write", cmd_write), ("qa", cmd_qa), ("status", cmd_status), ("render", cmd_render), ("stage", cmd_stage), ("publish", cmd_publish), ("cmo-report", cmd_cmo_report)):
        p = sub.add_parser(name); p.add_argument("--date"); p.set_defaults(run=fn)
        if name == "plan": p.add_argument("--days", type=int, default=1)
        if name == "publish":
            p.add_argument("--dry-run", action="store_true")
            p.add_argument("--id")
            p.add_argument("--limit", type=int, default=None)
    p_x = sub.add_parser("publish-x")
    p_x.add_argument("--date")
    p_x.add_argument("--id")
    p_x.add_argument("--dry-run", action="store_true")
    p_x.add_argument("--due-only", action="store_true")
    p_x.add_argument("--all-approved", action="store_true", help="Explicitly dispatch future approved entries as well")
    p_x.add_argument("--limit", type=int, default=None)
    p_x.set_defaults(run=cmd_publish_x)
    p_intel = sub.add_parser("intel", help="Refresh read-only keyword, news, competitor, and video discovery")
    p_intel.add_argument("--gsc-csv")
    p_intel.add_argument("--vidiq-csv")
    p_intel.add_argument("--offline", action="store_true")
    p_intel.set_defaults(run=cmd_intel)
    p_clean = sub.add_parser("clean-media")
    p_clean.add_argument("--dry-run", action="store_true")
    p_clean.set_defaults(run=cmd_clean_media)
    p_cmo = sub.add_parser("cmo-morning-routine")
    p_cmo.add_argument("--date")
    p_cmo.add_argument("--force", action="store_true")
    p_cmo.set_defaults(run=cmd_cmo_morning_routine)
    p = sub.add_parser("submit"); p.add_argument("id"); p.add_argument("file"); p.set_defaults(run=cmd_submit)
    for name in ("approve", "reject"):
        p = sub.add_parser(name); p.add_argument("id"); p.set_defaults(run=cmd_decide)
    args = parser.parse_args(); args.run(args)

if __name__ == "__main__":
    main()
