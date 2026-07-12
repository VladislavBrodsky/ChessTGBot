import asyncio
import logging
import random
from datetime import datetime, timezone
from sqlalchemy import select
from app.core.config import get_settings
from app.models.user import User
from app.services.telegram_bot import TelegramService
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

settings = get_settings()
logger = logging.getLogger(__name__)

# Schedule: Monday (0), Wednesday (2), Friday (4)
SCHEDULED_DAYS = {0, 2, 4}
SCHEDULED_HOUR = 15
SCHEDULED_MINUTE = 0

# To prevent sending multiple times a day
_last_sent_date = None

VIRAL_MESSAGES = {
    "en": [
        "🔥 <b>Got 5 minutes?</b>\n\nJump into the Battle Arena for a rapid-fire match! Connect instantly with opponents, win USDT, and climb the ranks. ♟️⚡\n\nHit the button below to auto-match now!",
        "🕒 <b>Fast 10-Minute Chess is LIVE!</b>\n\nDon't have time for a long game? Our auto-matching puts you straight into the action. Play fast, win big, and earn XP! 🏆💰\n\nJoin the Arena and find your opponent in seconds.",
        "⚡ <b>Ready for a quick challenge?</b>\n\nThousands of players are waiting in the Battle Arena for 5 and 10 minute blitz games. Prove your skills and earn real crypto rewards! ♟️💸\n\nTap below to start auto-matching!"
    ],
    "ru": [
        "🔥 <b>Есть 5 минут?</b>\n\nЗаходи на Боевую Арену для быстрой игры! Моментальный автоподбор соперников, выигрывай USDT и поднимайся в рейтинге. ♟️⚡\n\nЖми кнопку ниже, чтобы начать!",
        "🕒 <b>Быстрые шахматы по 10 минут ЖДУТ!</b>\n\nНет времени на долгую партию? Наш автоподбор мгновенно найдет тебе соперника. Играй быстро, побеждай и зарабатывай XP! 🏆💰\n\nЗаходи на Арену прямо сейчас.",
        "⚡ <b>Готов к быстрому вызову?</b>\n\nИгроки уже ждут на Боевой Арене для блиц-партий по 5 и 10 минут. Покажи свой скилл и заработай реальную крипту! ♟️💸\n\nЖми ниже для автоподбора!"
    ],
    "es": [
        "🔥 <b>¿Tienes 5 minutos?</b>\n\n¡Únete a la Battle Arena para una partida rápida! Conecta instantáneamente con oponentes, gana USDT y sube de rango. ♟️⚡\n\n¡Presiona el botón abajo para buscar oponente ahora!",
        "🕒 <b>¡El Ajedrez Rápido de 10 Minutos está EN VIVO!</b>\n\n¿No tienes tiempo para una partida larga? Nuestro emparejamiento automático te lleva directo a la acción. ¡Juega rápido, gana en grande y obtén XP! 🏆💰\n\nÚnete a la Arena y encuentra oponente en segundos.",
        "⚡ <b>¿Listo para un desafío rápido?</b>\n\nMiles de jugadores te esperan en la Battle Arena para partidas blitz de 5 y 10 minutos. ¡Demuestra tus habilidades y gana recompensas cripto! ♟️💸\n\nToca abajo para empezar el emparejamiento automático."
    ]
}

def _get_lang_messages(lang: str) -> list[str]:
    # Fallback to English if language not specifically translated here
    return VIRAL_MESSAGES.get(lang, VIRAL_MESSAGES["en"])

async def broadcast_marketing_messages():
    from app.core.database import AsyncSessionLocal
    
    # Pick a random variation index to send to everyone (consistency across languages)
    variation_index = random.randint(0, 2)
    
    sent_count = 0
    chunk_size = 500
    offset = 0
    
    while True:
        async with AsyncSessionLocal() as db:
            # Fetch users in batches to prevent Out-Of-Memory (OOM) errors at scale
            res = await db.execute(
                select(User.telegram_id, User.preferred_language)
                .where(User.telegram_id.isnot(None))
                .order_by(User.id)
                .offset(offset)
                .limit(chunk_size)
            )
            users = res.all()
            
        if not users:
            break
            
        for tid, lang in users:
            if not tid or tid <= 0:
                continue
                
            lang = lang or "en"
            msgs = _get_lang_messages(lang)
            msg_text = msgs[variation_index]
            
            # Build the WebApp URL with deep link to arena
            web_app_url = f"{settings.WEBAPP_URL}?lang={lang}&startapp=arena"
            keyboard = [
                [InlineKeyboardButton("♟️ Join Battle Arena", web_app=WebAppInfo(url=web_app_url))]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            try:
                await TelegramService.send_notification(
                    user_id=tid,
                    message=msg_text,
                    reply_markup=reply_markup
                )
                sent_count += 1
                await asyncio.sleep(0.05) # Rate limit protection (20 msgs/sec max)
            except Exception:
                # Silent catch for users who blocked the bot or deleted accounts
                pass
                
        offset += chunk_size

    logger.info(f"Marketing broadcast sent to {sent_count} users (variation {variation_index}).")

async def start_marketing_loop():
    global _last_sent_date
    logger.info("Marketing scheduler loop started (Runs Mon/Wed/Fri at 15:00 UTC).")
    
    # Wait a bit after startup so we don't block other tasks
    await asyncio.sleep(45)
    
    while True:
        try:
            now = datetime.now(timezone.utc)
            current_day = now.weekday()
            current_hour = now.hour
            current_minute = now.minute
            current_date_str = now.strftime("%Y-%m-%d")
            
            # Check if it's the right day and time
            # Using current_minute >= SCHEDULED_MINUTE in case loop wakes up slightly late
            # but usually it's exact since we check every 60s. We just restrict it to the SCHEDULED_HOUR.
            if current_day in SCHEDULED_DAYS and current_hour == SCHEDULED_HOUR and current_minute >= SCHEDULED_MINUTE:
                # Make sure we only send once per day
                if _last_sent_date != current_date_str:
                    _last_sent_date = current_date_str
                    logger.info("Triggering scheduled marketing broadcast.")
                    await broadcast_marketing_messages()
                    
        except Exception as e:
            logger.error(f"Error in marketing scheduler loop: {e}")
            
        # Check every 60 seconds
        await asyncio.sleep(60)
