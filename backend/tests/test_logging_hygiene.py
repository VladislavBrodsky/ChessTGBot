"""Logging hygiene: the bot token must never reach the logs.

httpx logs every request URL at INFO, and Telegram Bot API URLs embed the bot
token (api.telegram.org/bot<TOKEN>/...). setup_logging must therefore cap the
httpx/httpcore loggers at WARNING so routine requests are not logged at all.
Regression for: production Railway logs containing the token on every
getChatMember / getUserProfilePhotos call.
"""
import logging
import sys

from app.core.logger import exception_summary, setup_logging


def test_httpx_request_urls_not_logged_at_info():
    setup_logging()
    for name in ("httpx", "httpcore"):
        assert not logging.getLogger(name).isEnabledFor(logging.INFO), (
            f"{name} logger must not log INFO records — its request lines "
            f"contain the Telegram bot token in the URL"
        )
        assert logging.getLogger(name).isEnabledFor(logging.WARNING)


def test_root_json_logs_use_stdout_and_uvicorn_propagates():
    setup_logging()

    root_stream_handlers = [
        handler
        for handler in logging.getLogger().handlers
        if type(handler) is logging.StreamHandler
    ]
    assert len(root_stream_handlers) == 1
    assert root_stream_handlers[0].stream is sys.stdout

    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        uvicorn_logger = logging.getLogger(name)
        assert uvicorn_logger.handlers == []
        assert uvicorn_logger.propagate is True


def test_exception_summary_names_exceptions_with_empty_messages():
    assert exception_summary(TimeoutError()) == "TimeoutError"
    assert exception_summary(ValueError("bad payload")) == "ValueError: bad payload"
