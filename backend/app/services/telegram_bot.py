from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, Application
from app.core.config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

class TelegramService:
    application: Application = None

    @staticmethod
    async def get_user_profile_photo(user_id: int, bot):
        """Get user profile photo URL."""
        try:
            photos = await bot.get_user_profile_photos(user_id, limit=1)
            if photos.total_count > 0:
                # Get the largest version of the first photo
                file = await bot.get_file(photos.photos[0][-1].file_id)
                return file.file_path
        except Exception:
            return None
        return None

    @staticmethod
    async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle the /start command."""
        user = update.effective_user
        if not user:
            return
            
        # Check if deep-linked arguments exist (e.g. /start game_123)
        args = context.args
        start_param = args[0] if args else None
        
        # Determine language preferences if user exists in DB
        from app.models.user import User
        from sqlalchemy import select
        from app.core.database import AsyncSessionLocal

        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(User).where(User.telegram_id == user.id))
                db_user = result.scalars().first()
                
                if not db_user:
                    # Basic creation logic
                    db_user = User(
                        telegram_id=user.id,
                        first_name=user.first_name,
                        last_name=user.last_name, 
                        username=user.username,
                        photo_url=await TelegramService.get_user_profile_photo(user.id, context.bot)
                    )
                    db.add(db_user)
                    await db.commit()

                lang = db_user.preferred_language if db_user else 'en'
            
            # Railway URL
            web_app_url = f"{settings.WEBAPP_URL}?lang={lang}"

            if start_param:
                 web_app_url += f"&startapp={start_param}" # Append as standard param

            keyboard = [
                [InlineKeyboardButton("Play Chess ♟️", web_app={ "url": web_app_url })]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            # Personalize greeting
            name = user.first_name
            if user.last_name:
                name += f" {user.last_name}"

            await update.message.reply_text(
                f"Welcome {name}! ♟️🚀\n\nClick below to start playing in our Mini App.",
                reply_markup=reply_markup
            )
        except Exception as e:
            logger.error(f"Error in start command: {e}")
            await update.message.reply_text("An error occurred while starting the bot. Please try again later.")

    @staticmethod
    async def language_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /language command"""
        keyboard = [
            [
                InlineKeyboardButton("🇺🇸 English", callback_data="lang_en"),
                InlineKeyboardButton("🇪🇸 Español", callback_data="lang_es")
            ],
            [
                InlineKeyboardButton("🇫🇷 Français", callback_data="lang_fr"),
                InlineKeyboardButton("🇩🇪 Deutsch", callback_data="lang_de")
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text("Choose your language:", reply_markup=reply_markup)

    @staticmethod
    async def language_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle language selection callback"""
        query = update.callback_query
        await query.answer()
        
        lang_code = query.data.split("_")[1] # lang_en -> en
        user_id = query.from_user.id
        
        from app.models.user import User
        from sqlalchemy import select
        from app.core.database import AsyncSessionLocal
        
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.telegram_id == user_id))
            db_user = result.scalars().first()
            if db_user:
                db_user.preferred_language = lang_code
                await db.commit()
                await query.edit_message_text(text=f"Language updated to {lang_code.upper()}! ✅")
            else:
                await query.edit_message_text(text="User not found. Please type /start first.")

    @classmethod
    async def start_bot(cls):
        """Start the bot application with conflict prevention."""
        if not settings.TELEGRAM_BOT_TOKEN:
            logger.warning("TELEGRAM_BOT_TOKEN not set. Bot will not start.")
            return
 
        import asyncio
        from telegram.error import Conflict
        from telegram.ext import CallbackQueryHandler
 
        # Prevent multiple instances
        if cls.application:
            logger.warning("Bot already initialized. Skipping duplicate start.")
            return
 
        cls.application = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()
        cls.application.add_handler(CommandHandler("start", cls.start_command))
        cls.application.add_handler(CommandHandler("language", cls.language_command))
        cls.application.add_handler(CallbackQueryHandler(cls.language_callback, pattern="^lang_"))
        
        await cls.application.initialize()
        await cls.application.start()
        
        # Decision: Polling vs Webhook
        # If we are on a deployed environment (inferred), use Webhooks to avoid Conflict errors from multiple replicas.
        use_webhook = settings.WEBAPP_URL and "localhost" not in settings.WEBAPP_URL and "127.0.0.1" not in settings.WEBAPP_URL

        if use_webhook:
            webhook_url = f"{settings.WEBAPP_URL}/api/v1/webhook/telegram"
            logger.info(f"Attempting to set webhook to: {webhook_url}")
            try:
                # drop_pending_updates=True helps clear the queue if the bot was down/conflicted
                await cls.application.bot.set_webhook(url=webhook_url, drop_pending_updates=True)
                logger.info(f"✅ Telegram Bot Started with Webhook")
                return
            except Exception as e:
                logger.error(f"Failed to set webhook: {e}. Falling back to polling.")
        
        # Fallback / Local Development: Robust Polling Start (Handle Conflict from rolling updates)
        # CRITICAL: Delete any existing webhooks before polling if we are forced to poll
        try:
            await cls.application.bot.delete_webhook(drop_pending_updates=True)
            logger.info("Cleared any existing webhooks for polling")
        except Exception as e:
            logger.warning(f"Could not clear webhooks: {e}")

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
        """Stop the bot application gracefully."""
        if cls.application:
            try:
                if cls.application.updater and cls.application.updater.running:
                    await cls.application.updater.stop()
                await cls.application.stop()
                await cls.application.shutdown()
                logger.info("✅ Telegram Bot Stopped")
            except Exception as e:
                logger.error(f"Error stopping bot: {e}")
            finally:
                cls.application = None

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
