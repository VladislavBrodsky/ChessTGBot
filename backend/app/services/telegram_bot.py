from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup, MenuButtonWebApp
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, Application
from app.core.config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

class TelegramService:
    application: Application = None
    is_currently_leader = False
    receiver_active = False
    receiver_type = None
    election_task = None  # Background leader election asyncio.Task
    instance_id = None   # Unique ID for this process instance

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
                [InlineKeyboardButton("⚡ Enter Chess Arena ♟️", web_app=WebAppInfo(url=web_app_url))]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            # Update the persistent Menu Button for this user (or globally if needed, but per-chat is safer for language)
            # We set it to default Web App for now
            try:
                await context.bot.set_chat_menu_button(
                    chat_id=user.id,
                    menu_button=MenuButtonWebApp(text="♟️Enter Chess Arena♟️", web_app=WebAppInfo(url=web_app_url)) 
                )
            except Exception as menu_error:
                logger.warning(f"Could not set menu button: {menu_error}")

            # Personalize greeting
            name = user.first_name
            if user.last_name:
                name += f" {user.last_name}"

            welcome_msg = (
                f"⚡ <b>FINCHESS ARENA v1.5</b>\n\n"
                f"Welcome, <b>{name}!</b>\n"
                f"You have successfully synchronized with the decentralized chess matrix.\n\n"
                f"🤖 <b>Core Features:</b>\n"
                f"• <b>Play-to-Earn:</b> Wager USDT in gasless real-time matches.\n"
                f"• <b>Dual-Reward Referrals:</b> Invite recruits to earn USDT passive revenue commissions from their games + XP points\n"
                f"• <b>Tactics Academy:</b> Solve a 100-level puzzle grid to level up.\n"
                f"• <b>Web3 Integration:</b> Instant deposits and withdrawals to your TON Wallet.\n\n"
                f"👇 Click the button below to initialize the dashboard and start playing!"
            )
            await update.message.reply_text(
                welcome_msg,
                reply_markup=reply_markup,
                parse_mode="HTML"
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
    async def start_receiver(cls):
        """Start receiving updates via webhook or polling (Only Leader handles this)."""
        if not cls.application:
            return
        
        base_url = settings.BACKEND_URL or settings.WEBAPP_URL
        if base_url and not base_url.startswith("http://") and not base_url.startswith("https://"):
            base_url = f"https://{base_url}"
            
        use_webhook = base_url and "localhost" not in base_url and "127.0.0.1" not in base_url
        if use_webhook:
            webhook_url = f"{base_url}/api/v1/webhook/telegram"
            try:
                await cls.application.bot.set_webhook(url=webhook_url, drop_pending_updates=True)
                logger.info(f"👑 Bot Webhook Successfully Set: {webhook_url}")
                cls.receiver_active = True
                cls.receiver_type = "webhook"
                return
            except Exception as e:
                logger.error(f"Failed to set webhook: {e}. Falling back to polling.")

        # Polling fallback (Only Leader)
        try:
            await cls.application.bot.delete_webhook(drop_pending_updates=True)
            await cls.application.updater.start_polling(drop_pending_updates=True)
            logger.info("👑 Bot Polling Successfully Started")
            cls.receiver_active = True
            cls.receiver_type = "polling"
        except Exception as e:
            logger.error(f"Failed to start polling: {e}")

    @classmethod
    async def stop_receiver(cls):
        """Stop receiving updates (Node demoted to passive/sender mode)."""
        if not cls.application:
            return
        
        try:
            if cls.receiver_active:
                if cls.receiver_type == "polling" and cls.application.updater and cls.application.updater.running:
                    await cls.application.updater.stop()
                    logger.info("💤 Bot Polling Suspended (Demoted to Passive)")
                elif cls.receiver_type == "webhook":
                    await cls.application.bot.delete_webhook()
                    logger.info("💤 Bot Webhook Removed (Demoted to Passive)")
                cls.receiver_active = False
        except Exception as e:
            logger.error(f"Error stopping receiver: {e}")

    @classmethod
    async def start_bot(cls):
        """Start the bot application with dynamic conflict prevention using self-healing Redis leader election."""
        if not settings.TELEGRAM_BOT_TOKEN:
            logger.warning("TELEGRAM_BOT_TOKEN not set. Bot will not start.")
            return

        import asyncio
        from telegram.ext import CallbackQueryHandler

        # Prevent multiple instances in same process
        if cls.application:
            logger.warning("Bot already initialized. Skipping duplicate start.")
            return

        # 1. Initialize Bot (Sender Role - All Instances)
        try:
            cls.application = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()
            cls.application.add_handler(CommandHandler("start", cls.start_command))
            cls.application.add_handler(CommandHandler("language", cls.language_command))
            cls.application.add_handler(CallbackQueryHandler(cls.language_callback, pattern="^lang_"))
            
            await cls.application.initialize()
            await cls.application.start()
            logger.info("✅ Telegram Bot Initialized (Sender Mode Active)")
        except Exception as bot_err:
            logger.error(f"❌ Failed to initialize Telegram Bot: {bot_err}. Running web app without active Telegram listener.")
            cls.application = None
            return

        # 2. Self-Healing Background Leader Election Loop
        async def election_loop():
            import redis.asyncio as redis
            import os
            
            instance_id = f"bot_{settings.PROJECT_NAME}_{os.getpid()}_{asyncio.get_event_loop().time()}"
            cls.instance_id = instance_id
            lock_key = "telegram_bot_leader"
            
            while True:
                try:
                    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                    
                    # Try to acquire or extend leadership lease
                    # Lock holds for 20 seconds, we check/renew every 10 seconds.
                    acquired = await redis_client.set(lock_key, instance_id, nx=True, ex=20)
                    
                    if acquired:
                        if not cls.is_currently_leader:
                            logger.info(f"👑 [LEADER ELECTION] Acquired lock. Promoting instance {instance_id} to ACTIVE leader...")
                            cls.is_currently_leader = True
                            await cls.start_receiver()
                    else:
                        # Check if we already own it
                        current_owner = await redis_client.get(lock_key)
                        if current_owner == instance_id:
                            # Renew lease
                            await redis_client.expire(lock_key, 20)
                            if not cls.is_currently_leader:
                                cls.is_currently_leader = True
                                await cls.start_receiver()
                        else:
                            # Someone else is the leader
                            if cls.is_currently_leader:
                                logger.warning(f"⚠️ [LEADER ELECTION] Leadership lost to {current_owner}. Demoting to PASSIVE...")
                                cls.is_currently_leader = False
                                await cls.stop_receiver()
                            
                    await redis_client.close()
                except Exception as e:
                    logger.error(f"[LEADER ELECTION] Error in loop: {e}")
                    # Local fallback: if Redis connection fails and we are running in localhost/development,
                    # we should still allow the bot to run to make local testing easy.
                    if "localhost" in settings.WEBAPP_URL or "127.0.0.1" in settings.WEBAPP_URL:
                        if not cls.is_currently_leader:
                            logger.info("ℹ️ Local/Development environment detected. Bypassing Redis leader election and promoting to ACTIVE leader.")
                            cls.is_currently_leader = True
                            await cls.start_receiver()
                    else:
                        # In case of Redis outage in production, suspend receiver to avoid duplicate update polling conflicts
                        if cls.is_currently_leader:
                            cls.is_currently_leader = False
                            await cls.stop_receiver()
                
                await asyncio.sleep(10)

        cls.election_task = asyncio.create_task(election_loop())

    @classmethod
    async def stop_bot(cls):
        """Stop the bot application gracefully, releasing the Redis leader lock immediately."""
        # Cancel and await the election loop first so it doesn't race with lock deletion
        if cls.election_task and not cls.election_task.done():
            cls.election_task.cancel()
            try:
                await cls.election_task
            except Exception:
                pass
            cls.election_task = None

        # Release the Redis leader lock immediately so the new instance can take over
        # without waiting for the 20-second TTL to expire.
        if cls.is_currently_leader and cls.instance_id:
            try:
                import redis.asyncio as redis
                redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
                lock_key = "telegram_bot_leader"
                current_owner = await redis_client.get(lock_key)
                if current_owner == cls.instance_id:
                    await redis_client.delete(lock_key)
                    logger.info("🔓 [LEADER ELECTION] Released Redis lock on shutdown.")
                await redis_client.close()
            except Exception as e:
                logger.warning(f"Could not release Redis lock on shutdown: {e}")

        if cls.application:
            try:
                await cls.stop_receiver()
                await cls.application.stop()
                await cls.application.shutdown()
                logger.info("✅ Telegram Bot Fully Stopped")
            except Exception as e:
                logger.error(f"Error stopping bot: {e}")
            finally:
                cls.application = None
                cls.is_currently_leader = False
                cls.instance_id = None

    @classmethod
    async def create_invite_link(cls, game_id: str) -> str:
        """
        Generates a direct StartApp link for the Telegram Mini App.
        """
        bot_username = settings.TELEGRAM_BOT_USERNAME or "FinChess_bot"
        try:
            if cls.application:
                me = await cls.application.bot.get_me()
                bot_username = me.username
        except Exception as e:
            logger.warning(f"Could not fetch bot username: {e}")

        return f"https://t.me/{bot_username}/chess?startapp={game_id}"

    @classmethod
    async def send_notification(cls, telegram_id: int, text: str):
        """
        Send direct push notifications to a user via the Telegram Bot API.
        Does not crash if bot is not configured or token is empty.
        """
        if not settings.TELEGRAM_BOT_TOKEN:
            logger.warning("Bot notification skipped: TELEGRAM_BOT_TOKEN not configured.")
            return

        try:
            # If the application is already running, reuse its bot client.
            # Otherwise, instantiate a one-off bot client.
            bot = cls.application.bot if (cls.application and cls.application.bot) else None
            if not bot:
                from telegram import Bot
                bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)

            # Fire-and-forget notification
            await bot.send_message(chat_id=telegram_id, text=text, parse_mode="HTML")
            logger.info(f"✉️ Telegram Notification successfully pushed to user {telegram_id}")
        except Exception as e:
            logger.error(f"❌ Failed to send Telegram bot notification to {telegram_id}: {e}")


