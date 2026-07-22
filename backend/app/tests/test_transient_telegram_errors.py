"""Unit tests for is_transient_telegram_error — the classifier that decides
whether a Telegram Bot API failure pages admins (ERROR) or is a momentary
network blip that should only be logged as WARNING.

Regression for: production admin alerts firing on every api.telegram.org
timeout / 502 during subscription verification and avatar fetches.
"""
import httpx
import pytest
from telegram import error as tg_error

from app.core.alerts import (
    is_benign_telegram_avatar_error,
    is_benign_telegram_file_error,
    is_transient_telegram_error,
)


@pytest.mark.parametrize("exc", [
    tg_error.TimedOut("Timed out"),
    tg_error.NetworkError("Bad Gateway"),
    tg_error.RetryAfter(30),
    httpx.ConnectTimeout("connect timeout"),
    httpx.ReadTimeout("read timeout"),
    httpx.ConnectError("connection refused"),
])
def test_transient_errors_do_not_alert(exc):
    assert is_transient_telegram_error(exc) is True


@pytest.mark.parametrize("exc", [
    tg_error.BadRequest("chat not found"),  # subclasses NetworkError but is a real request problem
    tg_error.Forbidden("bot was kicked from the chat"),
    tg_error.InvalidToken(),
    ValueError("something else entirely"),
    httpx.HTTPStatusError("500", request=None, response=None),
])
def test_real_errors_still_alert(exc):
    assert is_transient_telegram_error(exc) is False


@pytest.mark.parametrize("exc", [
    tg_error.BadRequest("Wrong file_id or the file is temporarily unavailable"),
    tg_error.BadRequest("File is temporarily unavailable"),
])
def test_benign_file_errors_recognized(exc):
    # These are BadRequests (so is_transient_telegram_error stays False) but the
    # avatar endpoint must not page admins for them — the stale-cache fallback
    # covers the user. Regression for the recurring "Failed to fetch/cache
    # avatar ... Wrong file_id or the file is temporarily unavailable" alert.
    assert is_transient_telegram_error(exc) is False
    assert is_benign_telegram_file_error(exc) is True


@pytest.mark.parametrize("exc", [
    tg_error.BadRequest("chat not found"),
    ValueError("disk full"),
])
def test_non_file_errors_are_not_benign(exc):
    assert is_benign_telegram_file_error(exc) is False


@pytest.mark.parametrize("exc", [
    tg_error.BadRequest("User not found"),
    tg_error.BadRequest("Bad Request: user not found"),
])
def test_missing_avatar_user_errors_are_benign(exc):
    assert is_benign_telegram_avatar_error(exc) is True


@pytest.mark.parametrize("exc", [
    tg_error.BadRequest("chat not found"),
    ValueError("disk full"),
])
def test_non_avatar_errors_are_not_benign(exc):
    assert is_benign_telegram_avatar_error(exc) is False
