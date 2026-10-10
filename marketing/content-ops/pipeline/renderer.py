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
from . import brand, queue

ENGINE = queue.ROOT / "marketing" / "templates" / "tg"
TEMPLATES = {"puzzle", "trap", "poll", "news", "culture", "tip", "rules", "product", "cover"}
FEN_TEMPLATES = {"puzzle", "poll"}  # the position is the point of these templates
SPEC_TEXT_FIELDS = ("headline", "subhead", "tag", "cta_label", "footer", "source")

def _text(spec: dict) -> str:
    parts = [str(spec.get(k, "")) for k in SPEC_TEXT_FIELDS]
    parts += [str(o.get("label", "")) for o in spec.get("options", []) if isinstance(o, dict)]
    parts += [str(s) for s in spec.get("steps", [])]
    parts += [str(p.get("text", "")) + " " + str(p.get("label", "")) for p in spec.get("panels", []) if isinstance(p, dict)]
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
    proc = subprocess.run(["node", str(ENGINE / "render.mjs"), str(spec_path), str(png)], capture_output=True, text=True, timeout=timeout)
    if proc.returncode != 0 or not png.exists():
        return {"ok": False, "skipped": False, "error": (proc.stderr or proc.stdout).strip()[-600:]}
    return {"ok": True, "image": str(png.relative_to(queue.ROOT)), "size": png.stat().st_size, "template": spec["template"]}

def render(entry: dict, timeout: int = 120) -> dict:
    """Render entry['creative'] (and entry['reveal']['creative']) to queue/<day>/<id>[.reveal].png. Mutates the entry; caller saves."""
    jobs = [("", entry.get("creative"))]
    if entry.get("reveal", {}).get("creative"):
        jobs.append((".reveal", entry["reveal"]["creative"]))
    jobs = [(suffix, spec) for suffix, spec in jobs if spec]
    if not jobs:
        return entry
    ok, why = available()
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
    return entry
