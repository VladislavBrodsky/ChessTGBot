from telegram import Bot
from app.core.config import get_settings

settings = get_settings()
bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)

class TelegramService:
    @staticmethod
    async def create_invite_link(game_id: str) -> str:
        """
        Generates a direct StartApp link for the Telegram Mini App.
        Format: https://t.me/YourBotName/appname?startapp=game_id
        """
        # Note: You need to replace 'YourBotUsername' and 'AppName' with actual values
        # once the bot is configured in BotFather.
        # For now we assume a standard deep link.
        bot_username = (await bot.get_me()).username
        return f"https://t.me/{bot_username}/chess?startapp={game_id}"
