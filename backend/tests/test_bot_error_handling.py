"""
Bot handler error handling + alert traceback quality.

Covers the fix for the "No error handlers are registered" production alerts:
- HTML-escaping of user-controlled display names in /start (a name with < > &
  used to make reply_text fail, and the HTML error-reply fail after it);
- the PTB error handler: transient Telegram errors are warnings, real
  errors page admins via the alertable app.bot.errors logger;
- alert tracebacks keep the TAIL (exception type/message) and are
  HTML-escaped so they can't break the alert's own markup.
"""
import logging
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from telegram import error as tg_error

from app.services.telegram_bot import TelegramService


@pytest.mark.asyncio
async def test_on_error_transient_is_warning_only(caplog):
    context = MagicMock()
    context.error = tg_error.TimedOut()

    with caplog.at_level(logging.WARNING):
        await TelegramService.on_error(None, context)

    assert any(r.levelno == logging.WARNING and "Transient" in r.message for r in caplog.records)
    assert not any(r.name == "app.bot.errors" for r in caplog.records)


@pytest.mark.asyncio
async def test_on_error_real_error_pages_admins(caplog):
    context = MagicMock()
    context.error = tg_error.BadRequest("Can't parse entities: unsupported start tag \"<Pro\"")

    with caplog.at_level(logging.ERROR):
        await TelegramService.on_error(None, context)

    error_records = [r for r in caplog.records if r.name == "app.bot.errors" and r.levelno == logging.ERROR]
    assert len(error_records) == 1
    assert "Can't parse entities" in error_records[0].message


def test_alert_traceback_keeps_tail_and_is_escaped():
    """The alert handler must show the exception (traceback bottom), not just
    the top frames, and must escape < > so the alert's HTML stays valid."""
    from app.core.alerts import TelegramAlertHandler, clear_alerts_cache
    from app.services.session_manager import SessionManager
    import asyncio

    SessionManager._use_memory = True
    clear_alerts_cache()

    # Build a deep traceback (> 1000 chars once formatted) whose exception
    # message contains HTML-hostile characters.
    def recurse(n):
        if n == 0:
            raise ValueError("Can't parse entities: unsupported start tag \"<<Pro>>\" here")
        return recurse(n - 1)

    try:
        recurse(20)
    except ValueError:
        import sys
        exc_info = sys.exc_info()

    record = logging.LogRecord(
        name="app.some.module", level=logging.ERROR, pathname="x.py", lineno=1,
        msg="Something exploded", args=(), exc_info=exc_info,
    )

    captured = {}

    async def fake_send(fingerprint, message, timestamp=None, system=None):
        captured["message"] = message

    with patch("app.core.alerts.send_alert_with_redis_rate_limit", side_effect=fake_send):
        loop = asyncio.new_event_loop()
        try:
            asyncio.set_event_loop(loop)
            TelegramAlertHandler().emit(record)
            loop.run_until_complete(asyncio.sleep(0))
        finally:
            asyncio.set_event_loop(None)
            loop.close()

    message = captured.get("message", "")
    # Tail kept: the exception line is present despite truncation.
    assert "ValueError" in message
    assert "unsupported start tag" in message
    # And it is escaped — no raw << >> markup that would break the alert HTML.
    assert "<<Pro>>" not in message
    assert "&lt;&lt;Pro&gt;&gt;" in message


def test_start_welcome_names_are_escaped():
    """Regression guard: the /start greeting must escape user display names."""
    import inspect
    from app.services import telegram_bot
    src = inspect.getsource(telegram_bot.TelegramService.start_command)
    assert "html_mod.escape(user.first_name" in src
    assert "html_mod.escape(user.last_name" in src
