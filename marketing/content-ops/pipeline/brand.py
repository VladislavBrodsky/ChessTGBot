"""Brand voice, verified destinations and compliance copy. Single source for every writer and gate."""
from __future__ import annotations
from urllib.parse import urlencode, urlsplit, urlunsplit, parse_qsl

import os

SITE = os.environ.get("W3_SITE_URL", "https://web3chess.online")
APP = os.environ.get("W3_APP_URL", "https://app.web3chess.online")
BOT = "chess_matbot"
# Facts mirrored from website/src/lib/config.ts and marketing/templates/campaigns.js.
# startapp accepts only: omitted, "arena", "ref_<code>", or a reserved "mk_..." id. Never invent values.
TG_APP = f"https://t.me/{BOT}/Web3Chess"
TG_ARENA = f"{TG_APP}?startapp=arena"
CHANNEL = "https://t.me/chess_hub"
CHAT = "https://t.me/chesshub_chat"

CATEGORIES = [
    "Tactics", "Openings", "Academy", "Chess News", "Chess Culture",
    "Product", "Match Rules", "Chess Debate", "Psychology", "Engineering", "Tactical Matrix"
]

VIRAL_KEYWORD_CLUSTERS = {
    "tactics": [
        "blitz", "bullet", "premove", "time scramble", "time trouble", "flagging",
        "tactics", "puzzle", "checkmate", "calculation", "grandmaster", "elo rating",
        "smothered mate", "deflection", "fork", "pin", "zugzwang"
    ],
    "psychology": [
        "pattern recognition", "reaction time", "cognitive speed", "decision fatigue",
        "decision-making under pressure", "adrenaline", "tunnel vision", "nervous system",
        "tilt", "flow state", "mental stamina"
    ],
    "telegram": [
        "Telegram Mini App", "Telegram game", "Bot API 8.0", "TON ecosystem", "instant PvP",
        "zero latency", "sub-100ms sync", "no app download", "play in group chat"
    ],
    "skill_wager": [
        "skill-based gaming", "anti-brainrot", "zero-sum", "prize vault", "arena brackets",
        "USDT payout", "instant settlement"
    ]
}

# CTA registry: id -> (button label, url, wager?)
CTAS = {
    "play": ("Play a free game", TG_APP, False),
    "arena": ("Open the Arena", TG_ARENA, True),
    "academy": ("Open the Academy", f"{SITE}/academy", False),
    "puzzle": ("Try today's puzzle", f"{SITE}/?puzzle=back-rank#challenge", False),
    "rules": ("Read the match rules", f"{SITE}/wagers", True),
    "journal": ("Read the full story", f"{SITE}/blog", False),
    "channel": ("Join the channel", CHANNEL, False),
    "chat": ("Join the chat", CHAT, False),
}

ALLOWED_LINK_HOSTS = {
    "web3chess.online", "www.web3chess.online", "app.web3chess.online",
    "t.me"
}
ALLOWED_TME_PATHS = (f"/{BOT}", "/chess_hub", "/chesshub_chat")

WAGER_DISCLOSURE = "USDT matches are for adults (18+) where permitted. You can lose your stake."
WAGER_WORDS = ("usdt", "wager", "stake", "arena", "pot", "payout", "cash match", "real money")
YOUTH_WORDS = ("kid", "child", "children", "school", "junior", "youth", "teen", "under 18", "u18", "minor")
BANNED = (
    r"guaranteed (income|profit|returns?|win)", r"replace (your |a )?(salary|job|income)", r"get rich", r"risk[- ]free",
    r"earn \$?\d", r"make \$?\d+[kK]?\b", r"passive income", r"financial freedom", r"100% (win|safe)",
    r"limited (time|spots|seats)", r"only \d+ (left|spots|seats)", r"act now", r"last chance",
)

TOV = """Voice: a chess-literate friend with a point of view. Short opening line, concrete board detail,
confident explanation, restrained wit. Show the move or mechanism behind the headline.
Rules: no hype, no income or profit claims, no fake urgency, no invented numbers, testimonials or quotes.
At most 3 emoji, none as bullets. One idea, one CTA. Never copy a source's wording, structure or images;
rebuild the idea from our own position and explanation. Wager mentions always carry the adult disclosure
and are never paired with youth content. Name the move (SAN) and the square; give the reader something to try.
Hook Rule: NEVER end a hook or headline with a period ('.'). Periods act as a psychological stop sign and destroy curiosity momentum."""

def with_utm(url: str, campaign: str, content: str, medium: str = "social", source: str = "telegram") -> str:
    """Add standard UTM tags to our own web URLs, or configure startapp attribution for t.me links."""
    p = urlsplit(url)
    if p.hostname == "t.me":
        q = dict(parse_qsl(p.query))
        if "startapp" not in q:
            clean_tag = f"mk_{source}_{content.replace('-', '_')}"[:64]
            q["startapp"] = clean_tag
            return urlunsplit((p.scheme, p.netloc, p.path, urlencode(q), p.fragment))
        return url
    q = [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=True) if not k.startswith("utm_")]
    q += [("utm_source", source), ("utm_medium", medium), ("utm_campaign", campaign), ("utm_content", content)]
    return urlunsplit((p.scheme, p.netloc, p.path, urlencode(q), p.fragment))
