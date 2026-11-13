"""Chess relevance, language guess and a 0-100 partner-fit score with readable reasons.

The score ranks who to contact first. It is a heuristic over public signals, not a forecast of
players a partner will bring; the attributed `mk_` link counts are the real outcome.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone

# Chess vocabulary across the languages Telegram chess actually uses. Word-ish matching, lower case.
CHESS_TERMS = [
    "chess", "шахмат", "шахи", "ajedrez", "xadrez", "échecs", "echecs", "schach", "scacchi", "szachy",
    "satranç", "satranc", "شطرنج", "शतरंज", "catur", "skak", "šach", "sakk", "шатранж", "shaxmat", "шахмат",
    "gambit", "гамбит", "endgame", "эндшпиль", "opening", "дебют", "checkmate", "мат в", "mate in",
    "grandmaster", "гроссмейстер", "fide", "фиде", "lichess", "chess.com", "elo", "эло", "blitz", "блиц",
    "puzzle", "задача", "этюд", "carlsen", "карлсен", "nakamura", "накамура", "hikaru",
]
STRONG = ["chess", "шахмат", "шахи", "ajedrez", "xadrez", "échecs", "schach", "scacchi", "szachy",
          "satranç", "شطرنج", "शतरंज", "catur", "shaxmat", "lichess", "fide", "фиде"]

# Hard negatives: things that look like leads but must never be contacted or are not a fit.
NEGATIVE = ["casino", "казино", "betting tips", "ставки на спорт", "onlyfans", "18+ video", "porn", "порно",
            "signals vip", "pump", "airdrop hunter", "взлом", "hack account"]

LANG_PRIORITY = {"en": 5, "ru": 5, "es": 4, "pt": 4, "hi": 4, "fa": 4, "tr": 4, "id": 4, "uz": 4, "uk": 4,
                 "de": 3, "fr": 3, "ar": 3, "it": 3, "pl": 3}


def _text(*parts) -> str:
    return " ".join(p for p in parts if p).lower()


def relevance(title: str | None, description: str | None, post_texts: list[str]) -> float:
    """0..1. Title/description carry most weight; the share of chess posts confirms it."""
    head = _text(title, description)
    head_hit = 1.0 if any(t in head for t in STRONG) else (0.5 if any(t in head for t in CHESS_TERMS) else 0.0)
    posts = [p.lower() for p in post_texts if p]
    share = (sum(1 for p in posts if any(t in p for t in CHESS_TERMS)) / len(posts)) if posts else 0.0
    return round(min(1.0, 0.6 * head_hit + 0.4 * min(1.0, share * 1.5)), 3)


def negative(title: str | None, description: str | None) -> str | None:
    head = _text(title, description)
    for term in NEGATIVE:
        if term in head:
            return term
    return None


def guess_language(*texts: str | None) -> str:
    s = " ".join(t for t in texts if t)
    if not s.strip():
        return "unknown"
    counts = {
        "cyr": len(re.findall(r"[а-яёіїєґ]", s, re.I)),
        "arab": len(re.findall(r"[؀-ۿ]", s)),
        "deva": len(re.findall(r"[ऀ-ॿ]", s)),
        "latin": len(re.findall(r"[a-z]", s, re.I)),
    }
    script = max(counts, key=counts.get)
    if counts[script] == 0:
        return "unknown"
    if script == "cyr":
        if re.search(r"[іїєґ]", s, re.I):
            return "uk"
        if re.search(r"\b(va|uchun|bilan|o['ʻ]yin)\b", s, re.I):
            return "uz"
        return "ru"
    if script == "arab":
        return "fa" if re.search(r"[پچژگ]", s) else "ar"
    if script == "deva":
        return "hi"
    low = s.lower()
    if re.search(r"[ñ¿¡]|\b(el|los|para|ajedrez|partida)\b", low):
        return "es"
    if re.search(r"[ãõ]|\b(xadrez|você|para o|partida de)\b", low):
        return "pt"
    if re.search(r"[şğı]|\b(satranç|ve bir)\b", low):
        return "tr"
    if re.search(r"\b(dan|yang|untuk|catur)\b", low):
        return "id"
    if re.search(r"[äöüß]|\b(schach|und|der|die)\b", low):
        return "de"
    if re.search(r"\b(échecs|le|la|les|pour)\b", low):
        return "fr"
    return "en"


EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}")
HANDLE_RE = re.compile(r"(?<![\w@/])@([A-Za-z][A-Za-z0-9_]{3,31})\b")
AD_HINTS = ["реклам", "сотруднич", "по вопросам", "admin", "админ", "ads", "advert", "contact", "связь",
            "cooperation", "business", "promo", "менеджер", "manager", "publicidad", "contato", "parceria"]


def contact_route(description: str | None, own_handle: str) -> str:
    """Public contact from a channel/creator description: business email or the admin @handle.
    Lines mentioning ads/cooperation win over a bare mention."""
    if not description:
        return ""
    lines = [l.strip() for l in re.split(r"[\n|•·]", description) if l.strip()]
    emails = EMAIL_RE.findall(description)
    hinted, plain = [], []
    for line in lines:
        handles = [h for h in HANDLE_RE.findall(line) if h.lower() != own_handle.lower() and not h.lower().endswith("bot")]
        (hinted if any(k in line.lower() for k in AD_HINTS) else plain).extend(handles)
    parts = []
    if hinted or plain:
        parts.append("tg:@" + (hinted or plain)[0])
    if emails:
        parts.append("email:" + emails[0])
    return " ".join(parts)


def size_points(audience: int | None) -> tuple[int, str]:
    if not audience:
        return 4, "audience unknown"
    bands = [(300, 2, "<300"), (1_000, 8, "300-1k"), (5_000, 16, "1k-5k"), (50_000, 20, "5k-50k (sweet spot)"),
             (200_000, 14, "50k-200k"), (10**12, 8, "200k+ (hard to land)")]
    for limit, points, label in bands:
        if audience < limit:
            return points, label
    return 8, "200k+"


def score(lead: dict, now: datetime | None = None) -> tuple[int, list[str]]:
    now = now or datetime.now(timezone.utc)
    reasons = []
    rel = float(lead.get("relevance") or 0)
    rel_pts = round(35 * rel)
    reasons.append(f"chess relevance {rel:.2f} (+{rel_pts})")
    size, label = size_points(lead.get("audience"))
    reasons.append(f"size {label} (+{size})")
    eng = 0
    aud, views = lead.get("audience") or 0, lead.get("median_views")
    if aud and views is not None:
        ratio = views / aud
        eng = 15 if ratio >= 0.3 else 10 if ratio >= 0.15 else 6 if ratio >= 0.05 else 1
        reasons.append(f"views/audience {ratio:.2f} (+{eng})")
    elif lead.get("platform") == "youtube":
        eng = 6
        reasons.append("engagement unmeasured (+6)")
    act = 0
    last = lead.get("last_post_at")
    if last:
        try:
            days = (now - datetime.fromisoformat(last.replace("Z", "+00:00"))).days
            act = 15 if days <= 3 else 10 if days <= 14 else 4 if days <= 45 else 0
            reasons.append(f"last post {days}d ago (+{act})")
        except ValueError:
            pass
    reach = 10 if lead.get("contact_route") else 2
    reasons.append("public contact found (+10)" if reach == 10 else "no public contact (+2)")
    lang = LANG_PRIORITY.get(lead.get("language") or "", 2)
    reasons.append(f"language {lead.get('language') or 'unknown'} (+{lang})")
    total = rel_pts + size + eng + act + reach + lang
    if rel < 0.3:
        total = min(total, 25)
        reasons.append("capped: weak chess relevance")
    return max(0, min(100, total)), reasons
