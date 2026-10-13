"""Deterministic quality gates. Every writer passes through these before anything is scheduled."""
from __future__ import annotations
import html, re
from html.parser import HTMLParser
from urllib.parse import urlsplit, parse_qsl
from . import brand, chesscheck, renderer

TG_TAGS = {"b", "strong", "i", "em", "u", "ins", "s", "strike", "del", "a", "code", "pre", "tg-spoiler", "blockquote", "span", "tg-emoji"}
STOCK = ("white to move", "black to move", "find the best move", "mate in one", "mate in two", "mate in 1", "mate in 2", "web3chess", "play chess in telegram", "free a.i. practice")
ACRONYMS = {"USDT", "FIDE", "FEN", "SAN", "ELO", "XP", "USD", "CHESS", "PGN", "TON", "UTC", "AI"}
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-➿⭐⬆⬇⬛⬜⌀-⏿\U0001F000-\U0001F2FF]")

def words(text: str) -> list[str]:
    return re.findall(r"[^\W_]+(?:'[^\W_]+)?", html.unescape(re.sub(r"<[^>]+>", " ", text)).lower())

def plain(text: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", text))).strip()

def _strip_stock(text: str) -> str:
    out = text.lower()
    for phrase in STOCK:
        out = out.replace(phrase, " ")
    return out

def shingles(tokens: list[str], n: int) -> set[tuple[str, ...]]:
    return {tuple(tokens[i:i + n]) for i in range(max(0, len(tokens) - n + 1))}

def originality(text: str, references: list[str], max_run: int = 6, max_jaccard: float = 0.18) -> list[str]:
    """Reject text that reuses a reference's wording. A shared run of `max_run`+ words, or heavy 3-gram overlap, fails."""
    issues: list[str] = []
    mine = words(_strip_stock(plain(text)))
    for index, ref in enumerate(references):
        theirs = words(_strip_stock(plain(ref)))
        if len(theirs) < 4 or len(mine) < 4:
            continue
        if shingles(mine, max_run) & shingles(theirs, max_run):
            issues.append(f"copies a {max_run}+ word run from reference #{index + 1}")
        a, b = shingles(mine, 3), shingles(theirs, 3)
        if a and b:
            score = len(a & b) / len(a | b)
            if score > max_jaccard:
                issues.append(f"wording overlaps reference #{index + 1} too closely ({score:.2f})")
    return issues

class _TagCheck(HTMLParser):
    def __init__(self):
        super().__init__(); self.stack: list[str] = []; self.errors: list[str] = []; self.links: list[str] = []
    def handle_starttag(self, tag, attrs):
        if tag not in TG_TAGS:
            self.errors.append(f"unsupported tag <{tag}>")
        if tag == "a":
            href = dict(attrs).get("href")
            if href: self.links.append(href)
        if tag not in {"br"}: self.stack.append(tag)
    def handle_endtag(self, tag):
        if not self.stack or self.stack[-1] != tag: self.errors.append(f"unbalanced </{tag}>")
        else: self.stack.pop()

def telegram_html(text: str) -> tuple[list[str], list[str]]:
    parser = _TagCheck(); parser.feed(text); parser.close()
    errors = list(parser.errors)
    if parser.stack: errors.append("unclosed tags: " + ",".join(parser.stack))
    # raw '<' or '&' that is not a tag/entity breaks parse_mode=HTML
    stripped = re.sub(r"<[^<>]+>", "", text)
    if re.search(r"<|>", stripped): errors.append("unescaped < or >")
    if re.search(r"&(?!(?:amp|lt|gt|quot|#\d+|#x[0-9a-fA-F]+);)", stripped): errors.append("unescaped &")
    return errors, parser.links

def check_link(url: str) -> list[str]:
    p = urlsplit(url); issues = []
    if p.scheme != "https": return [f"link must be https: {url}"]
    host = p.hostname or ""
    if host not in brand.ALLOWED_LINK_HOSTS: return [f"link host not allowed: {host}"]
    if host == "t.me":
        if not p.path.startswith(brand.ALLOWED_TME_PATHS): issues.append(f"t.me path not allowed: {p.path}")
        sa = dict(parse_qsl(p.query)).get("startapp")
        if sa and sa != "arena" and not (sa.startswith("mk_") or sa.startswith("ref_")):
            issues.append(f"startapp value not permitted: {sa}")
    return issues

def compliance(text: str, cta_ids: list[str] | None = None) -> list[str]:
    issues: list[str] = []
    low = plain(text).lower()
    for pattern in brand.BANNED:
        if re.search(pattern, low): issues.append(f"banned claim pattern: {pattern}")
    wager = any(re.search(rf"\b{re.escape(w)}s?\b", low) for w in brand.WAGER_WORDS) or any(brand.CTAS[c][2] for c in (cta_ids or []) if c in brand.CTAS)
    if wager:
        if "18+" not in low or "lose your stake" not in low:
            issues.append("wager content needs the adult disclosure: 18+ and 'You can lose your stake.'")
        if any(re.search(rf"\b{w}", low) for w in brand.YOUTH_WORDS):
            issues.append("wager content must not be paired with youth language")
    return issues

def tone(text: str, max_emoji: int = 3) -> list[str]:
    issues: list[str] = []
    body = plain(text)
    if len(EMOJI.findall(body)) > max_emoji: issues.append(f"more than {max_emoji} emoji")
    caps = [w for w in re.findall(r"\b[A-Z][A-Z0-9]{3,}\b", body) if w not in ACRONYMS]
    if len(caps) > 2: issues.append("shouting: too many ALL-CAPS words")
    if re.search(r"!{2,}|\?{3,}", body): issues.append("repeated punctuation")
    if re.search(r"\b(TODO|TBD|lorem|\[[^\]]*\.\.\.[^\]]*\]|XXX)\b", body, re.I): issues.append("placeholder text left in copy")
    return issues

def check_telegram(post: dict, corpus: list[str] | None = None) -> dict:
    issues: list[str] = []
    text = post.get("text", "")
    if post.get("category") not in brand.CATEGORIES: issues.append("invalid category")
    if not text.strip(): issues.append("empty text")
    errs, inline_links = telegram_html(text); issues += errs
    body = plain(text)
    limit = 1024 if post.get("image") or post.get("creative") else 4096
    if len(body) > limit: issues.append(f"text is {len(body)} chars; limit {limit}")
    first = body.split("\n")[0][:200] if "\n" in body else body[:200]
    hook = plain(post.get("hook", "") or text.split("\n")[0])
    if not hook or len(hook) > 110: issues.append("hook missing or over 110 chars")
    if hook.rstrip().endswith("."): issues.append("hook must not end with a period (kill-switch on curiosity/momentum)")
    ctas = [post.get("cta")] + list(post.get("extra_buttons", []))
    ctas = [c for c in ctas if c]
    if not ctas: issues.append("a CTA is required")
    if post.get("creative", {}).get("template") == "reward" and not post.get("requires_campaign"):
        issues.append("reward ads require a verified live campaign identifier")
    if len(ctas) > 2: issues.append("at most two buttons")
    for c in ctas:
        if c not in brand.CTAS: issues.append(f"unknown CTA id {c}")
    for url in inline_links: issues += check_link(url)
    issues += compliance(text, ctas)
    issues += tone(text)
    refs = [s.get("excerpt", "") for s in post.get("sources", []) if s.get("kind") == "competitor" and s.get("excerpt")]
    issues += originality(text, refs)
    for other in corpus or []:
        a, b = shingles(words(plain(text)), 3), shingles(words(plain(other)), 3)
        if a and b and len(a & b) / len(a | b) > 0.45: issues.append("near-duplicate of an earlier post"); break
    issues += renderer.check(post)
    if post.get("reveal", {}).get("text"):
        rerrs, rlinks = telegram_html(post["reveal"]["text"]); issues += [f"reveal: {e}" for e in rerrs]
        for url in rlinks: issues += [f"reveal: {e}" for e in check_link(url)]
        issues += [f"reveal: {e}" for e in compliance(post["reveal"]["text"], ctas) + tone(post["reveal"]["text"])]
    chess_spec = post.get("chess")
    if chess_spec:
        issues += chesscheck.verify_puzzle(chess_spec["fen"], chess_spec.get("solution", []), chess_spec.get("claim"))
    elif post.get("format") in {"puzzle", "trap"}:
        issues.append("puzzle/trap posts must carry a verified position")
    return {"passed": not issues, "issues": issues}

def check_article(article: dict, corpus: list[str] | None = None, references: list[str] | None = None) -> dict:
    """`article` is the website JSON. The website's own checker still runs at staging time."""
    issues: list[str] = []
    if article.get("category") not in brand.CATEGORIES: issues.append("invalid category")
    blocks = article.get("content", [])
    text = " ".join(str(b.get("text", "")) + " " + " ".join(b.get("items", [])) for b in blocks)
    words_n = len(words(text))
    if words_n < 450: issues.append(f"article is {words_n} words; minimum 450 for a useful explanation")
    if not any(b.get("type") == "chess_position" for b in blocks) and article.get("category") in {"Tactics", "Openings", "Academy"}:
        issues.append("tactics/openings/academy articles need at least one verified position")
    for block in blocks:
        if block.get("type") == "chess_position":
            try:
                if block.get("moves"):
                    board, _ = chesscheck.play_line(block.get("initialFen") or chesscheck.chess.STARTING_FEN, block["moves"])
                    if board.fen() != chesscheck.parse_fen(block["fen"]).fen(): issues.append("diagram does not match its move list")
                else:
                    chesscheck.parse_fen(block["fen"])
            except (ValueError, RuntimeError) as exc:
                issues.append(f"chess block invalid: {exc}")
    if len(article.get("sources", [])) < 1: issues.append("sources required")
    for s in article.get("sources", []):
        if not str(s.get("url", "")).startswith("https://"): issues.append("source URLs must be https")
    issues += compliance(text + " " + article.get("title", "") + " " + article.get("excerpt", ""))
    issues += tone(article.get("title", "") + ". " + article.get("excerpt", ""))
    if len(article.get("title", "")) > 100: issues.append("title over 100 chars")
    if len(article.get("metaDescription", "")) > 170: issues.append("metaDescription over 170 chars")
    issues += originality(text, references or [], max_run=7)
    for other in corpus or []:
        a, b = shingles(words(text), 4), shingles(words(other), 4)
        if a and b and len(a & b) / len(a | b) > 0.3: issues.append("near-duplicate of an existing article"); break
    return {"passed": not issues, "issues": issues}


def check_x_post(post: dict, corpus: list[str] | None = None) -> dict:
    """Validates single X (Twitter) post against 2026 algorithmic and compliance standards."""
    issues: list[str] = []
    text = post.get("text", "")
    if not text.strip():
        issues.append("empty text")
    body = plain(text)
    if len(body) > 280:
        issues.append(f"tweet text is {len(body)} chars; limit 280")
    if re.search(r"https?://", text):
        issues.append("root tweet must not contain outbound links to avoid algorithmic reach penalties; use docked_reply instead")
    hook = plain(post.get("hook", "") or text.split("\n")[0])
    if hook and len(hook) > 100:
        issues.append("hook over 100 chars")
    if hook.rstrip().endswith("."):
        issues.append("hook must not end with a period (kill-switch on curiosity/momentum)")
    hashtags = re.findall(r"#\w+", text)
    if len(hashtags) > 3:
        issues.append("more than 3 hashtags; X algorithm penalizes multi-hashtag clutter (keep 2-3 max)")
    issues += tone(text, max_emoji=2)

    docked = post.get("docked_reply")
    if docked:
        docked_text = docked.get("text", "") if isinstance(docked, dict) else str(docked)
        docked_body = plain(docked_text)
        if len(docked_body) > 280:
            issues.append(f"docked reply text is {len(docked_body)} chars; limit 280")
        links = re.findall(r"https?://[^\s]+", docked_text)
        for url in links:
            issues += check_link(url)
        issues += tone(docked_text, max_emoji=2)
        issues += compliance(text + " " + docked_text)
    else:
        issues += compliance(text)

    chess_spec = post.get("chess")
    if chess_spec:
        issues += chesscheck.verify_puzzle(chess_spec["fen"], chess_spec.get("solution", []), chess_spec.get("claim"))

    if post.get("creative"):
        issues += renderer.check(post)
        size = post["creative"].get("size")
        if size and size != "square":
            issues.append(f"X creative must use 1:1 format (size='square'); got '{size}'")

    return {"passed": not issues, "issues": issues}


def check_x_thread(thread: dict, corpus: list[str] | None = None) -> dict:
    """Validates multi-tweet X thread against structure, compliance, and length bounds."""
    issues: list[str] = []
    tweets = thread.get("tweets", [])
    if len(tweets) < 3:
        issues.append("thread must have at least 3 tweets")
    elif len(tweets) > 10:
        issues.append("thread must have at most 10 tweets")

    if tweets and re.search(r"https?://", tweets[0].get("text", "")):
        issues.append("root tweet of thread must not contain outbound links")

    has_allowed_link = False
    for idx, t in enumerate(tweets, start=1):
        t_text = t.get("text", "")
        t_body = plain(t_text)
        if len(t_body) > 280:
            issues.append(f"tweet #{idx} is {len(t_body)} chars; limit 280")
        hashtags = re.findall(r"#\w+", t_text)
        if len(hashtags) > 3:
            issues.append(f"tweet #{idx} has more than 3 hashtags")
        issues += tone(t_text, max_emoji=2)
        issues += compliance(t_text)
        links = re.findall(r"https?://[^\s]+", t_text)
        for url in links:
            link_issues = check_link(url)
            issues += [f"tweet #{idx}: {e}" for e in link_issues]
            if not link_issues:
                has_allowed_link = True

    if tweets and not has_allowed_link:
        issues.append("final CTA tweet of thread should include an allowed destination link")

    return {"passed": not issues, "issues": issues}

