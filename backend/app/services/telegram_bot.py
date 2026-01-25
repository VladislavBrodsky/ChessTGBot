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
            "Welcome to Chess Game! ♟️🚀\n\nClick below to start playing in our Mini App.",
            reply_markup=reply_markup
        )

    @classmethod
    async def start_bot(cls):
        """Start the bot application with conflict prevention."""
        if not settings.TELEGRAM_BOT_TOKEN:
            logger.warning("TELEGRAM_BOT_TOKEN not set. Bot will not start.")
            return

        import asyncio
        from telegram.error import Conflict

        # Prevent multiple instances
        if cls.application:
            logger.warning("Bot already initialized. Skipping duplicate start.")
            return

        cls.application = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()
        cls.application.add_handler(CommandHandler("start", cls.start_command))
        
        await cls.application.initialize()
        await cls.application.start()
        
        # CRITICAL: Delete any existing webhooks before polling
        # This prevents conflicts with previous deployments
        try:
            await cls.application.bot.delete_webhook(drop_pending_updates=True)
            logger.info("Cleared any existing webhooks")
        except Exception as e:
            logger.warning(f"Could not clear webhooks: {e}")
        
        # Robust Polling Start (Handle Conflict from rolling updates)
        max_retries = 3
        retry_delay = 5 # seconds
        for attempt in range(max_retries):
            try:
                await cls.application.updater.start_polling(drop_pending_updates=True)
                logger.info("✅ Telegram Bot Started Successfully with Polling")
                return
            except Conflict:
                logger.warning(f"⚠️ Bot Conflict (Attempt {attempt+1}/{max_retries}). Previous instance still active. Retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
            except Exception as e:
                logger.error(f"❌ Unexpected error starting bot: {e}")
                break
        
        logger.error("❌ Failed to start Telegram Bot after retries. App continues without bot.")

    @classmethod
    async def stop_bot(cls):
        """Stop the bot application."""
        if cls.application:
            await cls.application.updater.stop()
            await cls.application.stop()
            await cls.application.shutdown()
            logger.info("Telegram Bot Stopped")

    @classmethod
    async def create_invite_link(cls, game_id: str) -> str:
        """
        Generates a direct StartApp link for the Telegram Mini App.
        Format: https://t.me/YourBotName/appname?startapp=game_id
        """
        # Note: We attempt to get the bot username if the app is initialized.
        bot_username = "YourBotName"
        try:
            if cls.application:
                # We need to access the bot object. 
                # Ideally, we should cache the username at startup.
                me = await cls.application.bot.get_me()
                bot_username = me.username
        except Exception as e:
            logger.warning(f"Could not fetch bot username: {e}")

        return f"https://t.me/share/url?url=https://t.me/{bot_username}/chess?startapp={game_id}"
