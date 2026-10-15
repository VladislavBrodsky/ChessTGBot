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
        "♟️ <b>The clock is part of the challenge.</b>\n\nChoose an available time control in the Arena and look for an opponent. Before your first move, check the match rules and stake.\n\nUSDT matches are 18+ where permitted. You can lose your stake.\n\nOpen the Arena to see the current options.",
        "♟️ <b>One game. One decision to improve.</b>\n\nAfter your next match, find the move that changed the position. What did your opponent threaten? Take that question into your next game.\n\nArena USDT matches are 18+ where permitted. You can lose your stake.\n\nChoose a match only after reading its rules.",
        "♟️ <b>Your next opponent has a plan.</b>\n\nCheck their threats before choosing yours. Explore the Arena's current time controls and matchmaking options; finding a match depends on available opponents.\n\nUSDT matches are 18+ where permitted. You can lose your stake.\n\nSee the current match options."
    ],
    "ru": [
        "♟️ <b>Часы — часть игры.</b>\n\nВыбери доступный контроль времени на Арене и начни поиск соперника. Перед первым ходом проверь правила матча и размер ставки.\n\nМатчи в USDT доступны с 18 лет там, где это разрешено. Ставку можно потерять.\n\nОткрой Арену и посмотри текущие варианты.",
        "♟️ <b>Одна партия. Одно решение для разбора.</b>\n\nПосле следующего матча найди ход, который изменил позицию. Чем угрожал соперник? Возьми этот вопрос в следующую партию.\n\nМатчи Арены в USDT доступны с 18 лет там, где это разрешено. Ставку можно потерять.\n\nПеред выбором матча прочитай его правила.",
        "♟️ <b>У следующего соперника есть план.</b>\n\nПроверь его угрозы, прежде чем выбирать свой ход. Посмотри доступные контроли времени и варианты поиска на Арене; время ожидания зависит от наличия соперников.\n\nМатчи в USDT доступны с 18 лет там, где это разрешено. Ставку можно потерять.\n\nПосмотри текущие варианты матчей."
    ],
    "es": [
        "♟️ <b>El reloj también forma parte del reto.</b>\n\nElige un control de tiempo disponible en la Arena y busca un rival. Antes de mover, revisa las reglas y la apuesta del encuentro.\n\nLos encuentros con USDT son para mayores de 18 años donde estén permitidos. Puedes perder tu apuesta.\n\nAbre la Arena para ver las opciones actuales.",
        "♟️ <b>Una partida. Una decisión para mejorar.</b>\n\nDespués de tu próximo encuentro, encuentra la jugada que cambió la posición. ¿Qué amenazaba tu rival? Lleva esa pregunta a la siguiente partida.\n\nLos encuentros de la Arena con USDT son para mayores de 18 años donde estén permitidos. Puedes perder tu apuesta.\n\nLee las reglas antes de elegir un encuentro.",
        "♟️ <b>Tu próximo rival tiene un plan.</b>\n\nRevisa sus amenazas antes de elegir tu jugada. Explora los controles de tiempo y las opciones de búsqueda actuales de la Arena; encontrar un encuentro depende de los rivales disponibles.\n\nLos encuentros con USDT son para mayores de 18 años donde estén permitidos. Puedes perder tu apuesta.\n\nConsulta las opciones actuales."
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
                .where(User.telegram_id.isnot(None), User.is_blocked.is_(False), User.arena_notifications.is_(True))
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
            web_app_url = f"{settings.WEBAPP_URL}/{lang}/home?startapp=arena"
            keyboard = [
                [InlineKeyboardButton("♟️ Join Battle Arena", web_app=WebAppInfo(url=web_app_url))]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            try:
                from app.services.player_tracking import reserve_delivery
                async with AsyncSessionLocal() as receipt_db:
                    if not await reserve_delivery(receipt_db, f"marketing:{datetime.now(timezone.utc).date().isoformat()}", tid):
                        continue
                await TelegramService.send_notification(
                    telegram_id=tid,
                    text=msg_text,
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
