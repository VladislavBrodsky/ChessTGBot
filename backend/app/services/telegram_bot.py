import asyncio
from telegram import Update, WebAppInfo, InlineKeyboardButton, InlineKeyboardMarkup, MenuButtonWebApp
from telegram.error import Forbidden
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, Application, ChatMemberHandler
from app.core.config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

# Bot HANDLER failures log here instead of __name__: the module logger
# ("app.services.telegram_bot") is deliberately excluded from admin alerts to
# prevent notification loops, which made handler crashes invisible (or worse,
# surfaced only as PTB's useless "No error handlers are registered" message).
# Alert-loop safety holds because failed alert sends still log under the
# excluded module logger.
bot_errors_logger = logging.getLogger("app.bot.errors")

class TelegramService:
    application: Application = None
    is_currently_leader = False
    receiver_active = False
    receiver_type = None
    election_task = None  # Background leader election asyncio.Task
    instance_id = None   # Unique ID for this process instance

    @staticmethod
    async def get_user_profile_photo(user_id: int, bot):
        """Get user profile photo and cache it locally, returning the relative proxy URL."""
        import os
        import httpx
        import logging
        logger = logging.getLogger(__name__)
        try:
            photos = await bot.get_user_profile_photos(user_id, limit=1)
            if photos.total_count > 0:
                # Ensure cache directory exists
                avatar_dir = "static_avatars"
                os.makedirs(avatar_dir, exist_ok=True)
                file_path = os.path.join(avatar_dir, f"{user_id}.jpg")
                
                # Get the largest version of the first photo
                file = await bot.get_file(photos.photos[0][-1].file_id)
                
                # Download and cache
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get(file.file_path)
                    if res.status_code == 200:
                        with open(file_path, "wb") as f:
                            f.write(res.content)
                        return f"/api/v1/users/avatar/{user_id}"
        except Exception as e:
            logger.error(f"Failed to fetch/cache profile photo for {user_id}: {e}")
        return None

    # XP needed to complete each level (200 XP per level, canonical formula)
    XP_PER_LEVEL = 200

    WELCOME_MESSAGES = {
        "en": {
            "greeting": "👑 <b>Welcome, {name}!</b>",
            "sync": "You are connected to the Arena.",
            "level_label": "LVL",
            "xp_label": "XP",
            "next_label": "next",
            "features_header": "🎮 <b>ARENA FEATURES:</b>",
            "f1": "♟️ <b>Play & Earn:</b> Wager USDT in live chess",
            "f2": "👥 <b>Invite & Earn:</b> Get up to 2% of wagers from friends",
            "f3": "🧩 <b>Academy:</b> 100 levels of chess puzzles",
            "f4": "⚡ <b>Instant:</b> Withdraw winnings to TON in seconds",
            "ref_header": "🔗 <b>Invite Link (tap to copy):</b>",
            "ref_qr": "📷 <b>Invite QR Code (scan in person):</b> <a href=\"{qr_link}\">Open QR Code</a>",
            "ref_hint": "Invite friends & earn USDT from their moves!",
            "cta": "👇 Tap below to start playing!",
            "btn": "♟️  Open FinChess Arena  ♟️",
        },
        "ru": {
            "greeting": "👑 <b>Добро пожаловать, {name}!</b>",
            "sync": "Вы на арене FinChess.",
            "level_label": "УР.",
            "xp_label": "XP",
            "next_label": "до след. ур.",
            "features_header": "🎮 <b>ВОЗМОЖНОСТИ АРЕНЫ:</b>",
            "f1": "♟️ <b>Игра на USDT:</b> Шахматные дуэли со ставками",
            "f2": "👥 <b>Рефералы:</b> Получайте до 2% от ставок друзей",
            "f3": "🧩 <b>Академия:</b> 100 уровней шахматных задач",
            "f4": "⚡ <b>Вывод:</b> Мгновенно на TON-кошелек",
            "ref_header": "🔗 <b>Ссылка для приглашения (нажмите для копирования):</b>",
            "ref_qr": "📷 <b>QR-код для приглашения (показать другу):</b> <a href=\"{qr_link}\">Открыть QR-код</a>",
            "ref_hint": "Приглашайте друзей и зарабатывайте с каждой их игры!",
            "cta": "👇 Нажмите кнопку ниже для начала игры!",
            "btn": "♟️  Открыть FinChess Arena  ♟️",
        },
        "de": {
            "greeting": "👑 <b>Willkommen, {name}!</b>",
            "sync": "Du bist in der Arena.",
            "level_label": "LVL",
            "xp_label": "XP",
            "next_label": "nächste Stufe",
            "features_header": "🎮 <b>ARENA-FEATURES:</b>",
            "f1": "♟️ <b>Spielen & Verdienen:</b> USDT in Live-Partien setzen",
            "f2": "👥 <b>Empfehlungen:</b> Erhalte bis zu 2% der Einsätze von Freunden",
            "f3": "🧩 <b>Akademie:</b> 100 Ebenen von Schachrätseln",
            "f4": "⚡ <b>Auszahlung:</b> Gewinne sofort auf TON auszahlen",
            "ref_header": "🔗 <b>Empfehlungslink (zum Kopieren tippen):</b>",
            "ref_qr": "📷 <b>Einladungs-QR-Code (persönlich scannen):</b> <a href=\"{qr_link}\">QR-Code öffnen</a>",
            "ref_hint": "Freunde einladen und an jedem ihrer Züge verdienen!",
            "cta": "👇 Tippe unten, um das Spiel zu starten!",
            "btn": "♟️  FinChess Arena öffnen  ♟️",
        },
        "es": {
            "greeting": "👑 <b>¡Bienvenido, {name}!</b>",
            "sync": "Estás conectado a la Arena.",
            "level_label": "NIV.",
            "xp_label": "XP",
            "next_label": "prox. nivel",
            "features_header": "🎮 <b>CARACTERÍSTICAS:</b>",
            "f1": "♟️ <b>Juega y Gana:</b> Apuesta USDT en partidas en vivo",
            "f2": "👥 <b>Referidos:</b> Gana hasta 2% de las apuestas de amigos",
            "f3": "🧩 <b>Academia:</b> 100 niveles de puzzles de ajedrez",
            "f4": "⚡ <b>Retiro:</b> Saldo a tu billetera TON al instante",
            "ref_header": "🔗 <b>Enlace de invitado (toca para copiar):</b>",
            "ref_qr": "📷 <b>Código QR de invitado (escanear en persona):</b> <a href=\"{qr_link}\">Abrir código QR</a>",
            "ref_hint": "¡Invita amigos y gana USDT por cada movimiento que hagan!",
            "cta": "👇 ¡Toca abajo para comenzar a jugar!",
            "btn": "♟️  Abrir FinChess Arena  ♟️",
        },
        "fr": {
            "greeting": "👑 <b>Bienvenue, {name} !</b>",
            "sync": "Vous êtes dans l'Arène.",
            "level_label": "NIV.",
            "xp_label": "XP",
            "next_label": "prochain niv.",
            "features_header": "🎮 <b>FONCTIONNALITÉS :</b>",
            "f1": "♟️ <b>Jouer & Gagner :</b> Misez des USDT en temps réel",
            "f2": "👥 <b>Parrainage :</b> Gagnez jusqu'à 2% des mises de vos amis",
            "f3": "🧩 <b>Académie :</b> 100 niveaux de puzzles d'échecs",
            "f4": "⚡ <b>Retrait :</b> Gains transférés sur TON au plus vite",
            "ref_header": "🔗 <b>Lien d'invitation (cliquez pour copier) :</b>",
            "ref_qr": "📷 <b>Code QR d'invitation (scanner en personne) :</b> <a href=\"{qr_link}\">Ouvrir le code QR</a>",
            "ref_hint": "Parrainez des amis et gagnez des USDT à chaque coup !",
            "cta": "👇 Appuyez ci-dessous pour commencer !",
            "btn": "♟️  Ouvrir FinChess Arena  ♟️",
        },
        "ar": {
            "greeting": "👑 <b>مرحباً، {name}!</b>",
            "sync": "أنت متصل بالساحة.",
            "level_label": "المستوى",
            "xp_label": "XP",
            "next_label": "للمستوى التالي",
            "features_header": "🎮 <b>مزايا الساحة:</b>",
            "f1": "♟️ <b>العب واربح:</b> راهن بـ USDT في مباريات مباشرة",
            "f2": "👥 <b>الإحالات:</b> اكسب حتى 2% من رهان أصدقائك",
            "f3": "🧩 <b>الأكاديمية:</b> 100 مستوى من ألغاز الشطرنج",
            "f4": "⚡ <b>سحب فوري:</b> أرباحك إلى محفظة TON بثوانٍ",
            "ref_header": "🔗 <b>رابط الدعوة (اضغط للنسخ):</b>",
            "ref_qr": "📷 <b>رمز QR للدعوة (امسحه مباشرة):</b> <a href=\"{qr_link}\">افتح رمز QR</a>",
            "ref_hint": "ادعُ الأصدقاء واكسب USDT مع كل حركة يقومون بها!",
            "cta": "👇 اضغط أدناه لبدء اللعب!",
            "btn": "♟️  فتح FinChess Arena  ♟️",
        },
        "hi": {
            "greeting": "👑 <b>स्वागत है, {name}!</b>",
            "sync": "आप एरिना से जुड़ चुके हैं।",
            "level_label": "लेवल",
            "xp_label": "XP",
            "next_label": "अगले लेवल तक",
            "features_header": "🎮 <b>विशेषताएं:</b>",
            "f1": "♟️ <b>खेलें और कमाएं:</b> USDT लगाएं",
            "f2": "👥 <b>रेफरल:</b> 2% तक कमीशन पाएं",
            "f3": "🧩 <b>अकादमी:</b> 100 पहेलियाँ",
            "f4": "⚡ <b>निकासी:</b> सीधे TON वॉलेट में",
            "ref_header": "🔗 <b>आमंत्रण लिंक:</b>",
            "ref_qr": "📷 <b>आमंत्रण QR कोड (स्कैन करें):</b> <a href=\"{qr_link}\">QR कोड खोलें</a>",
            "ref_hint": "दोस्तों को आमंत्रित करें और उनकी हर चाल पर कमाएं!",
            "cta": "👇 खेलने के लिए नीचे टैप करें!",
            "btn": "♟️  FinChess Arena खोलें  ♟️",
        },
        "pt": {
            "greeting": "👑 <b>Bem-vindo, {name}!</b>",
            "sync": "Você está conectado à Arena.",
            "level_label": "NÍV.",
            "xp_label": "XP",
            "next_label": "próx. nível",
            "features_header": "🎮 <b>RECURSOS:</b>",
            "f1": "♟️ <b>Jogar & Ganhar:</b> Aposte USDT",
            "f2": "👥 <b>Indicações:</b> até 2% de amigos",
            "f3": "🧩 <b>Academia:</b> 100 puzzles",
            "f4": "⚡ <b>Saque:</b> Instantâneo via TON",
            "ref_header": "🔗 <b>Link de convite:</b>",
            "ref_qr": "📷 <b>Código QR de convite (escanear pessoalmente):</b> <a href=\"{qr_link}\">Abrir código QR</a>",
            "ref_hint": "Convide amigos e ganhe USDT a cada lance deles!",
            "cta": "👇 Toque abaixo para começar a jogar!",
            "btn": "♟️  Abrir FinChess Arena  ♟️",
        },
        "ja": {
            "greeting": "👑 <b>{name} さん、ようこそ！</b>",
            "sync": "アリーナに接続されました。",
            "level_label": "LV",
            "xp_label": "XP",
            "next_label": "次のレベルまで",
            "features_header": "🎮 <b>特徴:</b>",
            "f1": "♟️ <b>プレイ＆アーン:</b> USDT賭け",
            "f2": "👥 <b>招待報酬:</b> 最大2%還元",
            "f3": "🧩 <b>アカデミー:</b> 100パズル",
            "f4": "⚡ <b>即時出金:</b> TONへ送金",
            "ref_header": "🔗 <b>招待リンク:</b>",
            "ref_qr": "📷 <b>招待用QRコード (友達に見せてスキャン):</b> <a href=\"{qr_link}\">QRコードを開く</a>",
            "ref_hint": "友達を招待して、彼らの一手ごとにUSDTを獲得しましょう！",
            "cta": "👇 下をタップしてゲームを開始！",
            "btn": "♟️  FinChess Arena を開く  ♟️",
        },
        "zh": {
            "greeting": "👑 <b>欢迎你，{name}！</b>",
            "sync": "你已成功加入竞技场。",
            "level_label": "等级",
            "xp_label": "XP",
            "next_label": "升级还需",
            "features_header": "🎮 <b>竞技场特权：</b>",
            "f1": "♟️ <b>Play & Earn:</b> 押注 USDT",
            "f2": "👥 <b>推荐奖励:</b> 好友最高 2% 佣金",
            "f3": "🧩 <b>战术学院:</b> 100 关挑战",
            "f4": "⚡ <b>极速提现:</b> 秒到 TON 钱包",
            "ref_header": "🔗 <b>邀请链接：</b>",
            "ref_qr": "📷 <b>邀请二维码（面对面扫码）：</b> <a href=\"{qr_link}\">打开二维码</a>",
            "ref_hint": "邀请好友加入，从他们的每一步对局中赚取 USDT！",
            "cta": "👇 点击下方开始您的第一场对局！",
            "btn": "♟️  打开 FinChess Arena  ♟️",
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
                    from app.services.gamification_service import GamificationService
                    from sqlalchemy.exc import IntegrityError
                    ref_code = await GamificationService.generate_referral_code(db)
                    db_user = User(
                        telegram_id=user.id,
                        first_name=user.first_name,
                        last_name=user.last_name,
                        username=user.username,
                        preferred_language=tg_lang,
                        photo_url=await TelegramService.get_user_profile_photo(user.id, context.bot),
                        referral_code=ref_code
                    )
                    db.add(db_user)
                    created_here = True
                    try:
                        await db.commit()
                    except IntegrityError:
                        # Unique telegram_id conflict: the Mini App auth path (or a
                        # duplicate /start update) created this user concurrently.
                        # Use the winner's row instead of paging admins.
                        await db.rollback()
                        result = await db.execute(select(User).where(User.telegram_id == user.id))
                        db_user = result.scalars().first()
                        created_here = False
                        if db_user is None:
                            raise

                    # Process referral only for the user we actually created here
                    if created_here and start_param and start_param.startswith("ref_"):
                        try:
                            await GamificationService.process_referral(db, db_user, start_param)
                        except Exception as ref_err:
                            logger.error(f"Error processing referral in start_command: {ref_err}")
                else:
                    # If the user has no DB language set yet, save the Telegram one
                    if not db_user.preferred_language or db_user.preferred_language == "en":
                        db_user.preferred_language = tg_lang
                        await db.commit()

                lang = db_user.preferred_language or tg_lang

                # Gather user stats for personalised display
                user_level = db_user.level or 1
                user_xp = db_user.xp or 0
                referral_code = db_user.referral_code
                if not referral_code:
                    from app.services.gamification_service import GamificationService
                    referral_code = await GamificationService.generate_referral_code(db)
                    db_user.referral_code = referral_code
                    await db.commit()

            # Build webapp URL with the resolved language
            web_app_url = f"{settings.WEBAPP_URL}?lang={lang}"
            if start_param:
                web_app_url += f"&startapp={start_param}"

            raw_username = settings.TELEGRAM_BOT_USERNAME or "FinChess_bot"
            bot_username = raw_username.lstrip("@")
            referral_link = f"https://t.me/{bot_username}?start=ref_{referral_code}"

            # Resolve localised strings (fallback to English)
            msgs = TelegramService.WELCOME_MESSAGES.get(lang, TelegramService.WELCOME_MESSAGES["en"])

            # Personalise name. MUST be HTML-escaped: Telegram display names are
            # user-controlled and a name containing < > & makes the API reject
            # the whole message with "Can't parse entities" (parse_mode=HTML).
            import html as html_mod
            name = html_mod.escape(user.first_name or "")
            if user.last_name:
                name += f" {html_mod.escape(user.last_name)}"

            # ── XP progress bar (8 blocks, 200 XP per level) ──────────────
            xp_per_level = TelegramService.XP_PER_LEVEL
            xp_in_level = user_xp % xp_per_level
            filled = round((xp_in_level / xp_per_level) * 8)
            bar = "█" * filled + "░" * (8 - filled)
            xp_to_next = xp_per_level - xp_in_level
            level_lbl = msgs.get("level_label", "LVL")
            xp_lbl = msgs.get("xp_label", "XP")

            welcome_msg = (
                f"{msgs['greeting'].format(name=name)}\n"
                f"🏅 <b>{level_lbl} {user_level}</b> • <b>{user_xp} {xp_lbl}</b>\n"
                f"[<code>{bar}</code>] (<i>+{xp_to_next}</i>)\n\n"
                f"{msgs['f1']}\n"
                f"{msgs['f2']}\n"
                f"{msgs['f3']}\n"
                f"{msgs['f4']}\n\n"
                f"{msgs['ref_header']} <code>{referral_link}</code>\n\n"
                f"{msgs['cta']}"
            )

            # Inline button inside the message
            SHARE_BUTTONS = {
                "en": ("🔗  Invite Friends", "Play chess, wager USDT, and earn rewards on FinChess Arena! ♟️🔥"),
                "ru": ("🔗  Пригласить друзей", "Играй в шахматы, ставь USDT и зарабатывай на FinChess Arena! ♟️🔥"),
                "de": ("🔗  Freunde einladen", "Spiele Schach, setze USDT und verdiene Belohnungen in der FinChess Arena! ♟️🔥"),
                "es": ("🔗  Invitar amigos", "¡Juega al ajedrez, apuesta USDT y gana recompensas en FinChess Arena! ♟️🔥"),
                "fr": ("🔗  Inviter des amis", "Jouez aux échecs, misez des USDT et gagnez des récompenses sur FinChess Arena ! ♟️🔥"),
                "ar": ("🔗  دعوة الأصدقاء", "العب الشطرنج، راهن بـ USDT، واكسب الجوائز في FinChess Arena! ♟️🔥"),
                "hi": ("🔗  दोस्तों को आमंत्रित करें", "FinChess Arena पर शतरंज खेलें, USDT दांव पर लगाएं और पुरस्कार जीतें! ♟️🔥"),
                "pt": ("🔗  Convidar amigos", "Jogue xadrez, aposte USDT e ganhe prêmios na FinChess Arena! ♟️🔥"),
                "ja": ("🔗  友達を招待", "FinChess Arenaでチェスをプレイし、USDTを賭けて報酬を獲得しましょう！♟️🔥"),
                "zh": ("🔗  邀请好友", "在 FinChess Arena 对弈、押注 USDT 并赢取奖励！♟️🔥"),
            }
            share_btn_text, share_msg_text = SHARE_BUTTONS.get(lang, SHARE_BUTTONS["en"])
            
            import urllib.parse
            share_url = f"https://t.me/share/url?url={urllib.parse.quote(referral_link)}&text={urllib.parse.quote(share_msg_text)}"

            keyboard = [
                [InlineKeyboardButton(msgs["btn"], web_app=WebAppInfo(url=web_app_url))],
                [InlineKeyboardButton(share_btn_text, url=share_url)]
            ]
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

        except Forbidden:
            # The user blocked the bot before our reply landed (e.g. /start then
            # an immediate block, or PTB replaying a backlog update after a
            # restart). Routine churn, not a bug: mark them blocked the same way
            # on_my_chat_member does and skip the admin alert.
            logger.info(f"/start reply skipped: user {user.id} has blocked the bot")
            try:
                from datetime import datetime, timezone
                async with AsyncSessionLocal() as db:
                    result = await db.execute(select(User).where(User.telegram_id == user.id))
                    db_user = result.scalars().first()
                    if db_user and not db_user.is_blocked:
                        db_user.is_blocked = True
                        db_user.blocked_at = datetime.now(timezone.utc).replace(tzinfo=None)
                        await db.commit()
            except Exception as mark_err:
                logger.warning(f"Could not mark user {user.id} as blocked: {mark_err}")
        except Exception as e:
            # Log for admins (routed to alerts); the user gets a friendly
            # PLAIN-TEXT apology. Never echo the exception or a traceback back
            # to the user: it leaks internals, and worse — if the original
            # failure was an HTML-parse error, the exception text contains the
            # offending markup, so an HTML-formatted error reply fails too and
            # the exception escapes the handler entirely (the "No error
            # handlers are registered" alert loop this replaced).
            bot_errors_logger.error(f"Error in start command: {e}", exc_info=True)
            try:
                await update.message.reply_text(
                    "⚠️ Something went wrong opening the arena. Please try /start again in a moment."
                )
            except Exception:
                pass

    @staticmethod
    async def on_my_chat_member(update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Track when a user blocks or unblocks the bot. Updates is_blocked flag in DB."""
        from app.models.user import User
        from sqlalchemy import select
        from app.core.database import AsyncSessionLocal
        from datetime import datetime, timezone

        member_update = update.my_chat_member
        if not member_update:
            return

        tg_user = member_update.from_user
        new_status = member_update.new_chat_member.status  # 'kicked', 'member', 'left', etc.

        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(User).where(User.telegram_id == tg_user.id))
                db_user = result.scalars().first()
                if not db_user:
                    return

                if new_status == "kicked":  # User blocked the bot
                    if not db_user.is_blocked:
                        db_user.is_blocked = True
                        db_user.blocked_at = datetime.now(timezone.utc).replace(tzinfo=None)
                        await db.commit()
                        logger.info(f"🚫 User {tg_user.id} blocked the bot. Marked as blocked.")
                elif new_status in ("member", "creator", "administrator"):  # User unblocked
                    if db_user.is_blocked:
                        db_user.is_blocked = False
                        db_user.blocked_at = None
                        await db.commit()
                        logger.info(f"✅ User {tg_user.id} unblocked the bot. Marked as active.")
        except Exception as e:
            logger.warning(f"Failed to update block status for user {tg_user.id}: {e}")

    @staticmethod
    async def on_error(update: object, context: "ContextTypes.DEFAULT_TYPE"):
        """PTB application error handler. Without one, any exception escaping a
        bot handler is logged as PTB's bare "No error handlers are registered"
        ERROR — which paged admins with a truncated, typeless traceback.
        Transient Telegram/network blips become warnings; real bugs page
        admins with the actual exception attached.
        """
        err = context.error
        try:
            from app.core.alerts import is_transient_telegram_error
            if err is not None and is_transient_telegram_error(err):
                logger.warning(f"Transient Telegram error in bot handler: {err}")
                return
        except Exception:
            pass
        update_desc = ""
        try:
            if isinstance(update, Update) and update.effective_user:
                update_desc = f" (update from user {update.effective_user.id})"
        except Exception:
            pass
        bot_errors_logger.error(
            f"Unhandled error in bot handler{update_desc}: {err}",
            exc_info=err,
        )

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
            cls.application.add_handler(CallbackQueryHandler(cls.withdrawal_callback, pattern="^wd[cx]:"))
            cls.application.add_handler(ChatMemberHandler(cls.on_my_chat_member, ChatMemberHandler.MY_CHAT_MEMBER))
            cls.application.add_error_handler(cls.on_error)
            
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
                redis_client = None
                try:
                    # Verify database health before participating in leader election
                    from sqlalchemy import text
                    from app.core.database import AsyncSessionLocal
                    db_healthy = True
                    try:
                        async with AsyncSessionLocal() as session:
                            await session.execute(text("SELECT 1"))
                    except Exception as db_err:
                        db_healthy = False
                        logger.error(f"❌ [LEADER ELECTION] Database health check failed, instance cannot be leader: {db_err}")

                    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

                    if not db_healthy:
                        if cls.is_currently_leader:
                            logger.warning("⚠️ [LEADER ELECTION] Database unhealthy. Demoting leader to PASSIVE...")
                            cls.is_currently_leader = False
                            await cls.stop_receiver()
                        
                        current_owner = await redis_client.get(lock_key)
                        if current_owner == instance_id:
                            await redis_client.delete(lock_key)
                        
                        await asyncio.sleep(10)
                        continue

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
                finally:
                    if redis_client is not None:
                        try:
                            await redis_client.close()
                        except Exception as close_err:
                            logger.warning(f"[LEADER ELECTION] Error closing redis client: {close_err}")
                
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

        return f"https://t.me/{bot_username}/app?startapp={game_id}"

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
    async def send_withdrawal_confirmation_request(
        cls, telegram_id: int, text: str, tx_id: int, nonce: str
    ) -> bool:
        """Sends the Confirm/Cancel keyboard for a held withdrawal and reports
        delivery success SYNCHRONOUSLY — unlike send_notification, the caller
        must know whether the second factor actually reached the user (an
        undeliverable confirmation would strand the held funds until expiry).
        """
        if not settings.TELEGRAM_BOT_TOKEN:
            return False
        try:
            bot = cls.application.bot if (cls.application and cls.application.bot) else None
            if not bot:
                from telegram import Bot
                bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
            keyboard = InlineKeyboardMarkup([[
                InlineKeyboardButton("✅ Confirm", callback_data=f"wdc:{tx_id}:{nonce}"),
                InlineKeyboardButton("❌ Cancel", callback_data=f"wdx:{tx_id}:{nonce}"),
            ]])
            await bot.send_message(chat_id=telegram_id, text=text, parse_mode="HTML", reply_markup=keyboard)
            return True
        except Exception as e:
            logger.error(f"❌ Failed to deliver withdrawal confirmation to {telegram_id}: {e}")
            return False

    @staticmethod
    async def withdrawal_callback(update: Update, context):
        """Handles Confirm/Cancel taps on a held withdrawal. Identity and the
        HMAC nonce are verified in the withdrawal_confirmation service."""
        from app.services import withdrawal_confirmation as wc

        query = update.callback_query
        try:
            action, tx_id_str, nonce = (query.data or "").split(":", 2)
            tx_id = int(tx_id_str)
        except (ValueError, AttributeError):
            await query.answer("Invalid request.")
            return

        if action == wc.CONFIRM_ACTION:
            message, done = await wc.confirm_withdrawal(tx_id, query.from_user.id, nonce)
        elif action == wc.CANCEL_ACTION:
            message = await wc.cancel_withdrawal(tx_id, query.from_user.id, nonce)
            done = True
        else:
            await query.answer("Invalid request.")
            return

        await query.answer()
        try:
            if done:
                await query.edit_message_text(message, parse_mode="HTML")
            else:
                # Retryable payout failure — keep the Confirm/Cancel keyboard.
                await query.edit_message_text(message, parse_mode="HTML", reply_markup=query.message.reply_markup)
        except Exception as edit_err:
            # Editing can fail (message too old / unchanged); the outcome is
            # already committed, so just log it.
            logger.warning(f"Could not edit withdrawal confirmation message for tx {tx_id}: {edit_err}")

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


