"""
/start handler resilience.

Covers the two recurring "Error in start command" production alerts from
2026-07-12 (see git history):

- UniqueViolationError on ix_users_telegram_id: the bot /start handler and the
  Mini App auth path (app.api.v1.deps -> crud.create_user) race to create the
  same user; the loser must adopt the winner's row instead of paging admins.
- telegram.error.Forbidden ("bot was blocked by the user") when the /start
  reply lands after the user blocked the bot: routine churn that should mark
  the user is_blocked, not page admins via app.bot.errors.
"""
import inspect
import logging
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from telegram.error import Forbidden

from app.crud import user as user_crud
from app.models.user import User
from app.services.telegram_bot import TelegramService
from sqlalchemy import select


@pytest.mark.asyncio
async def test_create_user_duplicate_returns_existing_row(db_session):
    """Losing the create race must return the winner's row, not raise."""
    if hasattr(db_session, "users"):  # mock session (no test DB) — skip
        return
    first = await user_crud.create_user(db_session, 555001, "Winner")
    second = await user_crud.create_user(db_session, 555001, "Loser")

    assert second.id == first.id
    assert second.first_name == "Winner"


def test_start_command_guards_insert_race():
    """Regression guard: start_command must absorb a telegram_id conflict
    (rollback + re-select) instead of letting IntegrityError hit the alert
    path, and must not double-process the referral when it lost the race."""
    src = inspect.getsource(TelegramService.start_command)
    assert "IntegrityError" in src
    assert "rollback" in src
    assert "created_here" in src


@pytest.mark.asyncio
async def test_start_command_forbidden_marks_blocked_without_alert(db_session, caplog):
    """A user who blocked the bot is flagged is_blocked; admins are not paged."""
    if hasattr(db_session, "users"):  # mock session (no test DB) — skip
        return
    telegram_id = 555003

    update = MagicMock()
    update.effective_user = MagicMock(
        id=telegram_id, first_name="Blocky", last_name=None,
        username="blocky", language_code="en",
    )
    update.message.reply_text = AsyncMock(
        side_effect=Forbidden("Forbidden: bot was blocked by the user")
    )
    context = MagicMock()
    context.args = []
    context.bot.set_chat_menu_button = AsyncMock()

    with patch.object(TelegramService, "get_user_profile_photo", new=AsyncMock(return_value=None)):
        with caplog.at_level(logging.INFO):
            await TelegramService.start_command(update, context)

    # Routine churn: nothing routed to the alertable logger.
    assert not any(r.name == "app.bot.errors" for r in caplog.records)

    result = await db_session.execute(select(User).where(User.telegram_id == telegram_id))
    db_user = result.scalars().first()
    assert db_user is not None
    assert db_user.is_blocked is True
    assert db_user.blocked_at is not None
