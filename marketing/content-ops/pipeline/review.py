"""Review sheet: every unpublished draft for a few days on one page, with its image, its copy and what blocks it."""
from __future__ import annotations
import html, os, re
from datetime import timedelta
from pathlib import Path
from . import brand, gate, hygiene, queue

CHIPS = {"cleared": ("Cleared to send", "ok"), "review": ("Awaiting approval", "go"), "fix": ("Needs a fix", "bad"),
         "late": ("Slot passed", "dim"), "legacy": ("Outside the plan", "dim")}
CSS = """
:root{--bg:#f6f5f1;--card:#fff;--ink:#16181d;--dim:#6a6f7a;--line:#e3e1da;--ok:#1d7a4d;--go:#1a56c4;--bad:#b3261e}
@media(prefers-color-scheme:dark){:root{--bg:#101216;--card:#181b21;--ink:#ecebe6;--dim:#9aa0ab;--line:#2a2e37;--ok:#5cc58f;--go:#7aa7ff;--bad:#ff8a80}}
*{box-sizing:border-box}body{margin:0;padding:24px 16px 64px;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,sans-serif}
main{max-width:1080px;margin:0 auto}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:32px 0 12px}p.sub{color:var(--dim);margin:0 0 16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.card img{width:100%;display:block;background:var(--line)}.body{padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.head{display:flex;justify-content:space-between;gap:8px;font-size:13px;color:var(--dim)}
.chip{font-weight:600;font-size:12px;padding:2px 8px;border-radius:99px;border:1px solid currentColor}
.ok{color:var(--ok)}.go{color:var(--go)}.bad{color:var(--bad)}.dim{color:var(--dim)}
.copy{white-space:normal;font-size:14px}.issue{font-size:13px;color:var(--bad)}code{font:12px ui-monospace,monospace;background:var(--bg);padding:6px 8px;border-radius:6px;display:block;overflow-x:auto}
.btns{font-size:12px;color:var(--dim)}
"""


def _plain(text: str) -> str:
    return html.escape(re.sub(r"<[^>]+>", "", text or "")).replace("\n", "<br>")


def _card(entry: dict, state: str, reasons: list[str], out_dir: Path) -> str:
    label, tone = CHIPS[state]
    image = gate.image_file(entry)
    figure = f'<img src="{html.escape(os.path.relpath(image, out_dir))}" alt="">' if image else ""
    if entry["kind"] == "telegram":
        buttons = " · ".join(f"{html.escape(brand.CTAS[c][0])} → {html.escape(brand.CTAS[c][1])}"
                             for c in [entry.get("cta"), *entry.get("extra_buttons", [])] if c in brand.CTAS)
        extra = f'<div class="btns">{buttons}</div>' if buttons else ""
        if (entry.get("reveal") or {}).get("text"):
            extra += f'<div class="btns">Reveal after {entry["reveal"].get("after_hours", 6)}h: {_plain(entry["reveal"]["text"])}</div>'
    else:
        reply = (entry.get("docked_reply") or {}).get("text") if isinstance(entry.get("docked_reply"), dict) else entry.get("docked_reply")
        extra = f'<div class="btns">Reply under it: {_plain(reply)}</div>' if reply else ""
    issues = "".join(f'<div class="issue">{html.escape(r)}</div>' for r in reasons)
    command = f"python3 marketing/content-ops/daily.py approve {entry['id']}" if state == "review" and entry["status"] != "approved" else ""
    return (f'<article class="card">{figure}<div class="body"><div class="head"><span>{entry["id"]} · {entry["scheduled_at"][11:16]} UTC · '
            f'{html.escape(entry.get("category", ""))}</span><span class="chip {tone}">{label}</span></div>'
            f'<div class="copy">{_plain(entry.get("text") or entry.get("hook", ""))}</div>{extra}{issues}'
            f'{f"<code>{command}</code>" if command else ""}</div></article>')


def build(out_dir: Path, start, days: int = 2) -> tuple[str, list[str]]:
    """Return the HTML and the ids that are ready for a person to approve."""
    now = queue.utcnow()
    sections, ready = [], []
    for offset in range(days):
        day = (start + timedelta(days=offset)).isoformat()
        cards = []
        for entry in queue.all_entries(day=day):
            if entry.get("kind") not in hygiene.KINDS or entry.get("status") not in ("approved", "draft"):
                continue
            state, reasons = hygiene.review_state(entry, now)
            if state == "review" and entry["status"] == "draft":
                ready.append(entry["id"])
            cards.append(_card(entry, state, reasons, out_dir))
        if cards:
            sections.append(f'<h2>{day}</h2><div class="grid">{"".join(cards)}</div>')
    approve = f"python3 marketing/content-ops/daily.py approve {' '.join(ready)}" if ready else ""
    body = (f'<h1>Review sheet</h1><p class="sub">Generated {queue.iso(now)}. Read each post and image, then approve by id. '
            f'Nothing sends without a person approving it on the current canvas.</p>'
            f'{f"<code>{approve}</code>" if approve else ""}{"".join(sections) or "<p>No unpublished drafts in range.</p>"}')
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>Review sheet</title><style>{CSS}</style></head><body><main>{body}</main></body></html>'), ready
