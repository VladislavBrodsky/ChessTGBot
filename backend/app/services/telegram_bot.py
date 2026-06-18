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
            "sync": "You are now connected to the FinChess arena!",
            "features_header": "🤖 <b>What you can do:</b>",
            "f1": "• <b>Real-Time Matches:</b> Play chess and wager USDT with no hidden fees.",
            "f2": "• <b>Earn from Referrals:</b> Invite friends and get passive USDT commissions from their wagers + XP.",
            "f3": "• <b>Tactics Academy:</b> Solve 100 levels of chess puzzles to level up.",
            "f4": "• <b>Easy Deposits & Withdrawals:</b> Cash out your winnings instantly to any TON wallet.",
            "cta": "👇 Click the button below to launch the game and make your first move!",
            "btn": "♟️ Start Playing ♟️",
        },
        "ru": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "Добро пожаловать, <b>{name}!</b>",
            "sync": "Вы успешно подключили свой аккаунт к FinChess.",
            "features_header": "🤖 <b>Что здесь можно делать:</b>",
            "f1": "• <b>Игры на USDT:</b> Играйте в шахматы со ставками в USDT в реальном времени без лишних комиссий.",
            "f2": "• <b>Партнерская программа:</b> Приглашайте друзей и получайте процент от их ставок в USDT + очки опыта (XP).",
            "f3": "• <b>Школа тактики:</b> Решайте задачи из 100 уровней сложности и прокачивайте свой уровень.",
            "f4": "• <b>Быстрый вывод:</b> Пополняйте баланс и мгновенно выводите выигрыши на любой TON-кошелек.",
            "cta": "👇 Нажмите кнопку ниже, чтобы запустить игру и сделать первый ход!",
            "btn": "♟️ Начать игру ♟️",
        },
        "de": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "Willkommen, <b>{name}!</b>",
            "sync": "Du bist jetzt mit der FinChess-Arena verbunden!",
            "features_header": "🤖 <b>Deine Möglichkeiten:</b>",
            "f1": "• <b>USDT-Duelle:</b> Spiele Schach und setze USDT in Echtzeit-Matches ein – ohne versteckte Gebühren.",
            "f2": "• <b>Freunde einladen & verdienen:</b> Erhalte passive USDT-Provisionen von den Spielen deiner Freunde + XP.",
            "f3": "• <b>Taktik-Akademie:</b> Löse 100 Level voller Schachrätsel, um dein Level zu steigern.",
            "f4": "• <b>Web3-Auszahlungen:</b> Lade dein Guthaben auf und hebe Gewinne blitzschnell auf dein TON-Wallet ab.",
            "cta": "👇 Klicke auf den Button unten, um das Spiel zu starten und deinen ersten Zug zu machen!",
            "btn": "♟️ Jetzt spielen ♟️",
        },
        "es": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "¡Bienvenido, <b>{name}!</b>",
            "sync": "¡Ya estás conectado a la arena de FinChess!",
            "features_header": "🤖 <b>¿Qué puedes hacer?</b>",
            "f1": "• <b>Partidas con USDT:</b> Juega al ajedrez y apuesta USDT en tiempo real sin comisiones ocultas.",
            "f2": "• <b>Gana por referidos:</b> Invita amigos y obtén comisiones pasivas en USDT de sus partidas + XP.",
            "f3": "• <b>Academia de Tácticas:</b> Resuelve 100 niveles de problemas de ajedrez para subir de nivel.",
            "f4": "• <b>Retiros Rápidos:</b> Deposita y retira tus ganancias al instante a cualquier billetera TON.",
            "cta": "👇 ¡Haz clic abajo para abrir el juego y hacer tu primer movimiento!",
            "btn": "♟️ Empezar a Jugar ♟️",
        },
        "fr": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "Bienvenue, <b>{name}!</b>",
            "sync": "Vous êtes maintenant connecté à l'arène FinChess !",
            "features_header": "🤖 <b>Ce que vous pouvez faire :</b>",
            "f1": "• <b>Parties en USDT:</b> Jouez aux échecs et misez des USDT en temps réel sans frais cachés.",
            "f2": "• <b>Parrainage payant:</b> Invitez des amis et touchez des commissions passives en USDT sur leurs parties + des XP.",
            "f3": "• <b>Académie de Tactique:</b> Résolvez 100 niveaux de puzzles d'échecs pour monter en niveau.",
            "f4": "• <b>Retraits Rapides:</b> Déposez et retirez vos gains instantanément vers n'importe quel portefeuille TON.",
            "cta": "👇 Cliquez sur le bouton ci-dessous pour lancer le jeu et faire votre premier coup !",
            "btn": "♟️ Commencer à Jouer ♟️",
        },
        "ar": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "مرحباً، <b>{name}!</b>",
            "sync": "لقد اتصلت الآن بساحة FinChess للشطرنج!",
            "features_header": "🤖 <b>أبرز المزايا:</b>",
            "f1": "• <b>مباريات بـ USDT:</b> العب الشطرنج وراهن بالـ USDT في الوقت الفعلي بدون رسوم خفية.",
            "f2": "• <b>اربح من الإحالات:</b> ادعُ أصدقاءك واحصل على عمولات USDT سلبية من مبارياتهم + نقاط خبرة (XP).",
            "f3": "• <b>أكاديمية التكتيك:</b> حل 100 مستوى من ألغاز الشطرنج لرفع مستواك.",
            "f4": "• <b>سحب وإيداع سريع:</b> اسحب أرباحك فوراً إلى أي محفظة TON.",
            "cta": "👇 اضغط على الزر أدناه لتشغيل اللعبة وابدأ اللعب!",
            "btn": "♟️ ابدأ اللعب ♟️",
        },
        "hi": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "स्वागत है, <b>{name}!</b>",
            "sync": "अब आप FinChess शतरंज एरिना से जुड़ चुके हैं!",
            "features_header": "🤖 <b>आपके लिए खास:</b>",
            "f1": "• <b>USDT मैच:</b> बिना किसी छुपे शुल्क के रियल-टाइम मैचों में खेलें और USDT की बाजी लगाएं।",
            "f2": "• <b>रेफरल से कमाई:</b> दोस्तों को आमंत्रित करें और उनके मैचों से पैसिव USDT कमीशन + XP अर्जित करें।",
            "f3": "• <b>टैक्टिक्स एकेडमी:</b> अपना लेवल बढ़ाने के लिए शतरंज पहेलियों के 100 लेवल हल करें।",
            "f4": "• <b>त्वरित निकासी:</b> अपने किसी भी TON वॉलेट में तुरंत जमा करें और जीत की राशि निकालें।",
            "cta": "👇 गेम शुरू करने और अपनी पहली चाल चलने के लिए नीचे दिए गए बटन पर क्लिक करें!",
            "btn": "♟️ खेलना शुरू करें ♟️",
        },
        "pt": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "Bem-vindo, <b>{name}!</b>",
            "sync": "Você agora está conectado à arena do FinChess!",
            "features_header": "🤖 <b>O que você pode fazer:</b>",
            "f1": "• <b>Partidas com USDT:</b> Jogue xadrez e aposte USDT em tempo real sem taxas ocultas.",
            "f2": "• <b>Ganhe com indicações:</b> Convide amigos e receba comissões passivas em USDT sobre as partidas deles + XP.",
            "f3": "• <b>Academia de Tática:</b> Resolva 100 níveis de quebra-cabeças de xadrez para evoluir seu nível.",
            "f4": "• <b>Saques Rápidos:</b> Deposite e retire seus ganhos instantaneamente para qualquer carteira TON.",
            "cta": "👇 Clique no botão abaixo para abrir o jogo e fazer sua jogada!",
            "btn": "♟️ Começar a Jogar ♟️",
        },
        "ja": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "<b>{name}</b> さん、ようこそ！",
            "sync": "FinChessアリーナへの接続が完了しました！",
            "features_header": "🤖 <b>主なプレイ内容:</b>",
            "f1": "• <b>USDT対局:</b> 隠れた手数料なしで、リアルタイムでUSDTを賭けてチェスをプレイ。",
            "f2": "• <b>紹介プログラム:</b> 友達を招待して、対局時のUSDTパッシブ報酬とXPを獲得。",
            "f3": "• <b>タクティクス・アカデミー:</b> 100レベルのチェス盤パズルを解いてレベルアップ。",
            "f4": "• <b>スピード入出金:</b> 獲得したUSDTをTONウォレットへ即時に入出金可能。",
            "cta": "👇 下のボタンをタップしてゲームを起動し、最初の指し手を決めましょう！",
            "btn": "♟️ プレイを開始する ♟️",
        },
        "zh": {
            "title": "⚡ <b>FINCHESS ARENA v1.5</b>",
            "greeting": "欢迎你，<b>{name}！</b>",
            "sync": "你已成功进入 FinChess 棋局世界！",
            "features_header": "🤖 <b>核心玩法：</b>",
            "f1": "• <b>USDT 对局：</b> 参与实时棋局，押注 USDT 竞技，无隐形成本。",
            "f2": "• <b>推荐赚佣：</b> 邀请好友加入，从他们的对局中抽取 USDT 被动分红，同时获得 XP 经验。",
            "f3": "• <b>战术学院：</b> 攻克 100 个棋局谜题，提升您的棋力等级。",
            "f4": "• <b>极速存取：</b> 支持随时充值及将收益秒提至您的 TON 钱包。",
            "cta": "👇 点击下方按钮启动游戏，开启您的第一步棋！",
            "btn": "♟️ 开始对局 ♟️",
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


