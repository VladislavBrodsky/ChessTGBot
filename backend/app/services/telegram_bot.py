from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, Application
from app.core.config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

class TelegramService:
    application: Application = None

    @staticmethod
    async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle the /start command."""
        # Check if deep-linked arguments exist (e.g. /start game_123)
        args = context.args
        start_param = args[0] if args else None
        
        # Railway URL (Replace with dynamic URL if needed or use from settings)
        # We use the properly configured environment variable now.
        web_app_url = settings.WEBAPP_URL

        if start_param:
             web_app_url += f"?startapp={start_param}"

        keyboard = [
            [InlineKeyboardButton("Play Chess ♟️", web_app={ "url": web_app_url })]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            "Welcome to Antigravity Chess! ♟️🚀\n\nClick below to start playing in our Mini App.",
            reply_markup=reply_markup
        )

    @classmethod
    async def start_bot(cls):
        """Start the bot application."""
        if not settings.TELEGRAM_BOT_TOKEN:
            logger.warning("TELEGRAM_BOT_TOKEN not set. Bot will not start.")
            return

        cls.application = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()
        cls.application.add_handler(CommandHandler("start", cls.start_command))
        
        await cls.application.initialize()
        await cls.application.start()
        await cls.application.updater.start_polling()
        logger.info("Telegram Bot Started with Polling")

    @classmethod
    async def stop_bot(cls):
        """Stop the bot application."""
        if cls.application:
            await cls.application.updater.stop()
            await cls.application.stop()
            await cls.application.shutdown()
            logger.info("Telegram Bot Stopped")

    @staticmethod
    async def create_invite_link(game_id: str) -> str:
        """
        Generates a direct StartApp link for the Telegram Mini App.
        Format: https://t.me/YourBotName/appname?startapp=game_id
        """
        # Note: We return a generic deep link structure.
        # Ideally we fetch the bot username once.
        # But this method is static, so we do a best effort or rely on client side composition.
        return f"https://t.me/share/url?url=https://t.me/YourBotName/chess?startapp={game_id}"
