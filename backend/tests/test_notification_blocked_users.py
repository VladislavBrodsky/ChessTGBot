"""
send_notification resilience for users who blocked the bot.

Covers the recurring production error spam from 2026-07-16 logs: every arena
heads-up blast logged dozens of
    "❌ Failed to send Telegram bot notification to X: Forbidden: bot was
    blocked by the user"
for the same users, forever. Root cause: arena targeting filters on
User.is_blocked, but the flag is only set by the my_chat_member webhook — a
block that update never delivered (bot offline, webhook gap, block predating
the handler) leaves the user eligible, so every broadcast retries them.

The fix makes send_notification self-healing: a Forbidden send marks the user
is_blocked (same as the /start handler), so the next targeting query skips
them.
"""
import asyncio
import logging
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from telegram.error import BadRequest, Forbidden, TimedOut

import app.services.telegram_bot as telegram_bot_module
from app.crud import user as user_crud
from app.models.user import User
from app.services.telegram_bot import TelegramService
from sqlalchemy import select


async def _send_and_drain(telegram_id: int, text: str):
    """Call send_notification and await its fire-and-forget task."""
    created = []
    orig_create_task = asyncio.create_task

    def capture(coro):
        task = orig_create_task(coro)
        created.append(task)
        return task

    with patch.object(telegram_bot_module.asyncio, "create_task", capture):
        await TelegramService.send_notification(telegram_id, text)
    await asyncio.gather(*created)


@pytest.mark.asyncio
async def test_forbidden_notification_marks_user_blocked(db_session, caplog):
    """A Forbidden send flags is_blocked so broadcasts stop retrying the user."""
    if hasattr(db_session, "users"):  # mock session (no test DB) — skip
        return
    telegram_id = 555004
    await user_crud.create_user(db_session, telegram_id, "Blocky")
    await db_session.commit()

    mock_app = MagicMock()
    mock_app.bot.send_message = AsyncMock(
        side_effect=Forbidden("Forbidden: bot was blocked by the user")
    )

    with patch.object(TelegramService, "application", mock_app), \
         patch.object(telegram_bot_module.settings, "TELEGRAM_BOT_TOKEN", "123:test"):
        with caplog.at_level(logging.INFO):
            await _send_and_drain(telegram_id, "arena starts soon")

    # Routine churn: no ERROR record, nothing on the alertable logger.
    assert not any(r.levelno >= logging.ERROR for r in caplog.records)
    assert not any(r.name == "app.bot.errors" for r in caplog.records)

    result = await db_session.execute(select(User).where(User.telegram_id == telegram_id))
    db_user = result.scalars().first()
    assert db_user is not None
    assert db_user.is_blocked is True
    assert db_user.blocked_at is not None


@pytest.mark.asyncio
async def test_chat_not_found_notification_marks_user_blocked(db_session, caplog):
    """A 'Chat not found' BadRequest is routine churn: no admin alert, user flagged.

    Regression for the spurious CORE API page fired when notifying a user who
    never pressed Start on the bot. 'Chat not found' is a BadRequest (not a
    Forbidden), so it used to fall through to the app.bot.errors logger and
    page admins. It must be treated like Forbidden instead.
    """
    if hasattr(db_session, "users"):  # mock session (no test DB) — skip
        return
    telegram_id = 6842281287
    await user_crud.create_user(db_session, telegram_id, "NeverStarted")
    await db_session.commit()

    mock_app = MagicMock()
    mock_app.bot.send_message = AsyncMock(
        side_effect=BadRequest("Chat not found")
    )

    with patch.object(TelegramService, "application", mock_app), \
         patch.object(telegram_bot_module.settings, "TELEGRAM_BOT_TOKEN", "123:test"):
        with caplog.at_level(logging.INFO):
            await _send_and_drain(telegram_id, "you won a game")

    # Routine churn: no ERROR record, nothing on the alertable logger.
    assert not any(r.levelno >= logging.ERROR for r in caplog.records)
    assert not any(r.name == "app.bot.errors" for r in caplog.records)

    result = await db_session.execute(select(User).where(User.telegram_id == telegram_id))
    db_user = result.scalars().first()
    assert db_user is not None
    assert db_user.is_blocked is True
    assert db_user.blocked_at is not None


@pytest.mark.asyncio
async def test_genuine_bad_request_still_logs_error(db_session, caplog):
    """A real request-shape BadRequest stays alertable and does not flag the user."""
    if hasattr(db_session, "users"):  # mock session (no test DB) — skip
        return
    telegram_id = 555006
    await user_crud.create_user(db_session, telegram_id, "BadHtml")
    await db_session.commit()

    mock_app = MagicMock()
    mock_app.bot.send_message = AsyncMock(
        side_effect=BadRequest("Can't parse entities: unclosed tag")
    )

    with patch.object(TelegramService, "application", mock_app), \
         patch.object(telegram_bot_module.settings, "TELEGRAM_BOT_TOKEN", "123:test"):
        with caplog.at_level(logging.INFO):
            await _send_and_drain(telegram_id, "you won a game")

    assert any(
        r.levelno == logging.ERROR
        and r.name == "app.bot.errors"
        and "parse entities" in r.getMessage()
        for r in caplog.records
    )

    result = await db_session.execute(select(User).where(User.telegram_id == telegram_id))
    db_user = result.scalars().first()
    assert db_user is not None
    assert db_user.is_blocked is False


@pytest.mark.asyncio
async def test_transient_timeout_retries_and_succeeds_without_alerting(db_session, caplog):
    """A TimedOut send is retried once and must never page admins.

    Regression for the 2026-08-10 CORE API alert ("Failed to send Telegram bot
    notification to X: Timed out"): a momentary network failure fell through to
    the catch-all and hit the app.bot.errors logger, even though
    is_transient_telegram_error already classifies it as retryable churn.
    """
    if hasattr(db_session, "users"):  # mock session (no test DB) — skip
        return
    telegram_id = 716720099

    mock_app = MagicMock()
    mock_app.bot.send_message = AsyncMock(side_effect=[TimedOut("Timed out"), None])

    with patch.object(TelegramService, "application", mock_app), \
         patch.object(telegram_bot_module.settings, "TELEGRAM_BOT_TOKEN", "123:test"), \
         patch.object(telegram_bot_module, "NOTIFICATION_RETRY_DELAY_SECONDS", 0):
        with caplog.at_level(logging.INFO):
            await _send_and_drain(telegram_id, "your withdrawal is confirmed")

    assert mock_app.bot.send_message.await_count == 2
    assert not any(r.levelno >= logging.ERROR for r in caplog.records)
    assert not any(r.name == "app.bot.errors" for r in caplog.records)


@pytest.mark.asyncio
async def test_transient_timeout_that_persists_is_dropped_without_alerting(db_session, caplog):
    """If the retry also times out the notification is dropped at WARNING, not paged."""
    if hasattr(db_session, "users"):  # mock session (no test DB) — skip
        return
    mock_app = MagicMock()
    mock_app.bot.send_message = AsyncMock(side_effect=TimedOut("Timed out"))

    with patch.object(TelegramService, "application", mock_app), \
         patch.object(telegram_bot_module.settings, "TELEGRAM_BOT_TOKEN", "123:test"), \
         patch.object(telegram_bot_module, "NOTIFICATION_RETRY_DELAY_SECONDS", 0):
        with caplog.at_level(logging.INFO):
            await _send_and_drain(555007, "arena starts soon")

    assert mock_app.bot.send_message.await_count == 2
    assert not any(r.levelno >= logging.ERROR for r in caplog.records)
    assert any("dropped after retry" in r.getMessage() for r in caplog.records)


@pytest.mark.asyncio
async def test_other_send_errors_still_log_error(db_session, caplog):
    """Non-Forbidden failures keep the ERROR log and do not flag the user."""
    if hasattr(db_session, "users"):  # mock session (no test DB) — skip
        return
    telegram_id = 555005
    await user_crud.create_user(db_session, telegram_id, "Flaky")
    await db_session.commit()

    mock_app = MagicMock()
    mock_app.bot.send_message = AsyncMock(side_effect=RuntimeError("network down"))

    with patch.object(TelegramService, "application", mock_app), \
         patch.object(telegram_bot_module.settings, "TELEGRAM_BOT_TOKEN", "123:test"):
        with caplog.at_level(logging.INFO):
            await _send_and_drain(telegram_id, "arena starts soon")

    assert any(
        r.levelno == logging.ERROR and "network down" in r.getMessage()
        for r in caplog.records
    )

    result = await db_session.execute(select(User).where(User.telegram_id == telegram_id))
    db_user = result.scalars().first()
    assert db_user is not None
    assert db_user.is_blocked is False
