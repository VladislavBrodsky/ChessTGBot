import os
import sys

# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.bot import create_bot

if __name__ == '__main__':
    print("Starting Telegram Bot...")
    try:
        application = create_bot()
        print("Bot is polling... Press Ctrl+C to stop.")
        application.run_polling()
    except Exception as e:
        print(f"Error starting bot: {e}")
