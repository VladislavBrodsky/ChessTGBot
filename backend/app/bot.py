import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.crud import user as user_crud

settings = get_settings()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handle the /start command.
    """
    user = update.effective_user
    logger.info(f"User {user.id} ({user.username}) started the bot.")
    
    # Create/Get User in DB
    async with AsyncSessionLocal() as session:
        db_user = await user_crud.get_user_by_telegram_id(session, user.id)
        if not db_user:
            await user_crud.create_user(
                session, 
                telegram_id=user.id, 
                first_name=user.first_name, 
                username=user.username,
                photo_url=None # telegram bot api doesn't give photo url easily in message
            )
            logger.info(f"Created new user {user.id} in DB")

    # URL for the Mini App
    web_app = WebAppInfo(url="https://google.com") # Placeholder for now, or use an env var
    
    keyboard = [
        [InlineKeyboardButton("Play Chess ♟️", web_app=web_app)]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=(
            f"Hello {user.first_name}! 👋\n\n"
            "Welcome to the Chess Game.\n"
            "Click the button below to start playing!"
        ),
        reply_markup=reply_markup
    )

async def stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handle the /stats command.
    """
    user = update.effective_user
    
    async with AsyncSessionLocal() as session:
        db_user = await user_crud.get_user_by_telegram_id(session, user.id)
        if db_user:
            text = (
                f"📊 **Stats for {db_user.first_name}**\n\n"
                f"🏆 ELO: {db_user.elo}\n"
                f"✅ Wins: {db_user.wins}\n"
                f"❌ Losses: {db_user.losses}\n"
                f"🤝 Draws: {db_user.draws}\n"
                f"🎮 Games Played: {db_user.games_played}"
            )
        else:
            text = "You haven't played any games yet! Use /start to register."

    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=text,
        parse_mode='Markdown'
    )

def create_bot():
    """
    Create and configure the bot application.
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN is not set in environment settings")

    application = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()
    
    start_handler = CommandHandler('start', start)
    stats_handler = CommandHandler('stats', stats)
    
    application.add_handler(start_handler)
    application.add_handler(stats_handler)
    
    return application
