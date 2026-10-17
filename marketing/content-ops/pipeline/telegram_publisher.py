"""Publish queued posts to the Telegram channel through the Bot API. Dry run unless credentials are set."""
from __future__ import annotations
import json, os, time, uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from . import brand, queue

API = "https://api.telegram.org"

# Load local marketing .env if present
ROOT_DIR = Path(__file__).resolve().parents[3]
ENV_FILE = ROOT_DIR / "marketing/.env"
if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

def _credentials():
    cfg = queue.CONFIG["telegram"]
    token = os.environ.get(cfg["token_env"]) or os.environ.get("TELEGRAM_BOT_TOKEN") or os.environ.get("W3_TG_BOT_TOKEN")
    channel = os.environ.get(cfg["channel_env"]) or os.environ.get("TELEGRAM_CHANNEL") or os.environ.get("W3_TG_CHANNEL") or "@chess_hub"
    return token, channel

def build_keyboard(post: dict) -> dict:
    ids = [c for c in [post.get("cta"), *post.get("extra_buttons", [])] if c]
    rows = []
    for cta_id in ids[:2]:
        label, url, _ = brand.CTAS[cta_id]
        if "t.me" in url:
            tracked_url = brand.with_startapp(url, "tg", post["id"])
        else:
            tracked_url = brand.with_utm(
                url,
                post.get("category", "content").lower().replace(" ", "-"),
                post["id"],
                source="telegram",
            )
        rows.append([{"text": label, "url": tracked_url}])
    return {"inline_keyboard": rows}

def _call(token: str, method: str, fields: dict, file: tuple[str, Path] | None = None) -> dict:
    url = f"{API}/bot{token}/{method}"
    if file:
        boundary = uuid.uuid4().hex
        body = b""
        for key, value in fields.items():
            body += f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode()
        field, path = file
        body += (f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; filename="{path.name}"\r\n'
                 f"Content-Type: image/png\r\n\r\n").encode() + path.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
        request = Request(url, data=body, headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    else:
        request = Request(url, data=json.dumps(fields).encode(), headers={"Content-Type": "application/json"})
    for attempt in range(3):
        try:
            with urlopen(request, timeout=30) as response:
                return json.loads(response.read())
        except HTTPError as exc:
            payload = {}
            try: payload = json.loads(exc.read())
            except Exception: pass
            if exc.code == 429 and attempt < 2:
                time.sleep(min(60, int(payload.get("parameters", {}).get("retry_after", 5)))); continue
            raise RuntimeError(f"Telegram {method} failed: {exc.code} {payload.get('description', '')}") from None
        except URLError as exc:
            if attempt == 2: raise RuntimeError(f"Telegram unreachable: {exc.reason}") from None
            time.sleep(2 ** attempt)
    raise RuntimeError("unreachable")

def _deliver(token: str, channel: str, text: str, image: Path | None, markup: dict, reply_to: int | None = None) -> int:
    """Send one message (photo+caption when an image exists, otherwise text) and return its message_id."""
    reply = {"reply_parameters": {"message_id": reply_to, "allow_sending_without_reply": True}} if reply_to else {}
    if image and image.exists():
        fields = {"chat_id": channel, "parse_mode": "HTML", "caption": text, "reply_markup": json.dumps(markup)}
        if reply_to: fields["reply_parameters"] = json.dumps(reply["reply_parameters"])
        return _call(token, "sendPhoto", fields, ("photo", image))["result"]["message_id"]
    return _call(token, "sendMessage", {"chat_id": channel, "parse_mode": "HTML", "text": text, "reply_markup": markup,
                                        "link_preview_options": {"is_disabled": True}, **reply})["result"]["message_id"]

def publish(post: dict, dry_run: bool | None = None) -> dict:
    token, channel = _credentials()
    live = bool(token and channel) and dry_run is not True
    markup = build_keyboard(post)
    image = None
    if post.get("image"):
        p = Path(post["image"])
        if p.is_absolute() and p.exists():
            image = p
        elif (queue.ROOT / p).exists():
            image = queue.ROOT / p
        elif (queue.HERE / p).exists():
            image = queue.HERE / p
        else:
            image = queue.ROOT / p
    elif post.get("creative"):
        cand = queue.QUEUE / post.get("date", post["id"][:10]) / f"{post['id']}.png"
        if cand.exists():
            image = cand

    if post.get("creative") and not (image and image.exists()):
        raise RuntimeError("creative image missing: run `daily.py render` (never falling back to a text-only post)")
    if not live:
        return {"dry_run": True, "would_send": "photo" if image else "message", "chars": len(post["text"]), "buttons": markup}
    from .engagement import assert_live_offer
    assert_live_offer(post)
    return {"dry_run": False, "message_id": _deliver(token, channel, post["text"], image, markup)}

def publish_post_by_id(post_id: str, dry_run: bool | None = None) -> dict:
    post = queue.load(post_id)
    token, channel = _credentials()
    live = bool(token and channel) and dry_run is not True
    if live: queue.set_status(post, "publishing")
    try:
        outcome = publish(post, dry_run)
    except Exception as exc:
        if live: queue.set_status(post, "approved", last_error=str(exc)[:200])
        raise
    if not outcome.get("dry_run"):
        queue.set_status(post, "published", published={"message_id": outcome["message_id"], "at": queue.iso(queue.utcnow())})
        try:
            from . import cleanup
            cleanup.cleanup_post_media(post, delete_reveal=False)
        except Exception:
            pass
    return {"id": post_id, **outcome}

def publish_reveals(now=None, dry_run: bool | None = None) -> list[dict]:
    """Send each published puzzle's answer as a threaded reply once `reveal.after_hours` have passed (once only)."""
    now = now or queue.utcnow()
    token, channel = _credentials()
    live = bool(token and channel) and dry_run is not True
    report = []
    for post in queue.all_entries("telegram", "published"):
        reveal = post.get("reveal")
        if not reveal or reveal.get("sent"): continue
        published = datetime.strptime(post["published"]["at"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        if now < published + timedelta(hours=reveal.get("after_hours", 6)): continue
        image = None
        if reveal.get("image"):
            p = Path(reveal["image"])
            if p.is_absolute() and p.exists():
                image = p
            elif (queue.ROOT / p).exists():
                image = queue.ROOT / p
            elif (queue.HERE / p).exists():
                image = queue.HERE / p
        elif reveal.get("creative"):
            cand = queue.QUEUE / post.get("date", post["id"][:10]) / f"{post['id']}.reveal.png"
            if cand.exists():
                image = cand
        if reveal.get("creative") and not (image and image.exists()):
            report.append({"id": post["id"], "error": "reveal image missing: run `daily.py render`"}); continue
        if not live:
            report.append({"id": post["id"], "dry_run": True, "would_reply_to": post["published"]["message_id"]}); continue
        reveal["sent"] = {"at": queue.iso(queue.utcnow()), "claimed": True}  # at-most-once, like the main post
        queue.save(post)
        try:
            message_id = _deliver(token, channel, reveal["text"], image, {"inline_keyboard": []}, reply_to=post["published"]["message_id"])
        except Exception as exc:
            reveal.pop("sent"); queue.save(post)
            report.append({"id": post["id"], "error": str(exc)[:200]}); continue
        reveal["sent"]["message_id"] = message_id; queue.save(post)
        try:
            from . import cleanup
            cleanup.cleanup_post_media(post, delete_reveal=True)
        except Exception:
            pass
        report.append({"id": post["id"], "revealed": message_id})
    return report

def publish_due(now=None, dry_run: bool | None = None, limit: int = 5, day: str | None = None) -> list[dict]:
    now = now or queue.utcnow()
    report = []
    for post in queue.all_entries("telegram", "approved", day=day):
        if post["scheduled_at"] > queue.iso(now) or len(report) >= limit: continue
        live = all(_credentials()) and dry_run is not True
        if live: queue.set_status(post, "publishing")  # at-most-once: a crash mid-send must not double-post
        try:
            outcome = publish(post, dry_run)
        except Exception as exc:  # confirmed failure: release it so the next run retries
            if live: queue.set_status(post, "approved", last_error=str(exc)[:200])
            report.append({"id": post["id"], "error": str(exc)[:200]}); continue
        if not outcome["dry_run"]:
            queue.set_status(post, "published", published={"message_id": outcome["message_id"], "at": queue.iso(queue.utcnow())})
            try:
                from . import cleanup
                cleanup.cleanup_post_media(post, delete_reveal=False)
            except Exception:
                pass
        report.append({"id": post["id"], **outcome})
    return report


def notify_x_post_in_channel(
    post_id: str,
    hook: str,
    x_url: str,
    image_path: Path | str | None = None,
    dry_run: bool | None = None,
) -> dict:
    """Sends a curated, beautifully styled community debate spotlight to Telegram channel."""
    token, channel = _credentials()
    live = bool(token and channel) and dry_run is not True
    clean_hook = hook.strip()
    if clean_hook.endswith("."):
        clean_hook = clean_hook[:-1]

    text = (
        f"♟️ <b>COMMUNITY TACTICAL DEBATE</b>\n\n"
        f"<blockquote>\"{clean_hook}\"</blockquote>\n\n"
        f"Where does your tactical instinct stand under 3 seconds? Join the discussion with the grandmasters on X or test your intuition live."
    )
    markup = {
        "inline_keyboard": [
            [
                {"text": "💬 Join Debate on X ↗", "url": x_url},
                {"text": "⚡️ Play in Telegram", "url": brand.TG_APP},
            ]
        ]
    }
    img = None
    if image_path:
        p = Path(image_path)
        if p.exists():
            img = p

    if not live:
        return {"dry_run": True, "post_id": post_id, "hook": clean_hook, "x_url": x_url}

    msg_id = _deliver(token, channel, text, img, markup)
    return {"dry_run": False, "post_id": post_id, "message_id": msg_id, "x_url": x_url}


