import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.services.telegram_bot import TelegramService

logger = logging.getLogger(__name__)

# Localized notification templates
EXPIRATION_ALERTS = {
    "en": {
        "warn_3_title": "⚠️ <b>Chess Premium Expiring in 3 Days</b>",
        "warn_3_body": "Your Premium subscription will expire in 3 days. Extend it now to ensure no interruption to your elite benefits!\n\n♟️ Open the App -> Settings -> Premium to extend your subscription.",
        "warn_1_title": "⚠️ <b>Chess Premium Expiring in 1 Day!</b>",
        "warn_1_body": "Your Premium subscription will expire tomorrow. Renew now to keep your 2x XP boost, unlimited AI analysis, and 6-level referral earnings active!\n\n♟️ Open the App -> Settings -> Premium to extend your subscription.",
        "expired_title": "❌ <b>Chess Premium Expired</b>",
        "expired_body": "Your Chess Premium subscription has expired. Renew today to reactivate your 2x XP boost, 100 Tactics Academy levels, and 6-level referral commissions!\n\n♟️ Open the App -> Settings -> Premium to subscribe again."
    },
    "ru": {
        "warn_3_title": "⚠️ <b>Подписка Chess Premium истекает через 3 дня</b>",
        "warn_3_body": "Ваша подписка Premium истекает через 3 дня. Продлите её сейчас, чтобы избежать прерывания действия ваших элитных привилегий!\n\n♟️ Откройте приложение -> Настройки -> Премиум для продления.",
        "warn_1_title": "⚠️ <b>Подписка Chess Premium истекает через 1 день!</b>",
        "warn_1_body": "Ваша подписка Premium истекает завтра. Продлите её сейчас, чтобы сохранить 2x бонус к XP, безлимитный анализ AI и партнерские отчисления на 6 уровней!\n\n♟️ Откройте приложение -> Настройки -> Премиум для продления.",
        "expired_title": "❌ <b>Подписка Chess Premium истекла</b>",
        "expired_body": "Срок действия вашей подписки Chess Premium истек. Продлите её сегодня, чтобы вернуть 2x бонус к XP, 100 уровней Академии Тактики и 6-уровневые реферальные комиссии!\n\n♟️ Откройте приложение -> Настройки -> Премиум для продления."
    },
    "de": {
        "warn_3_title": "⚠️ <b>Chess Premium läuft in 3 Tagen ab</b>",
        "warn_3_body": "Ihr Premium-Abonnement läuft in 3 Tagen ab. Verlängern Sie es jetzt, um eine Unterbrechung Ihrer Elite-Vorteile zu vermeiden!\n\n♟️ App öffnen -> Einstellungen -> Premium, um Ihr Abonnement zu verlängern.",
        "warn_1_title": "⚠️ <b>Chess Premium läuft in 1 Tag ab!</b>",
        "warn_1_body": "Ihr Premium-Abonnement läuft morgen ab. Verlängern Sie jetzt, um Ihren 2x XP-Boost, Ihre unbegrenzten KI-Analysen und Ihre 6-stufigen Empfehlungseinnahmen aktiv zu halten!\n\n♟️ App öffnen -> Einstellungen -> Premium, um Ihr Abonnement zu verlängern.",
        "expired_title": "❌ <b>Chess Premium abgelaufen</b>",
        "expired_body": "Ihr Chess Premium-Abonnement ist abgelaufen. Verlängern Sie noch heute, um Ihren 2x XP-Boost, 100 Tactics Academy-Level und 6-stufige Empfehlungsprovisionen wieder zu aktivieren!\n\n♟️ App öffnen -> Einstellungen -> Premium, um erneut zu abonnieren."
    },
    "es": {
        "warn_3_title": "⚠️ <b>Chess Premium vence en 3 días</b>",
        "warn_3_body": "Tu suscripción Premium vencerá en 3 días. ¡Extiéndela ahora para asegurar que no se interrumpan tus beneficios de élite!\n\n♟️ Abre la aplicación -> Configuración -> Premium para extender tu suscripción.",
        "warn_1_title": "⚠️ <b>¡Chess Premium vence en 1 día!</b>",
        "warn_1_body": "Tu suscripción Premium vencerá mañana. ¡Renueva ahora para mantener activos tu multiplicador de XP x2, análisis de IA ilimitados y ganancias de referidos de 6 niveles!\n\n♟️ Abre la aplicación -> Configuración -> Premium para extender tu suscripción.",
        "expired_title": "❌ <b>Chess Premium vencido</b>",
        "expired_body": "Tu suscripción Chess Premium ha vencido. ¡Renueva hoy para reactivar tu multiplicador de XP x2, 100 niveles de la Academia de Tácticas y comisiones de referidos de 6 niveles!\n\n♟️ Abre la aplicación -> Configuración -> Premium para suscribirte de nuevo."
    },
    "fr": {
        "warn_3_title": "⚠️ <b>Chess Premium expire dans 3 jours</b>",
        "warn_3_body": "Votre abonnement Premium expirera dans 3 jours. Prolongez-le dès maintenant pour éviter toute interruption de vos avantages d'élite !\n\n♟️ Ouvrez l'application -> Paramètres -> Premium pour prolonger votre abonnement.",
        "warn_1_title": "⚠️ <b>Chess Premium expire dans 1 jour !</b>",
        "warn_1_body": "Votre abonnement Premium expire demain. Renouvelez-le maintenant pour conserver votre boost de XP x2, vos analyses IA illimitées et vos commissions de parrainage sur 6 niveaux !\n\n♟️ Ouvrez l'application -> Paramètres -> Premium pour prolonger votre abonnement.",
        "expired_title": "❌ <b>Chess Premium expiré</b>",
        "expired_body": "Votre abonnement Chess Premium a expiré. Renouvelez-le aujourd'hui pour réactiver votre boost de XP x2, les 100 niveaux de l'Académie Tactique et vos commissions de parrainage sur 6 niveaux !\n\n♟️ Ouvrez l'application -> Paramètres -> Premium pour vous réabonner."
    },
    "pt": {
        "warn_3_title": "⚠️ <b>Chess Premium expirando em 3 dias</b>",
        "warn_3_body": "Sua assinatura Premium vai expirar em 3 dias. Prolongue-a agora para garantir que não haja interrupções em seus benefícios de elite!\n\n♟️ Abra o Aplicativo -> Configurações -> Premium para estender sua assinatura.",
        "warn_1_title": "⚠️ <b>Chess Premium expirando em 1 dia!</b>",
        "warn_1_body": "Sua assinatura Premium expira amanhã. Renove agora para manter seu dobro de XP, análises ilimitadas de IA e comissões de indicações de 6 níveis ativos!\n\n♟️ Abra o Aplicativo -> Configurações -> Premium para estender sua assinatura.",
        "expired_title": "❌ <b>Chess Premium Expirado</b>",
        "expired_body": "Sua assinatura Chess Premium expirou. Renove hoje para reativar seu multiplicador de XP x2, 100 níveis da Academia de Tácticas e comissões de indicações de 6 níveis!\n\n♟️ Abra o Aplicativo -> Configurações -> Premium para assinar novamente."
    },
    "zh": {
        "warn_3_title": "⚠️ <b>Chess Premium 会员将在 3 天后到期</b>",
        "warn_3_body": "您的 Premium 会员将在 3 天后到期。请立即续费以确保您的尊贵特权不受影响！\n\n♟️ 打开小程序 -> 设置 -> 尊贵会员 即可续费。",
        "warn_1_title": "⚠️ <b>Chess Premium 会员将在 1 天后到期！</b>",
        "warn_1_body": "您的 Premium 会员将在明天到期。请立即续费以保持 2 倍经验值加成、无限 AI 分析和 6 级推广佣金的激活状态！\n\n♟️ 打开小程序 -> 设置 -> 尊贵会员 即可续费。",
        "expired_title": "❌ <b>Chess Premium 会员已过期</b>",
        "expired_body": "您的 Chess Premium 会员已过期。请立即续费以重新激活 2 倍经验值加成、100 关战术学院以及 6 级推广佣金！\n\n♟️ 打开小程序 -> 设置 -> 尊贵会员 即可重新订阅。"
    },
    "ja": {
        "warn_3_title": "⚠️ <b>Chess Premiumの有効期限が残り3日です</b>",
        "warn_3_body": "Premiumサブスクリプションの有効期限が残り3日です。エリート特典を継続してご利用いただくために、今すぐ更新してください！\n\n♟️ アプリを開く -> 設定 -> プレミアム から更新できます。",
        "warn_1_title": "⚠️ <b>Chess Premiumの有効期限が残り1日です！</b>",
        "warn_1_body": "Premiumサブスクリプションが明日終了します。2倍のXPブースト、無制限のAI解析、6レベル紹介報酬のアクティブ状態を維持するために、今すぐ更新してください！\n\n♟️ アプリを開く -> 設定 -> プレミアム から更新できます。",
        "expired_title": "❌ <b>Chess Premiumの有効期限が切れました</b>",
        "expired_body": "Chess Premiumサブスクリプションの有効期限が切れました。2倍のXPブースト、タクティクスアカデミーの100レベル、6レベル紹介報酬を再開するには、今すぐ更新してください！\n\n♟️ アプリを開く -> 設定 -> プレミアム から再登録してください。"
    },
    "ar": {
        "warn_3_title": "⚠️ <b>ينتهي اشتراك Chess Premium خلال 3 أيام</b>",
        "warn_3_body": "سينتهي اشتراكك في Premium خلال 3 أيام. قم بتمديده الآن لضمان عدم انقطاع مزايا النخبة الخاصة بك!\n\n♟️ افتح التطبيق -> الإعدادات -> بريميوم لتمديد اشتراكك.",
        "warn_1_title": "⚠️ <b>ينتهي اشتراك Chess Premium خلال يوم واحد!</b>",
        "warn_1_body": "سينتهي اشتراكك في Premium غداً. جدد الآن للحفاظ على مضاعف XP بمقدار 2x وتحليل الذكاء الاصطناعي غير المحدود وأرباح الإحالة المكونة من 6 مستويات نشطة!\n\n♟️ افتح التطبيق -> الإعدادات -> بريميوم لتمديد اشتراكك.",
        "expired_title": "❌ <b>انتهت صلاحية Chess Premium</b>",
        "expired_body": "انتهت صلاحية اشتراكك في Chess Premium. جدد اليوم لإعادة تفعيل مضاعف XP بمقدار 2x و100 مستوى في أكاديمية التكتيكات وعمولات الإحالة المكونة من 6 مستويات!\n\n♟️ افتح التطبيق -> الإعدادات -> بريميوم للاشتراك مرة أخرى."
    },
    "hi": {
        "warn_3_title": "⚠️ <b>Chess Premium सदस्यता 3 दिनों में समाप्त हो रही है</b>",
        "warn_3_body": "आपकी Premium सदस्यता 3 दिनों में समाप्त हो जाएगी। अपने विशिष्ट लाभों को बिना किसी रुकावट के जारी रखने के लिए इसे अभी बढ़ाएं!\n\n♟️ ऐप खोलें -> सेटिंग्स -> प्रीमियम पर जाकर अपनी सदस्यता बढ़ाएं।",
        "warn_1_title": "⚠️ <b>Chess Premium सदस्यता 1 दिन में समाप्त हो रही है!</b>",
        "warn_1_body": "आपकी Premium सदस्यता कल समाप्त हो जाएगी। अपने 2x XP बूस्ट, असीमित एआई विश्लेषण और 6-स्तरीय रेफ़रल कमाई को सक्रिय रखने के लिए अभी नवीनीकरण करें!\n\n♟️ ऐप खोलें -> सेटिंग्स -> प्रीमियम पर जाकर अपनी सदस्यता बढ़ाएं।",
        "expired_title": "❌ <b>Chess Premium सदस्यता समाप्त हो गई</b>",
        "expired_body": "आपकी Chess Premium सदस्यता समाप्त हो गई है। अपने 2x XP बूस्ट, 100 टैक्टिक्स अकादमी स्तरों और 6-स्तरीय रेफ़रल कमीशन को पुनः सक्रिय करने के लिए आज ही नवीनीकरण करें!\n\n♟️ ऐप खोलें -> सेटिंग्स -> प्रीमियम पर जाकर पुनः सदस्यता लें।"
    }
}

class SubscriptionService:
    @classmethod
    def _get_alert_template(cls, lang: str):
        # Default to English if language template is not defined
        return EXPIRATION_ALERTS.get(lang, EXPIRATION_ALERTS["en"])

    @classmethod
    async def check_and_notify_subscriptions(cls, db: AsyncSession):
        """
        Check all active Premium users, handle expirations, and send warnings 3 days and 1 day before expiration.
        """
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # Select all users whose subscription is marked as active in database
        result = await db.execute(
            select(User).where(User.is_premium == True)
        )
        active_users = result.scalars().all()
        
        logger.info(f"Checking subscription states for {len(active_users)} active Premium users...")
        
        for user in active_users:
            if not user.premium_expires_at:
                continue
                
            expires_at = user.premium_expires_at
            time_left = expires_at - now
            
            # 1. Check if completely expired
            if expires_at < now:
                logger.info(f"User {user.telegram_id}'s subscription expired. Resetting status...")
                user.is_premium = False
                user.premium_tier = None
                user.premium_warning_sent = 0
                db.add(user)
                
                # Send expiration notification
                tpl = cls._get_alert_template(user.preferred_language)
                text = f"{tpl['expired_title']}\n\n{tpl['expired_body']}"
                await TelegramService.send_notification(user.telegram_id, text)
                
            # 2. Check if expiring in 1 day (<= 24 hours left)
            elif time_left <= timedelta(days=1):
                if not user.premium_warning_sent or user.premium_warning_sent > 1:
                    logger.info(f"Sending 1-day expiration warning to user {user.telegram_id}...")
                    user.premium_warning_sent = 1
                    db.add(user)
                    
                    tpl = cls._get_alert_template(user.preferred_language)
                    text = f"{tpl['warn_1_title']}\n\n{tpl['warn_1_body']}"
                    await TelegramService.send_notification(user.telegram_id, text)
                    
            # 3. Check if expiring in 3 days (<= 72 hours left)
            elif time_left <= timedelta(days=3):
                if not user.premium_warning_sent or user.premium_warning_sent > 3:
                    logger.info(f"Sending 3-day expiration warning to user {user.telegram_id}...")
                    user.premium_warning_sent = 3
                    db.add(user)
                    
                    tpl = cls._get_alert_template(user.preferred_language)
                    text = f"{tpl['warn_3_title']}\n\n{tpl['warn_3_body']}"
                    await TelegramService.send_notification(user.telegram_id, text)

        await db.commit()

async def start_subscription_checker():
    """Background loop that executes the subscription expiration checks periodically."""
    from app.core.database import AsyncSessionLocal
    
    # Wait for bot and startup sequences to settle
    await asyncio.sleep(15)
    logger.info("Subscription background scheduler task started.")
    
    while True:
        try:
            async with AsyncSessionLocal() as db:
                await SubscriptionService.check_and_notify_subscriptions(db)
        except Exception as e:
            logger.error(f"Error in background subscription check loop: {e}", exc_info=True)
            
        # Run every 6 hours to ensure notifications are delivered on time without spam
        await asyncio.sleep(21600)
