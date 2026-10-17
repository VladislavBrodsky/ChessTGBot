"""Main Mini App links require no assumed named app such as /app or /play."""
import re
from urllib.parse import urlencode
from app.core.config import get_settings

START_RE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


def is_invite_parameter(parameter):
    return bool(parameter and START_RE.fullmatch(parameter) and (parameter.startswith(("ref_", "go_", "fi_"))
        or parameter in {"arena", "academy", "box", "marketplace", "practice", "home"} or re.fullmatch(r"(?:[a-f0-9]{8}|[a-f0-9]{32}|(?:match_|arena\d+_)[A-Za-z0-9_-]+)", parameter)))


def app_link(parameter=None):
    bot = (get_settings().TELEGRAM_BOT_USERNAME or "chess_matbot").strip().lstrip("@")
    if parameter and not START_RE.fullmatch(parameter):
        raise ValueError("Invalid launch parameter")
    return f"https://t.me/{bot}?{urlencode({'startapp': parameter or ''})}"


def web_app_link(parameter, lang="en"):
    if not START_RE.fullmatch(parameter):
        raise ValueError("Invalid launch parameter")
    supported = {"en", "ru", "de", "es", "fr", "ar", "hi", "pt", "ja", "zh"}
    lang = lang if lang in supported else "en"
    return f"{get_settings().WEBAPP_URL.rstrip('/')}/{lang}/home?{urlencode({'startapp': parameter})}"
