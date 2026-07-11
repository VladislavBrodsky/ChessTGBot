"""Logging hygiene: the bot token must never reach the logs.

httpx logs every request URL at INFO, and Telegram Bot API URLs embed the bot
token (api.telegram.org/bot<TOKEN>/...). setup_logging must therefore cap the
httpx/httpcore loggers at WARNING so routine requests are not logged at all.
Regression for: production Railway logs containing the token on every
getChatMember / getUserProfilePhotos call.
"""
import logging

from app.core.logger import setup_logging


def test_httpx_request_urls_not_logged_at_info():
    setup_logging()
    for name in ("httpx", "httpcore"):
        assert not logging.getLogger(name).isEnabledFor(logging.INFO), (
            f"{name} logger must not log INFO records — its request lines "
            f"contain the Telegram bot token in the URL"
        )
        assert logging.getLogger(name).isEnabledFor(logging.WARNING)
