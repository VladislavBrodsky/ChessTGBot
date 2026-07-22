"""Avatar endpoint negative-caching guard.

The /avatar/{id} endpoint used to re-hit the Telegram Bot API on every render
for users with no profile photo (404s were "heavy in the logs"). It now:
  - returns a browser-cacheable 404, and
  - drops a filesystem sentinel so repeat renders skip the Bot API round-trip.
"""
import os
import time
from types import SimpleNamespace
from unittest.mock import patch, AsyncMock, MagicMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from telegram import error as tg_error

from app.api.v1.endpoints.users import get_user_avatar


@pytest.fixture
def client(tmp_path, monkeypatch):
    # Isolate the static_avatars/ dir the endpoint writes to.
    monkeypatch.chdir(tmp_path)
    app = FastAPI()
    app.get("/avatar/{telegram_id}")(get_user_avatar)
    return TestClient(app), tmp_path


def _bot_returning_no_photo():
    bot = MagicMock()
    bot.get_user_profile_photos = AsyncMock(return_value=SimpleNamespace(total_count=0))
    application = MagicMock()
    application.bot = bot
    return application, bot


def test_missing_avatar_returns_cacheable_404(client):
    tc, _ = client
    with patch("app.services.telegram_bot.TelegramService.application", None):
        r = tc.get("/avatar/999")
    assert r.status_code == 404
    # Browser negative-caches the miss so it stops re-requesting every render.
    assert "max-age=300" in r.headers.get("cache-control", "")


def test_no_avatar_is_negative_cached(client):
    tc, tmp = client
    application, bot = _bot_returning_no_photo()
    with patch("app.services.telegram_bot.TelegramService.application", application):
        r1 = tc.get("/avatar/12345")
        r2 = tc.get("/avatar/12345")

    assert r1.status_code == 404 and r2.status_code == 404
    # Telegram was queried once; the second render short-circuited on the marker.
    assert bot.get_user_profile_photos.await_count == 1
    assert (tmp / "static_avatars" / "12345.none").exists()


def test_missing_telegram_user_is_negative_cached(client):
    tc, tmp = client
    bot = MagicMock()
    bot.get_user_profile_photos = AsyncMock(
        side_effect=tg_error.BadRequest("User not found")
    )
    application = MagicMock()
    application.bot = bot

    with patch("app.services.telegram_bot.TelegramService.application", application):
        r1 = tc.get("/avatar/6842281287")
        r2 = tc.get("/avatar/6842281287")

    assert r1.status_code == 404 and r2.status_code == 404
    assert bot.get_user_profile_photos.await_count == 1
    assert (tmp / "static_avatars" / "6842281287.none").exists()


def test_marker_cleared_and_photo_served_when_avatar_appears(client):
    tc, tmp = client
    avatar_dir = tmp / "static_avatars"
    avatar_dir.mkdir(exist_ok=True)
    # A "no avatar" marker from an earlier check, aged past the negative-cache
    # TTL (1h) so the endpoint re-checks Telegram instead of short-circuiting.
    none_file = avatar_dir / "777.none"
    none_file.write_text("")
    stale = time.time() - 7200
    os.utime(none_file, (stale, stale))

    bot = MagicMock()
    bot.get_user_profile_photos = AsyncMock(
        return_value=SimpleNamespace(total_count=1, photos=[[SimpleNamespace(file_id="fid")]])
    )
    bot.get_file = AsyncMock(return_value=SimpleNamespace(file_path="https://tg/file.jpg"))
    application = MagicMock()
    application.bot = bot

    class _FakeAsyncClient:
        def __init__(self, *a, **k):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *a):
            return False
        async def get(self, url):
            return SimpleNamespace(status_code=200, content=b"\xff\xd8\xff-jpeg-bytes")

    with patch("app.services.telegram_bot.TelegramService.application", application), \
         patch("httpx.AsyncClient", _FakeAsyncClient):
        r = tc.get("/avatar/777")

    assert r.status_code == 200
    assert r.headers.get("content-type") == "image/jpeg"
    # The photo is cached and the stale negative marker is gone.
    assert (avatar_dir / "777.jpg").exists()
    assert not (avatar_dir / "777.none").exists()
