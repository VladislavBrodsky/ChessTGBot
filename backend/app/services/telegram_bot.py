from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup, MenuButtonWebApp
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

            # Fix: Use WebAppInfo object instead of dict
            keyboard = [
                [InlineKeyboardButton("Play Chess ♟️", web_app=WebAppInfo(url=web_app_url))]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            # Update the persistent Menu Button for this user (or globally if needed, but per-chat is safer for language)
            # We set it to default Web App for now
            try:
                await context.bot.set_chat_menu_button(
                    chat_id=user.id,
                    menu_button=MenuButtonWebApp(text="Play Chess ♟️", web_app=WebAppInfo(url=web_app_url)) 
                )
            except Exception as menu_error:
                logger.warning(f"Could not set menu button: {menu_error}")

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
        """Start the bot application with conflict prevention using Redis leader election."""
        if not settings.TELEGRAM_BOT_TOKEN:
            logger.warning("TELEGRAM_BOT_TOKEN not set. Bot will not start.")
            return

        import asyncio
        import redis.asyncio as redis
        from telegram.error import Conflict
        from telegram.ext import CallbackQueryHandler

        # Prevent multiple instances in same process
        if cls.application:
            logger.warning("Bot already initialized. Skipping duplicate start.")
            return

        # 1. Initialize Bot (Sender Role - All Instances)
        cls.application = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()
        cls.application.add_handler(CommandHandler("start", cls.start_command))
        cls.application.add_handler(CommandHandler("language", cls.language_command))
        cls.application.add_handler(CallbackQueryHandler(cls.language_callback, pattern="^lang_"))
        
        await cls.application.initialize()
        await cls.application.start()
        logger.info("✅ Telegram Bot Initialized (Sender Mode)")

        # 2. Leader Election for Receiver Role (Polling/Webhook)
        # Only one instance should handle updates to avoid Conflict errors.
        try:
            redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            lock_key = "telegram_bot_leader"
            leader_id = f"instance_{settings.PROJECT_NAME}_{asyncio.get_event_loop().time()}" # Simple unique ID
            
            # Try to acquire leadership
            is_leader = await redis_client.set(lock_key, leader_id, nx=True, ex=30)
            
            if is_leader:
                logger.info("👑 Acquired Bot Leadership. Starting Receiver...")
                
                # Start Heartbeat in background
                async def heartbeat():
                    while True:
                        try:
                            # Refresh lock
                            await redis_client.expire(lock_key, 30)
                            await asyncio.sleep(10)
                        except asyncio.CancelledError:
                            # Release lock on shutdown
                            current_leader = await redis_client.get(lock_key)
                            if current_leader == leader_id:
                                await redis_client.delete(lock_key)
                            break
                        except Exception as e:
                            logger.error(f"Heartbeat error: {e}")
                            await asyncio.sleep(5)

                asyncio.create_task(heartbeat())
                
                # Verify environment
                use_webhook = settings.WEBAPP_URL and "localhost" not in settings.WEBAPP_URL and "127.0.0.1" not in settings.WEBAPP_URL
                
                if use_webhook:
                    webhook_url = f"{settings.WEBAPP_URL}/api/v1/webhook/telegram"
                    try:
                        await cls.application.bot.set_webhook(url=webhook_url, drop_pending_updates=True)
                        logger.info(f"✅ Webhook set to: {webhook_url}")
                        return
                    except Exception as e:
                        logger.error(f"Failed to set webhook: {e}. Falling back to polling.")

                # Polling Fallback (Only Leader)
                try:
                    await cls.application.bot.delete_webhook(drop_pending_updates=True)
                    # We use start_polling but we must be careful not to block strictly if we want the app to run?
                    # updater.start_polling() is non-blocking (asyncio) usually? 
                    # Wrapper around asyncio.create_task usually.
                    await cls.application.updater.start_polling(drop_pending_updates=True)
                    logger.info("✅ Bot Polling Started (Leader)")
                except Exception as e:
                    logger.error(f"Failed to start polling: {e}")
            else:
                logger.info("💤 Bot Leadership not acquired. Running in Passive Mode (Sender only).")

        except Exception as e:
            logger.error(f"Redis Leader Election Failed: {e}. Bot will not receive updates.")

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
        bot_username = "YourBotName"
        try:
            if cls.application:
                # We need to access the bot object. 
                me = await cls.application.bot.get_me()
                bot_username = me.username
        except Exception as e:
            logger.warning(f"Could not fetch bot username: {e}")

        return f"https://t.me/share/url?url=https://t.me/{bot_username}/chess?startapp={game_id}"

