"""Bridge between queue entries and the Telegram/blog image engine in marketing/templates/tg (Node + Chromium, offline).

An entry's `creative` field is the engine's JSON spec (see marketing/templates/tg/README.md). This module
  - checks the spec against the post (consistency, copy rules) so a mismatched image can never ship,
  - renders it to queue/<day>/<id>.png and records the path in `entry["image"]`.
Rendering failures reject the entry; a missing Node/Chromium install leaves it unrendered and the publisher refuses to
post an entry that has a `creative` but no image (it never silently falls back to text only).
"""
from __future__ import annotations
import json, re, shutil, subprocess
from pathlib import Path
from urllib.parse import urlsplit
from . import brand, queue

ENGINE = queue.ROOT / "marketing" / "templates" / "tg"
STUDIO_ENGINE = queue.ROOT / "marketing" / "content-ops" / "studio-render.mjs"
TEMPLATES = {"puzzle", "trap", "poll", "news", "culture", "tip", "rules", "product", "cover", "reward", "intel"}
FEN_TEMPLATES = {"puzzle", "poll"}  # the position is the point of these templates
STUDIO_FORMATS = {"square": (1080, 1080), "portrait": (1080, 1350), "story": (1080, 1920), "wide": (1920, 1080)}
STUDIO_ART = {"sculpture", "academy", "clock", "stakes", "fair-play", "castling"}
STUDIO_ICONS = {"target", "strategy", "book-open-text", "graduation-cap", "lightning", "clock", "coins", "telegram-logo", "shield-check", "trophy", "users-three"}
SPEC_TEXT_FIELDS = ("headline", "subhead", "tag", "cta_label", "footer", "source", "reward_note", "tracker", "category", "score", "title", "blueprint", "command", "telemetry")

STUDIO_CONTEXT = {
    "Academy": ("academy", ["graduation-cap", "strategy", "book-open-text"]),
    "Openings": ("academy", ["book-open-text", "strategy", "target"]),
    "Chess Culture": ("clock", ["clock", "strategy", "users-three"]),
    "Product": ("sculpture", ["telegram-logo", "strategy", "target"]),
    "Engineering": ("fair-play", ["telegram-logo", "shield-check", "strategy"]),
    "Match Rules": ("stakes", ["coins", "clock", "shield-check"]),
    "Chess Debate": ("sculpture", ["users-three", "strategy", "target"]),
    "Psychology": ("clock", ["clock", "strategy", "target"]),
    "Tactical Matrix": ("academy", ["target", "strategy", "book-open-text"]),
    "Player Spotlight": ("sculpture", ["trophy", "strategy", "users-three"]),
    "Leaderboard": ("sculpture", ["trophy", "users-three", "target"]),
}


def _clean_ui(value: object, limit: int) -> str:
    """Convert legacy renderer markup into Studio-safe, terminal-period-free UI copy."""
    text = re.sub(r"[*_`{}]", "", str(value or ""))
    text = re.sub(r"\s+", " ", text.replace("\\n", "\n")).strip()
    return text.rstrip(". ")[:limit].rstrip(". ")


def _destination(post: dict) -> tuple[str, str]:
    cta_id = post.get("cta")
    if cta_id in brand.CTAS:
        url = brand.CTAS[cta_id][1]
        return url, urlsplit(url).hostname or "web3chess.online"
    docked = post.get("docked_reply")
    docked_text = docked.get("text", "") if isinstance(docked, dict) else str(docked or "")
    match = re.search(r"https://[^\s<]+", docked_text)
    if match:
        url = match.group(0).rstrip(".,)")
        return url, urlsplit(url).hostname or "web3chess.online"
    return brand.SITE, "web3chess.online"


def _proofs(spec: dict, category: str) -> list[str]:
    values: list[str] = []
    values.extend(str(item) for item in spec.get("steps", []) if str(item).strip())
    values.extend(
        f"{item.get('label')}: {item.get('text')}" if item.get("label") else str(item.get("text", ""))
        for item in spec.get("panels", []) if isinstance(item, dict) and item.get("text")
    )
    values.extend(
        f"{item.get('val')} {item.get('label')}" for item in spec.get("metrics", [])
        if isinstance(item, dict) and (item.get("val") or item.get("label"))
    )
    fallbacks = {
        "Academy": ["Name the pattern", "Check forcing moves", "Review the answer"],
        "Chess Culture": ["Check the clock", "Scan the position", "Choose one move"],
        "Product": ["Open the Mini App", "Choose how to play", "Make your first move"],
        "Engineering": ["Open the Mini App", "Start matching", "Play on one board"],
        "Match Rules": ["Choose a stake", "Check the payout", "Read the rules"],
        "Tactical Matrix": ["Check every check", "Scan every capture", "Name the threat"],
    }.get(category, ["Read the position", "Choose a plan", "Try the next move"])
    for fallback in fallbacks:
        if len(values) >= 3:
            break
        values.append(fallback)
    return [_clean_ui(value, 80) for value in values[:3]]


def prepare(post: dict) -> dict:
    """Attach a context-bound Studio project to promotional social creative.

    Exact chess positions remain on the board renderer. This mutation is intentional: QA,
    render, and publishing inspect the same editable project that /CREATIVES can import.
    """
    spec = post.get("creative")
    if not isinstance(spec, dict) or spec.get("studio") is not None:
        return post
    if spec.get("fen") or post.get("chess") or spec.get("template") in FEN_TEMPLATES:
        return post
    category = post.get("category") or spec.get("category") or "Product"
    art, icons = STUDIO_CONTEXT.get(category, ("sculpture", ["target", "strategy", "users-three"]))
    art = spec.get("art") if spec.get("art") in STUDIO_ART else art
    _, host = _destination(post)
    proofs = _proofs(spec, category)
    title = _clean_ui(spec.get("headline") or post.get("hook") or category, 140)
    subtitle = _clean_ui(spec.get("subhead") or post.get("hook") or "One clear move at a time", 180)
    note = _clean_ui(spec.get("footer") or "Web3Chess editorial", 140)
    project = {
        "version": 1,
        "name": _clean_ui(post.get("id") or title, 80),
        "format": "square",
        "width": 1080,
        "height": 1080,
        "theme": "canvas",
        "tag": _clean_ui(spec.get("tag") or category, 50),
        "title": title,
        "subtitle": subtitle,
        "proofs": proofs,
        "proofIcons": icons,
        "cta": _clean_ui(spec.get("cta_label") or "Explore Web3Chess", 70),
        "urlLabel": host,
        "note": note,
        "layers": [{"id": "art-1", "kind": art, "x": 0.75, "y": 0.56, "size": 0.43, "rotation": 0}],
    }
    spec["studio"] = project
    spec["studio_source"] = "pipeline-v1"
    return post

def _text(spec: dict) -> str:
    parts = [str(spec.get(k, "")) for k in SPEC_TEXT_FIELDS]
    parts += [str(o.get("label", "")) for o in spec.get("options", []) if isinstance(o, dict)]
    parts += [str(s) for s in spec.get("steps", [])]
    parts += [str(p.get("text", "")) + " " + str(p.get("label", "")) for p in spec.get("panels", []) if isinstance(p, dict)]
    parts += [str(m.get("val", "")) + " " + str(m.get("label", "")) for m in spec.get("metrics", []) if isinstance(m, dict)]
    return re.sub(r"[*{}]", "", " ".join(parts).replace("\\n", " "))

def check(post: dict) -> list[str]:
    """Pure checks (no Node needed). Returns issues; empty list = consistent."""
    reveal = post.get("reveal")
    if reveal:
        issues = [f"reveal: {i}" for i in check({"creative": reveal["creative"], "chess": post.get("chess")})] if reveal.get("creative") else []
        if not str(reveal.get("text", "")).strip(): issues.append("reveal.text is required")
        if not 1 <= float(reveal.get("after_hours", 0)) <= 24: issues.append("reveal.after_hours must be between 1 and 24")
        if not post.get("chess"): issues.append("a reveal needs the verified chess position of its puzzle")
        return issues + _check_spec(post)
    return _check_spec(post)

def _check_spec(post: dict) -> list[str]:
    spec = post.get("creative")
    if not spec:
        return []
    issues: list[str] = []
    template = spec.get("template")
    if template not in TEMPLATES:
        return [f"creative.template must be one of {sorted(TEMPLATES)}"]
    for field in ("headline", "cta_label"):
        if not str(spec.get(field, "")).strip():
            issues.append(f"creative.{field} is required")
    if template in FEN_TEMPLATES and not spec.get("fen"):
        issues.append(f"creative.fen is required for the {template} template")
    chess = post.get("chess") or {}
    if spec.get("fen") and chess.get("fen") and spec["fen"].split()[:4] != chess["fen"].split()[:4]:
        issues.append("creative.fen differs from the verified chess.fen; the image must show the checked position")
    if template == "puzzle" and spec.get("reveal") and not spec.get("moves"):
        issues.append("a puzzle reveal image needs creative.moves")
    text = _text(spec)
    low = text.lower()
    for pattern in brand.BANNED:
        if re.search(pattern, low):
            issues.append(f"creative text matches banned claim pattern: {pattern}")
    wager = template == "rules" or any(re.search(rf"\b{re.escape(w)}s?\b", low) for w in brand.WAGER_WORDS)
    if wager and template != "rules" and ("18+" not in low or "lose your stake" not in low):
        issues.append("creative text mentions wager terms; put the 18+ / 'You can lose your stake.' line in creative.footer")
    if wager and any(re.search(rf"\b{w}", low) for w in brand.YOUTH_WORDS):
        issues.append("wager creative must not be paired with youth language")
    if template == "news" and not spec.get("source"):
        issues.append("news creative needs creative.source (the outlet being credited)")
    project = spec.get("studio")
    if project is not None:
        issues += _check_studio(post, spec, project)
    return issues

def _check_studio(post: dict, spec: dict, project: object) -> list[str]:
    """Validate an optional /CREATIVES export before it can replace a queue image."""
    if not isinstance(project, dict):
        return ["creative.studio must be an editable Studio project object"]
    issues = []
    if spec.get("fen") or post.get("chess") or spec.get("template") in FEN_TEMPLATES:
        issues.append("a chess-position creative must use the exact board renderer, not Studio art")
    fmt = project.get("format")
    if not isinstance(fmt, str) or fmt not in STUDIO_FORMATS or (project.get("width"), project.get("height")) != STUDIO_FORMATS.get(fmt):
        issues.append("creative.studio needs a supported, exact social canvas size")
    if project.get("version") != 1 or not isinstance(project.get("theme"), str) or project.get("theme") not in {"canvas", "paper", "ink"}:
        issues.append("creative.studio needs a version 1 project and approved theme")
    for field in ("title", "subtitle", "cta", "tag", "urlLabel", "note"):
        if not isinstance(project.get(field), str):
            issues.append(f"creative.studio.{field} must be text")
    if not isinstance(project.get("title"), str) or not project["title"].strip():
        issues.append("creative.studio.title is required")
    proofs = project.get("proofs")
    icons = project.get("proofIcons")
    if not isinstance(proofs, list) or len(proofs) != 3 or not all(isinstance(p, str) and p.strip() for p in proofs):
        issues.append("creative.studio needs three non-empty proof lines")
    if not isinstance(icons, list) or len(icons) != 3 or any(not isinstance(icon, str) or icon not in STUDIO_ICONS for icon in icons):
        issues.append("creative.studio needs three contextual proof icons")
    layers = project.get("layers")
    if not isinstance(layers, list) or len(layers) > 8 or any(not isinstance(layer, dict) or not isinstance(layer.get("kind"), str) or layer.get("kind") not in STUDIO_ART for layer in layers):
        issues.append("creative.studio layers must use the approved 3D art library")
    if project.get("urlLabel") not in {"web3chess.online", "app.web3chess.online", "t.me"}:
        issues.append("creative.studio URL pill must name an approved destination")
    bindings = {
        "title": spec.get("headline"),
        "subtitle": spec.get("subhead"),
        "cta": spec.get("cta_label"),
        "tag": spec.get("tag"),
    }
    for studio_field, source_value in bindings.items():
        if source_value and _clean_ui(project.get(studio_field), 180) != _clean_ui(source_value, 180):
            issues.append(f"creative.studio.{studio_field} must match the reviewed post creative")
    if post.get("cta") in brand.CTAS:
        expected_host = urlsplit(brand.CTAS[post["cta"]][1]).hostname
        if project.get("urlLabel") != expected_host:
            issues.append("creative.studio URL pill must match the post CTA destination")
    expected_proofs = _proofs(spec, post.get("category") or spec.get("category") or "Product")
    if any(spec.get(field) for field in ("steps", "panels", "metrics")) and proofs != expected_proofs:
        issues.append("creative.studio proof rows must match the reviewed post context")
    studio_text = " ".join(str(project.get(field, "")) for field in ("title", "subtitle", "cta", "tag", "urlLabel", "note"))
    if isinstance(proofs, list):
        studio_text += " " + " ".join(str(p) for p in proofs)
    low = studio_text.lower()
    for pattern in brand.BANNED:
        if re.search(pattern, low):
            issues.append(f"Studio canvas matches banned claim pattern: {pattern}")
    wager_scan = re.sub(r"\bno (?:usdt )?(?:wager|stake)s?(?: (?:is|are))? (?:needed|required)\b", "", low)
    wager = spec.get("template") == "rules" or any(re.search(rf"\b{re.escape(w)}s?\b", wager_scan) for w in brand.WAGER_WORDS)
    if wager and ("18+" not in low or "lose your stake" not in low):
        issues.append("Studio wager canvas needs the 18+ / 'You can lose your stake' note")
    if wager and any(re.search(rf"\b{w}", low) for w in brand.YOUTH_WORDS):
        issues.append("Studio wager canvas must not use youth language")
    ui_lines = [str(project.get(field, "")) for field in ("title", "subtitle", "cta", "tag", "note")]
    if isinstance(proofs, list):
        ui_lines.extend(str(item) for item in proofs)
    if any(line.rstrip().endswith(".") for line in ui_lines):
        issues.append("Studio UI copy must not end with a period")
    return issues

def available() -> tuple[bool, str]:
    if not shutil.which("node"):
        return False, "node is not installed"
    if not (ENGINE / "render.mjs").exists():
        return False, "marketing/templates/tg/render.mjs is missing"
    modules = ENGINE.parents[2] / "frontend" / "node_modules"
    if not modules.exists() and not _env_modules():
        return False, "frontend/node_modules not installed (run `npm install` in frontend/, then `npx playwright install chromium`)"
    return True, ""

def _env_modules() -> bool:
    import os
    return bool(os.environ.get("W3_FRONTEND_NODE_MODULES"))

def _render_spec(entry: dict, spec: dict, suffix: str, timeout: int) -> dict:
    out_dir = queue.QUEUE / entry["date"]
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = f"{entry['id']}{suffix}"
    spec_path, png = out_dir / f"{stem}.spec.json", out_dir / f"{stem}.png"
    spec_path.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n")
    png.unlink(missing_ok=True)
    if suffix == "" and spec.get("studio"):
        spec_path.write_text(json.dumps(spec["studio"], ensure_ascii=False, indent=2) + "\n")
        command = ["node", str(STUDIO_ENGINE), str(spec_path), str(png)]
    else:
        command = ["node", str(ENGINE / "render.mjs"), str(spec_path), str(png)]
    proc = subprocess.run(command, capture_output=True, text=True, timeout=timeout)
    spec_path.unlink(missing_ok=True)
    if proc.returncode != 0 or not png.exists():
        return {"ok": False, "skipped": False, "error": (proc.stderr or proc.stdout).strip()[-600:]}
    return {"ok": True, "image": str(png.relative_to(queue.ROOT)), "size": png.stat().st_size, "template": spec["template"]}

def render(entry: dict, timeout: int = 120) -> dict:
    """Render entry['creative'] (and entry['reveal']['creative']) to queue/<day>/<id>[.reveal].png. Mutates the entry; caller saves."""
    prepare(entry)
    issues = check(entry)
    if issues:
        entry.pop("image", None)
        entry["render"] = {"ok": False, "skipped": False, "error": "; ".join(issues)[:600]}
        return entry
    jobs = [("", entry.get("creative"))]
    if entry.get("reveal", {}).get("creative"):
        jobs.append((".reveal", entry["reveal"]["creative"]))
    jobs = [(suffix, spec) for suffix, spec in jobs if spec]
    if not jobs:
        return entry
    ok, why = available()
    if ok and entry.get("creative", {}).get("studio") and not (queue.ROOT / "website" / "node_modules" / "typescript").exists():
        ok, why = False, "website/node_modules/typescript not installed (run `npm ci` in website/)"
    if not ok:
        entry["render"] = {"ok": False, "skipped": True, "error": why}
        return entry
    results = {}
    for suffix, spec in jobs:
        results[suffix] = _render_spec(entry, spec, suffix, timeout)
    main, reveal = results.get(""), results.get(".reveal")
    if main and main["ok"]: entry["image"] = main["image"]
    elif main: entry.pop("image", None)
    if reveal and reveal["ok"]: entry["reveal"]["image"] = reveal["image"]
    elif reveal: entry["reveal"].pop("image", None)
    failed = [r for r in results.values() if not r["ok"]]
    entry["render"] = {"ok": not failed, "skipped": False, **({"error": failed[0]["error"]} if failed else {"images": len(results)})}
    import gc
    gc.collect()
    return entry
