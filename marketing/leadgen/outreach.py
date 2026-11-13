"""Outreach drafts for a human to send, one per lead, plus two follow-ups.

Every claim here must match the product today (checked 2026-11-12 against origin/main):
- free: A.I. coach practice and Academy puzzles; no wallet needed;
- every game against a person carries a stake of at least $1 (adults only; you can lose your stake);
- the decided-game pot split is 95% winner / 3% platform / 2% referral (website/src/lib/config.ts);
- the free Arena and free friend challenges are switched off (commit c9aa862c5c).
Do not promise free PvP, prizes, earnings or player numbers. Update these templates when the product changes.

Drafts are never sent by this module. Telegram forbids unsolicited bulk messaging and treats it as
spam; a person sends each message from their own account to a PUBLIC business contact only.
"""
from __future__ import annotations

BOT = "chess_matbot"
RULES = "https://web3chess.online/rules"
SITE = "https://web3chess.online"


def partner_link(campaign: str) -> str:
    """t.me Mini App link with first-touch attribution (backend: player_tracking.attribute_marketing)."""
    return f"https://t.me/{BOT}?startapp={campaign}"


OFFERS = {
    "telegram_chess_channel": {
        "en": ("Hi {name} team, I run partnerships at Web3Chess, a chess game that opens right inside Telegram. "
               "Your channel is one of the few that posts {topic} consistently, so a quick idea: we make original, engine-checked "
               "puzzles every day and can send you a ready post (image + solution) for free, with a link to play the position "
               "against our A.I. coach. If your readers like it we can talk about a paid placement too. "
               "Want me to send a sample this week?\n\nTracking link for your audience: {link}"),
        "ru": ("Здравствуйте, команда {name}! Я отвечаю за партнёрства в Web3Chess — шахматы, которые открываются прямо в Telegram. "
               "Ваш канал регулярно публикует {topic}, поэтому предложение: мы каждый день делаем авторские задачи с проверкой движком "
               "и можем бесплатно присылать готовый пост (картинка + решение) со ссылкой, где позицию можно доиграть против нашего ИИ-тренера. "
               "Если подписчикам понравится, обсудим и платное размещение. Прислать пример на этой неделе?\n\nСсылка с отслеживанием: {link}"),
    },
    "telegram_chess_group": {
        "en": ("Hi! I'm with Web3Chess (chess inside Telegram). Would a weekly puzzle for {name} be welcome? We'd post one "
               "original position with a full solution, and members can replay it against our free A.I. coach. "
               "No spam, one post a week, and we stop the moment you say so. Can I send the first one for your approval?\n\n{link}"),
        "ru": ("Здравствуйте! Я из Web3Chess (шахматы внутри Telegram). Уместна ли раз в неделю шахматная задача для {name}? "
               "Одна авторская позиция с полным решением, и её можно доиграть против бесплатного ИИ-тренера. "
               "Без спама, один пост в неделю, прекращаем по первому слову. Прислать первую на согласование?\n\n{link}"),
    },
    "youtube_chess_creator": {
        "en": ("Hi {name}, I'm with Web3Chess, a chess game that runs inside Telegram. I've been watching your {topic} videos "
               "and think your viewers would enjoy replaying a position from your next video against our A.I. coach in one tap. "
               "We'd like to sponsor a short integration or a pinned-comment link, paid per placement, with a tracking link so you "
               "see exactly how many viewers played. Open to a quick chat about rates?\n\nYour tracking link: {link}"),
        "ru": ("Здравствуйте, {name}! Я из Web3Chess — шахматы, которые работают внутри Telegram. Смотрю ваши видео про {topic} "
               "и думаю, зрителям понравится доигрывать позицию из ролика против нашего ИИ-тренера в один клик. "
               "Хотим спонсировать короткую интеграцию или ссылку в закреплённом комментарии, оплата за размещение, "
               "со ссылкой-трекером, чтобы вы видели, сколько зрителей сыграли. Обсудим условия?\n\nВаша ссылка: {link}"),
    },
    "chess_coach": {
        "en": ("Hi {name}, I'm with Web3Chess. Your students could practise between lessons with our free A.I. coach and daily "
               "puzzles, right inside Telegram, no install. If you share it, your own invite link from the app pays the referral "
               "share described in our rules ({rules}) when players you invite play stake matches (adults only). "
               "Want a 10-minute walkthrough?\n\n{link}"),
        "ru": ("Здравствуйте, {name}! Я из Web3Chess. Ваши ученики могут тренироваться между уроками с бесплатным ИИ-тренером и "
               "ежедневными задачами прямо в Telegram, без установки. Если вы поделитесь приложением, ваша личная ссылка-приглашение "
               "приносит реферальную долю по нашим правилам ({rules}), когда приглашённые играют матчи на ставку (только 18+). "
               "Показать за 10 минут?\n\n{link}"),
    },
    "ton_gaming_community": {
        "en": ("Hi {name} team, Web3Chess here: skill-based chess inside Telegram, with free A.I. practice and USDT stake "
               "matches from $1 for adults (18+, you can lose your stake). We're looking for cross-promotion with Telegram game "
               "communities: a post swap, a joint challenge, or a paid post. Our referral share is public in the rules ({rules}). "
               "Interested?\n\n{link}"),
        "ru": ("Здравствуйте, команда {name}! Это Web3Chess: шахматы на навык внутри Telegram, бесплатная практика с ИИ и матчи "
               "на USDT от $1 для взрослых (18+, ставку можно проиграть). Ищем кросс-промо с игровыми Telegram-сообществами: "
               "обмен постами, совместный челлендж или платный пост. Реферальная доля описана в правилах ({rules}). Интересно?\n\n{link}"),
    },
}
OFFERS["chess_club_online"] = OFFERS["chess_coach"]
OFFERS["x_chess_account"] = OFFERS["youtube_chess_creator"]
OFFERS["tiktok_chess_creator"] = OFFERS["youtube_chess_creator"]
OFFERS["twitch_chess_streamer"] = OFFERS["youtube_chess_creator"]

FOLLOWUPS = {
    1: {"en": "Hi again {name}, just bumping this in case it got buried. Happy to send one sample post so you can judge it. If it's not a fit, no reply needed, I won't write again after one more note.",
        "ru": "Ещё раз здравствуйте, {name}! Напоминаю на случай, если сообщение потерялось. Могу прислать один пример поста. Если не подходит, отвечать не нужно, после ещё одного сообщения я больше не напишу."},
    2: {"en": "Last note from me, {name}. If partnerships open up later, this link stays yours: {link}. Thanks for the chess content.",
        "ru": "Последнее сообщение от меня, {name}. Если партнёрства станут актуальны, ссылка останется вашей: {link}. Спасибо за шахматный контент."},
}

TOPICS = {"en": "chess puzzles and games", "ru": "шахматные задачи и партии"}
TOPIC_HINTS = [
    ("opening", {"en": "opening", "ru": "дебютах"}), ("дебют", {"en": "opening", "ru": "дебютах"}),
    ("tactic", {"en": "tactics", "ru": "тактике"}), ("тактик", {"en": "tactics", "ru": "тактике"}),
    ("endgame", {"en": "endgame", "ru": "эндшпиле"}), ("эндшпил", {"en": "endgame", "ru": "эндшпиле"}),
    ("blitz", {"en": "blitz", "ru": "блице"}), ("блиц", {"en": "blitz", "ru": "блице"}),
    ("news", {"en": "chess news", "ru": "шахматных новостях"}), ("новост", {"en": "chess news", "ru": "шахматных новостях"}),
    ("puzzle", {"en": "puzzles", "ru": "задачах"}), ("задач", {"en": "puzzles", "ru": "задачах"}),
]


def _lang(lead) -> str:
    return "ru" if (lead["language"] or "") in {"ru", "uk", "uz"} else "en"


def _topic(lead, lang) -> str:
    text = f"{lead['name'] or ''} {lead['description'] or ''}".lower()
    for needle, words in TOPIC_HINTS:
        if needle in text:
            return words[lang]
    return TOPICS[lang]


def draft(lead, kind: str = "initial") -> dict:
    """Return {'lang', 'text', 'link', 'channel'} for a lead row (sqlite3.Row or dict)."""
    lang = _lang(lead)
    link = partner_link(lead["campaign"])
    fields = {"name": lead["name"] or lead["handle"], "link": link, "rules": RULES, "topic": _topic(lead, lang)}
    if kind == "initial":
        template = OFFERS.get(lead["segment"], OFFERS["telegram_chess_channel"])[lang]
    else:
        template = FOLLOWUPS[1 if kind == "followup_1" else 2][lang]
    route = lead["contact_route"] or ""
    channel = route.split()[0] if route else "find admin in channel/about page"
    return {"lang": lang, "text": template.format(**fields), "link": link, "channel": channel}
