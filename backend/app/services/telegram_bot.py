import asyncio
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

    # Multilingual welcome messages for the /start command
    WELCOME_MESSAGES = {
        "en": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "Welcome, <b>{name}!</b>",
            "sync": "You have successfully synchronized with the decentralized chess matrix.",
            "features_header": "🤖 <b>Core Features:</b>",
            "f1": "• <b>Play-to-Earn:</b> Wager USDT in gasless real-time matches.",
            "f2": "• <b>Dual-Reward Referrals:</b> Invite recruits to earn USDT passive revenue commissions from their games + XP points",
            "f3": "• <b>Tactics Academy:</b> Solve a 100-level puzzle grid to level up.",
            "f4": "• <b>Web3 Integration:</b> Instant deposits and withdrawals to your TON Wallet.",
            "cta": "👇 Click the button below to initialize the dashboard and start playing!",
            "btn": "♟️ Enter Chess Arena ♟️",
        },
        "ru": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "Добро пожаловать, <b>{name}!</b>",
            "sync": "Вы успешно синхронизировались с децентрализованной шахматной матрицей.",
            "features_header": "🤖 <b>Основные возможности:</b>",
            "f1": "• <b>Play-to-Earn:</b> Делайте ставки USDT в матчах в реальном времени без комиссий.",
            "f2": "• <b>Реферальная программа:</b> Приглашайте игроков и получайте пассивные комиссии USDT + очки XP.",
            "f3": "• <b>Академия тактики:</b> Решайте 100-уровневую сетку задач для повышения уровня.",
            "f4": "• <b>Web3-интеграция:</b> Мгновенные депозиты и выводы на ваш TON-кошелёк.",
            "cta": "👇 Нажмите кнопку ниже, чтобы открыть панель управления и начать игру!",
            "btn": "♟️ Войти в Арену ♟️",
        },
        "de": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "Willkommen, <b>{name}!</b>",
            "sync": "Du hast dich erfolgreich mit der dezentralen Schachmatrix synchronisiert.",
            "features_header": "🤖 <b>Kernfunktionen:</b>",
            "f1": "• <b>Play-to-Earn:</b> Setze USDT in Echtzeit-Matches ohne Gasgebühren.",
            "f2": "• <b>Dual-Reward-Empfehlungen:</b> Lade Freunde ein und verdiene USDT-Provisionen + XP-Punkte.",
            "f3": "• <b>Taktik-Akademie:</b> Löse ein 100-Level-Rätselgitter zum Aufsteigen.",
            "f4": "• <b>Web3-Integration:</b> Sofortige Ein- und Auszahlungen auf dein TON-Wallet.",
            "cta": "👇 Klicke unten, um das Dashboard zu starten und zu spielen!",
            "btn": "♟️ Chess Arena betreten ♟️",
        },
        "es": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "Bienvenido, <b>{name}!</b>",
            "sync": "Te has sincronizado exitosamente con la matriz de ajedrez descentralizada.",
            "features_header": "🤖 <b>Características principales:</b>",
            "f1": "• <b>Play-to-Earn:</b> Apuesta USDT en partidas en tiempo real sin comisiones de gas.",
            "f2": "• <b>Referencias de doble recompensa:</b> Invita jugadores y gana comisiones USDT pasivas + puntos XP.",
            "f3": "• <b>Academia de tácticas:</b> Resuelve una cuadrícula de 100 niveles para subir de nivel.",
            "f4": "• <b>Integración Web3:</b> Depósitos y retiros instantáneos a tu billetera TON.",
            "cta": "👇 ¡Haz clic en el botón de abajo para iniciar el panel y comenzar a jugar!",
            "btn": "♟️ Entrar al Chess Arena ♟️",
        },
        "fr": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "Bienvenue, <b>{name}!</b>",
            "sync": "Vous vous êtes synchronisé avec succès avec la matrice d'échecs décentralisée.",
            "features_header": "🤖 <b>Fonctionnalités principales:</b>",
            "f1": "• <b>Play-to-Earn:</b> Misez des USDT dans des matchs en temps réel sans frais de gaz.",
            "f2": "• <b>Parrainages double récompense:</b> Invitez des joueurs et gagnez des commissions USDT passives + points XP.",
            "f3": "• <b>Académie de tactiques:</b> Résolvez une grille de 100 niveaux pour monter en grade.",
            "f4": "• <b>Intégration Web3:</b> Dépôts et retraits instantanés vers votre portefeuille TON.",
            "cta": "👇 Cliquez sur le bouton ci-dessous pour initialiser le tableau de bord et commencer!",
            "btn": "♟️ Entrer dans l'Arène ♟️",
        },
        "ar": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "مرحباً، <b>{name}!</b>",
            "sync": "لقد تزامنت بنجاح مع مصفوفة الشطرنج اللامركزية.",
            "features_header": "🤖 <b>المميزات الأساسية:</b>",
            "f1": "• <b>العب واربح:</b> راهن بـ USDT في مباريات فورية بدون رسوم غاز.",
            "f2": "• <b>إحالات مزدوجة المكافأة:</b> ادعُ لاعبين واكسب عمولات USDT السلبية + نقاط XP.",
            "f3": "• <b>أكاديمية التكتيكات:</b> حل شبكة من 100 مستوى للارتقاء.",
            "f4": "• <b>تكامل Web3:</b> إيداعات وسحوبات فورية إلى محفظة TON الخاصة بك.",
            "cta": "👇 انقر على الزر أدناه لفتح لوحة التحكم والبدء باللعب!",
            "btn": "♟️ ادخل الساحة ♟️",
        },
        "hi": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "स्वागत है, <b>{name}!</b>",
            "sync": "आप विकेंद्रीकृत शतरंज मैट्रिक्स के साथ सफलतापूर्वक सिंक हो गए हैं।",
            "features_header": "🤖 <b>मुख्य विशेषताएं:</b>",
            "f1": "• <b>Play-to-Earn:</b> गैस-मुक्त रियल-टाइम मैचों में USDT लगाएं।",
            "f2": "• <b>डबल-रिवॉर्ड रेफरल:</b> खिलाड़ियों को आमंत्रित करें और USDT कमीशन + XP अंक कमाएं।",
            "f3": "• <b>टैक्टिक्स अकादमी:</b> लेवल अप के लिए 100-स्तरीय पहेली ग्रिड हल करें।",
            "f4": "• <b>Web3 एकीकरण:</b> आपके TON वॉलेट में तुरंत जमा और निकासी।",
            "cta": "👇 डैशबोर्ड शुरू करने और खेलने के लिए नीचे बटन दबाएं!",
            "btn": "♟️ Chess Arena में प्रवेश करें ♟️",
        },
        "pt": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "Bem-vindo, <b>{name}!</b>",
            "sync": "Você sincronizou com sucesso com a matriz de xadrez descentralizada.",
            "features_header": "🤖 <b>Recursos principais:</b>",
            "f1": "• <b>Play-to-Earn:</b> Aposte USDT em partidas em tempo real sem taxas de gás.",
            "f2": "• <b>Referências de recompensa dupla:</b> Convide jogadores e ganhe comissões USDT passivas + pontos XP.",
            "f3": "• <b>Academia de Táticas:</b> Resolva uma grade de 100 níveis para subir de nível.",
            "f4": "• <b>Integração Web3:</b> Depósitos e saques instantâneos para sua carteira TON.",
            "cta": "👇 Clique no botão abaixo para inicializar o painel e começar a jogar!",
            "btn": "♟️ Entrar no Chess Arena ♟️",
        },
        "ja": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "ようこそ、<b>{name}!</b>",
            "sync": "分散型チェスマトリックスとの同期が完了しました。",
            "features_header": "🤖 <b>主な機能:</b>",
            "f1": "• <b>Play-to-Earn:</b> ガス代なしのリアルタイムマッチでUSDTを賭けましょう。",
            "f2": "• <b>ダブルリワード紹介:</b> プレイヤーを招待してUSDTのパッシブ報酬＋XPポイントを獲得。",
            "f3": "• <b>タクティクスアカデミー:</b> 100レベルのパズルグリッドを解いてレベルアップ。",
            "f4": "• <b>Web3統合:</b> TONウォレットへの即時入出金。",
            "cta": "👇 下のボタンをクリックしてダッシュボードを起動し、プレイを開始してください！",
            "btn": "♟️ Chess Arenaへ入場 ♟️",
        },
        "zh": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "欢迎, <b>{name}!</b>",
            "sync": "您已成功与去中心化国际象棋矩阵同步。",
            "features_header": "🤖 <b>核心功能:</b>",
            "f1": "• <b>边玩边赚:</b> 在无 Gas 费的实时对局中押注 USDT。",
            "f2": "• <b>双重奖励推荐:</b> 邀请玩家加入，赚取 USDT 被动佣金 + XP 积分。",
            "f3": "• <b>战术学院:</b> 解锁 100 级谜题格，提升等级。",
            "f4": "• <b>Web3 集成:</b> 即时存取款到您的 TON 钱包。",
            "cta": "👇 点击下方按钮初始化控制台并开始游戏！",
            "btn": "♟️ 进入象棋竞技场 ♟️",
        },
    }

    @staticmethod
    def _get_lang(telegram_lang_code: str | None) -> str:
        """Map Telegram language_code to a supported locale, fallback to 'en'."""
        supported = {"en", "ru", "de", "es", "fr", "ar", "hi", "pt", "ja", "zh"}
        if not telegram_lang_code:
            return "en"
        # Telegram codes can be 'ru', 'zh-hans', 'pt-br', etc.
        code = telegram_lang_code.lower().split("-")[0]
        return code if code in supported else "en"

    @staticmethod
    async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle the /start command with automatic language detection."""
        user = update.effective_user
        if not user:
            return

        # Deep-link params (e.g. /start game_123)
        args = context.args
        start_param = args[0] if args else None

        from app.models.user import User
        from sqlalchemy import select
        from app.core.database import AsyncSessionLocal

        try:
            # Detect language from Telegram profile, then DB preference, fallback to 'en'
            tg_lang = TelegramService._get_lang(user.language_code)

            async with AsyncSessionLocal() as db:
                result = await db.execute(select(User).where(User.telegram_id == user.id))
                db_user = result.scalars().first()

                if not db_user:
                    db_user = User(
                        telegram_id=user.id,
                        first_name=user.first_name,
                        last_name=user.last_name,
                        username=user.username,
                        preferred_language=tg_lang,
                        photo_url=await TelegramService.get_user_profile_photo(user.id, context.bot)
                    )
                    db.add(db_user)
                    await db.commit()
                else:
                    # If the user has no DB language set yet, save the Telegram one
                    if not db_user.preferred_language or db_user.preferred_language == "en":
                        db_user.preferred_language = tg_lang
                        await db.commit()

                lang = db_user.preferred_language or tg_lang

            # Build webapp URL with the resolved language
            web_app_url = f"{settings.WEBAPP_URL}?lang={lang}"
            if start_param:
                web_app_url += f"&startapp={start_param}"

            # Resolve localised strings (fallback to English)
            msgs = TelegramService.WELCOME_MESSAGES.get(lang, TelegramService.WELCOME_MESSAGES["en"])

            # Personalise name
            name = user.first_name
            if user.last_name:
                name += f" {user.last_name}"

            welcome_msg = (
                f"{msgs['title']}\n\n"
                f"{msgs['greeting'].format(name=name)}\n"
                f"{msgs['sync']}\n\n"
                f"{msgs['features_header']}\n"
                f"{msgs['f1']}\n"
                f"{msgs['f2']}\n"
                f"{msgs['f3']}\n"
                f"{msgs['f4']}\n\n"
                f"{msgs['cta']}"
            )

            # Inline button inside the message
            keyboard = [[InlineKeyboardButton(msgs["btn"], web_app=WebAppInfo(url=web_app_url))]]
            reply_markup = InlineKeyboardMarkup(keyboard)

            # Persistent blue menu button
            try:
                await context.bot.set_chat_menu_button(
                    chat_id=user.id,
                    menu_button=MenuButtonWebApp(text="♟️ Play-to-Earn", web_app=WebAppInfo(url=web_app_url))
                )
            except Exception as menu_error:
                logger.warning(f"Could not set menu button: {menu_error}")

            await update.message.reply_text(welcome_msg, reply_markup=reply_markup, parse_mode="HTML")

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

    PREMIUM_WELCOME_MESSAGES = {
        "en": {
            "title": "👑 <b>WELCOME TO CHESS PREMIUM!</b>",
            "body": "Thank you for upgrading! Your subscription is active until <b>{expires_at}</b>.\n\n"
                    "⭐ <b>Your Premium Privileges are now active:</b>\n"
                    "• ⚡ <b>2x Rewards & XP Boost:</b> Double earnings and multipliers on every victory!\n"
                    "• 🏆 <b>6-Level Referral Income:</b> Unlock passive referral commission splits down to 6 levels.\n"
                    "• 🧠 <b>Full Tactics Academy:</b> Play all 100 levels with unlimited AI analysis.\n"
                    "• 💎 <b>Exclusive 3D Skins:</b> Unlock premium 3D boards and animation packs.\n\n"
                    "<i>Go ahead and crush it in the Arena! ♟️🔥</i>"
        },
        "ru": {
            "title": "👑 <b>ДОБРО ПОЖАЛОВАТЬ В CHESS PREMIUM!</b>",
            "body": "Спасибо за подписку! Ваш статус Premium активен до <b>{expires_at}</b>.\n\n"
                    "⭐ <b>Ваши премиум-привилегии уже активны:</b>\n"
                    "• ⚡ <b>Удвоенные награды и XP:</b> Получайте в 2 раза больше наград и опыта за победы!\n"
                    "• 🏆 <b>6 уровней реферального дохода:</b> Зарабатывайте пассивную комиссию на 6 уровней вглубь.\n"
                    "• 🧠 <b>Полная Академия:</b> Доступ ко всем 100 уровням и разбор партий с ИИ.\n"
                    "• 💎 <b>Эксклюзивные 3D-темы:</b> Уникальные стили оформления доски и фигур.\n\n"
                    "<i>Покажите своё мастерство на Арене! ♟️🔥</i>"
        },
        "es": {
            "title": "👑 <b>¡BIENVENIDO A CHESS PREMIUM!</b>",
            "body": "¡Gracias por suscribirte! Tu membresía Premium está activa hasta el <b>{expires_at}</b>.\n\n"
                    "⭐ <b>Tus privilegios Premium ya están activos:</b>\n"
                    "• ⚡ <b>Doble recompensa y XP:</b> ¡Gana el doble en cada victoria!\n"
                    "• 🏆 <b>Comisiones de 6 niveles:</b> Desbloquea ingresos por referidos hasta 6 niveles.\n"
                    "• 🧠 <b>Academia completa:</b> Acceso a los 100 niveles y análisis ilimitado con IA.\n"
                    "• 💎 <b>Tableros 3D exclusivos:</b> Diseños premium y animaciones exclusivas.\n\n"
                    "<i>¡Demuestra tu nivel en la Arena! ♟️🔥</i>"
        },
        "fr": {
            "title": "👑 <b>BIENVENU DANS CHESS PREMIUM !</b>",
            "body": "Merci pour votre abonnement ! Votre statut Premium est actif jusqu'au <b>{expires_at}</b>.\n\n"
                    "⭐ <b>Vos privilèges Premium sont maintenant actifs :</b>\n"
                    "• ⚡ <b>Récompenses et XP doublés :</b> Gagnez le double à chaque victoire !\n"
                    "• 🏆 <b>Parrainage sur 6 niveaux :</b> Touchez des commissions passives jusqu'à 6 niveaux.\n"
                    "• 🧠 <b>Académie complète :</b> Accédez aux 100 niveaux et profitez de l'analyse IA.\n"
                    "• 💎 <b>Thèmes 3D exclusifs :</b> Personnalisez votre jeu avec des thèmes premiums.\n\n"
                    "<i>Brillez dans l'Arène dès maintenant ! ♟️🔥</i>"
        },
        "de": {
            "title": "👑 <b>WILLKOMMEN BEI CHESS PREMIUM!</b>",
            "body": "Vielen Dank für dein Upgrade! Dein Premium-Status ist aktiv bis <b>{expires_at}</b>.\n\n"
                    "⭐ <b>Deine Premium-Vorteile sind jetzt freigeschaltet:</b>\n"
                    "• ⚡ <b>2x Belohnungen & XP:</b> Doppelte Einnahmen bei jedem Sieg!\n"
                    "• 🏆 <b>6 Ebenen Referral-Einnahmen:</b> Schalte Provisionen bis zu 6 Ebenen tief frei.\n"
                    "• 🧠 <b>Volle Akademie:</b> Spiele alle 100 Levels mit unbegrenzter KI-Analyse.\n"
                    "• 💎 <b>Exklusive 3D-Designs:</b> Wunderschöne Spielfelder und Animationen.\n\n"
                    "<i>Zeige dein Können in der Arena! ♟️🔥</i>"
        },
        "pt": {
            "title": "👑 <b>BEM-VINDO AO CHESS PREMIUM!</b>",
            "body": "Obrigado por assinar! Sua assinatura Premium está ativa até <b>{expires_at}</b>.\n\n"
                    "⭐ <b>Seus privilégios Premium já estão ativos:</b>\n"
                    "• ⚡ <b>Dobre recompensas e XP:</b> Ganhe o dobro em todas as vitórias!\n"
                    "• 🏆 <b>Indicações de 6 níveis:</b> Receba comissões de convidados em até 6 níveis.\n"
                    "• 🧠 <b>Academia completa:</b> Jogue todos os 100 níveis e use a análise de IA.\n"
                    "• 💎 <b>Temas 3D exclusivos:</b> Tabuleiros premium e animações exclusivas.\n\n"
                    "<i>Domine a Arena agora mesmo! ♟️🔥</i>"
        },
        "zh": {
            "title": "👑 <b>欢迎加入 CHESS PREMIUM 黄金会员！</b>",
            "body": "感谢您的订阅！您的黄金会员有效期至 <b>{expires_at}</b>。\n\n"
                    "⭐ <b>您的专属特权已成功激活：</b>\n"
                    "• ⚡ <b>胜场双倍奖励与经验加成：</b> 每次获胜可获得双倍金币与额外经验！\n"
                    "• 🏆 <b>6级推广返佣收益：</b> 解锁高达6级的推广被动佣金收益。\n"
                    "• 🧠 <b>战术学院全解锁：</b> 畅玩全部100关并享有无限制AI棋局分析。\n"
                    "• 💎 <b>专属3D棋盘皮肤：</b> 拥有精美的3D棋盘皮肤与独特移动动画。\n\n"
                    "<i>快去棋局里大显身手吧！ ♟️🔥</i>"
        },
        "ja": {
            "title": "👑 <b>CHESS PREMIUM へようこそ！</b>",
            "body": "ご購読ありがとうございます！プレミアム会員資格は <b>{expires_at}</b> まで有効です。\n\n"
                    "⭐ <b>プレミアム特典がすべて有効化されました:</b>\n"
                    "• ⚡ <b>報酬＆XP 2倍：</b> すべての勝利で獲得できる報酬とXPが2倍に！\n"
                    "• 🏆 <b>最大6階層の紹介報酬：</b> 被紹介者の手数料から最大6段階の報酬を獲得。\n"
                    "• 🧠 <b>アカデミー全開放：</b> 100レベルすべてのプレイとAI棋譜解析が可能に。\n"
                    "• 💎 <b>限定3Dテーマ：</b> 豪華な3D盤面とチェス駒、特別アニメーション。\n\n"
                    "<i>アリーナでのご活躍を期待しています！ ♟️🔥</i>"
        },
        "ar": {
            "title": "👑 <b>مرحباً بك في CHESS PREMIUM!</b>",
            "body": "نشكرك على الترقية! اشتراكك المميز نشط حتى <b>{expires_at}</b>.\n\n"
                    "⭐ <b>مزاياك المميزة حصرية ونشطة الآن:</b>\n"
                    "• ⚡ <b>ضعف المكافآت ونقاط الخبرة:</b> أرباح مضاعفة ونقاط خبرة أعلى عند كل فوز!\n"
                    "• 🏆 <b>أرباح إحالات حتى 6 مستويات:</b> عمولات إحالة لشبكة أصدقائك حتى 6 مستويات.\n"
                    "• 🧠 <b>الأكاديمية كاملة:</b> العب جميع الألغاز الـ 100 مع تحليل غير محدود بالذكاء الاصطناعي.\n"
                    "• 💎 <b>تصميمات لوحة 3D حصرية:</b> رقعة شطرنج متميزة بتأثيرات ثلاثية الأبعاد وحركات فريدة.\n\n"
                    "<i>انطلق وحقق الانتصارات في الساحة! ♟️🔥</i>"
        },
        "hi": {
            "title": "👑 <b>चेस प्रीमियम (CHESS PREMIUM) में आपका स्वागत है!</b>",
            "body": "अपग्रेड करने के लिए धन्यवाद! आपकी प्रीमियम सदस्यता <b>{expires_at}</b> तक सक्रिय है।\n\n"
                    "⭐ <b>आपके प्रीमियम विशेषाधिकार अब सक्रिय हैं:</b>\n"
                    "• ⚡ <b>दोगुने इनाम और XP बूस्ट:</b> हर जीत पर दोगुने पुरस्कार और अनुभव प्राप्त करें!\n"
                    "• 🏆 <b>6-स्तरीय रेफ़रल कमाई:</b> 6 स्तरों तक रेफ़रल पैसिव इनकम कमिशन अनलॉक करें।\n"
                    "• 🧠 <b>पूरी टैक्टिक्स अकादमी:</b> असीमित AI विश्लेषण के साथ सभी 100 स्तर खेलें।\n"
                    "• 💎 <b>खास 3D थीम्स:</b> शानदार 3D बोर्ड और एनिमेशन अनलॉक करें।\n\n"
                    "<i>अखाड़े में उतरें और जीत दर्ज करें! ♟️🔥</i>"
        }
    }

    @classmethod
    async def send_premium_welcome(cls, user_id: int, first_name: str, expires_at, lang: str):
        """
        Send a gorgeous localized welcome notification to the user upon Premium subscription.
        """
        lang = cls._get_lang(lang)
        expires_str = expires_at.strftime("%Y-%m-%d") if expires_at else "Lifetime"
        
        tpl = cls.PREMIUM_WELCOME_MESSAGES.get(lang, cls.PREMIUM_WELCOME_MESSAGES["en"])
        text = f"{tpl['title']}\n\n{tpl['body'].format(expires_at=expires_str)}"
        await cls.send_notification(user_id, text)

    @classmethod
    async def send_notification(cls, telegram_id: int, text: str):
        """
        Send direct push notifications to a user via the Telegram Bot API.
        Non-blocking: dispatches the request to a background task so it returns instantly.
        """
        if not settings.TELEGRAM_BOT_TOKEN:
            logger.warning("Bot notification skipped: TELEGRAM_BOT_TOKEN not configured.")
            return

        async def _do_send():
            try:
                # If the application is already running, reuse its bot client.
                # Otherwise, instantiate a one-off bot client.
                bot = cls.application.bot if (cls.application and cls.application.bot) else None
                if not bot:
                    from telegram import Bot
                    bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)

                # Send message
                await bot.send_message(chat_id=telegram_id, text=text, parse_mode="HTML")
                logger.info(f"✉️ Telegram Notification successfully pushed to user {telegram_id}")
            except Exception as e:
                logger.error(f"❌ Failed to send Telegram bot notification to {telegram_id}: {e}")

        asyncio.create_task(_do_send())


