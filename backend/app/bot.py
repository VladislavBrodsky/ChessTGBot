import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler
from app.core.config import get_settings

settings = get_settings()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Handle the /start command.
    """
    user = update.effective_user
    logger.info(f"User {user.id} ({user.username}) started the bot.")
    
    # URL for the Mini App
    # Note: Telegram Mini Apps require HTTPS. 
    # For local development, this button might not open correctly inside Telegram 
    # unless you tunnel localhost (e.g. ngrok).
    web_app_url = "https://t.me/YourBotName/chess" # Placeholder or actual link logic
    
    # We can also just link to the local frontend for now if they click it on desktop
    # But let's look at a "Play Game" button that tries to open the app.
    
    # Create the button
    # Note: Replace 'https://your-app-url.vercel.app' with your actual deployed frontend URL
    # or a tunneling URL (like ngrok) for local development.
    web_app = WebAppInfo(url="https://google.com") # Placeholder for now, or use an env var
    
    keyboard = [
        [InlineKeyboardButton("Play Chess ♟️", web_app=web_app)]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=(
            f"Hello {user.first_name}! 👋\n\n"
            "Welcome to the Chess Game.\n"
            "Click the button below to start playing!"
        ),
        reply_markup=reply_markup
    )

def create_bot():
    """
    Create and configure the bot application.
    """
    if not settings.TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN is not set in environment settings")

    application = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()
    
    start_handler = CommandHandler('start', start)
    application.add_handler(start_handler)
    
    return application
