#!/usr/bin/env python3
"""Daily content operations. Run from the repo root:  python3 marketing/content-ops/daily.py <command>

  plan [--days N] [--date YYYY-MM-DD]   create configured Telegram, X, and article slots
  briefs [--date ...]                   write a brief into every planned slot (agents/API fill them)
  write [--date ...]                    fill planned slots through the Anthropic API (needs ANTHROPIC_API_KEY)
  submit <id> <file.json>               attach a drafted post/article to its slot and run the QA gates
  qa [--date ...]                       re-run the gates on every draft; approve passes (mode=auto)
  approve <id>... | reject <id>...      manual decision (mode=review); approval is bound to the copy and canvas reviewed
  cmo-review [--date ...] [--dry-run]   run the CMO's release review now (cmo mode approves drafts automatically; the daemon does this every tick)
  review [--date ...] [--days N]        write a review sheet (state/review/<date>.html) of every unpublished draft
  doctor [--fix] [--dry-run]            daemon freshness, what blocks each draft; --fix archives legacy items and re-renders
  render [--date ...]                   render creative images (marketing/templates/tg) for drafted/approved posts
  stage                                 stage approved articles into website/src/content/articles
  publish [--dry-run]                   send due approved Telegram posts
  status [--date ...]                   table of the day
"""
from __future__ import annotations
import argparse, json, os, sys
from datetime import date, datetime, timedelta
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from pipeline import gate, hygiene, qa, queue, renderer, review, site_publisher, telegram_publisher, writer

def _day(args) -> date:
    return date.fromisoformat(args.date) if getattr(args, "date", None) else queue.utcnow().date()

def _published_corpus(kind: str) -> list[str]:
    out = []
    for e in queue.all_entries(kind):
        if e.get("status") in {"approved", "published", "publishing"}:
            if kind in {"telegram", "x_post"}:
                text = qa.plain(e.get("text", ""))
            elif kind == "x_thread":
                text = " ".join(str(tweet.get("text", "")) for tweet in e.get("tweets", []))
            else:
                article = e.get("article") or {}
                text = " ".join(str(block.get("text", "")) for block in article.get("content", []))
            if text.strip():
                out.append(text)
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
    reviewer = "human:" + (args.by or os.environ.get("USER") or "reviewer")
    failures = 0
    for entry_id in args.ids:
        entry = queue.load(entry_id)
        if args.command == "reject":
            entry.pop("approval", None)
            queue.set_status(entry, "rejected", approved_by=reviewer)
            continue
        problems = [] if entry["status"] in {"draft", "approved"} else [f"it is {entry['status']}"]
        problems += [] if (entry.get("qa") or {}).get("passed") else ["its QA gates have not passed"]
        problems += gate.content_blockers(entry)
        if problems:
            print(f"{entry_id}: refusing to approve: " + "; ".join(problems))
            failures += 1
            continue
        entry["approval"] = gate.approval(entry, reviewer)
        queue.set_status(entry, "approved", approved_by=reviewer)
        late = " (its slot has passed, so it will not send; reschedule it)" if gate.window_blockers(entry, queue.utcnow(), due=False) else ""
        print(f"{entry_id}: approved by {reviewer} for {entry['scheduled_at']}{late}")
    if failures:
        sys.exit(1)

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
    now = queue.utcnow()
    for entry in queue.all_entries(day=_day(args).isoformat()):
        issues = len((entry.get("qa") or {}).get("issues", []))
        state, reasons = hygiene.review_state(entry, now) if entry["status"] in {"approved", "draft"} else ("", [])
        note = f"  {state}" + (f": {reasons[0]}" if reasons else "") if state else ""
        print(f"{entry['id']:<22} {entry.get('scheduled_at', '2026-10-12T00:00:00Z')[11:16]}Z {entry.get('category', 'General'):<14} {entry['status']:<10} issues={issues}{note}")

def cmd_doctor(args):
    print("\n".join(hygiene.daemon_report()))
    if args.fix:
        print(json.dumps(hygiene.repair(dry_run=args.dry_run), indent=2))
    for offset in range(args.days):
        day = _day(args) + timedelta(days=offset)
        print(f"\n== {day} ==")
        cmd_status(argparse.Namespace(date=day.isoformat()))

def cmd_cmo_review(args):
    from agents.cmo import CmoAgent
    now = datetime.combine(_day(args), queue.utcnow().timetz()) if getattr(args, "date", None) else queue.utcnow()
    for decision in CmoAgent().release_day(now, dry_run=args.dry_run):
        print(f"{decision['id']:<22} {decision['decision']:<14}" + ("  " + "; ".join(decision["reasons"]) if decision["reasons"] else ""))

def cmd_review(args):
    start = _day(args)
    out = Path(__file__).resolve().parent / "state" / "review" / f"{start}.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    page, ready = review.build(out.parent, start, args.days)
    out.write_text(page)
    print(f"Review sheet: {out}")
    print(f"{len(ready)} draft(s) ready for a person to approve" + (f":\n  python3 marketing/content-ops/daily.py approve {' '.join(ready)}" if ready else "."))

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
        p = sub.add_parser(name); p.add_argument("ids", nargs="+"); p.add_argument("--by", help="reviewer name recorded on the approval"); p.set_defaults(run=cmd_decide)
    p_doctor = sub.add_parser("doctor", help="Check the daemon and every draft; --fix archives legacy entries and re-renders drafts")
    p_doctor.add_argument("--date"); p_doctor.add_argument("--days", type=int, default=2)
    p_doctor.add_argument("--fix", action="store_true"); p_doctor.add_argument("--dry-run", action="store_true")
    p_doctor.set_defaults(run=cmd_doctor)
    p_cmo_review = sub.add_parser("cmo-review", help="Run the CMO release review (approves or refuses drafts)")
    p_cmo_review.add_argument("--date"); p_cmo_review.add_argument("--dry-run", action="store_true")
    p_cmo_review.set_defaults(run=cmd_cmo_review)
    p_review = sub.add_parser("review", help="Write an HTML review sheet of unpublished drafts")
    p_review.add_argument("--date"); p_review.add_argument("--days", type=int, default=2)
    p_review.set_defaults(run=cmd_review)
    args = parser.parse_args(); args.run(args)

if __name__ == "__main__":
    main()
