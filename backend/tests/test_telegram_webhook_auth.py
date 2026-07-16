"""The Telegram webhook must reject updates that don't carry the secret token
Telegram echoes back from set_webhook — otherwise anyone who finds the URL can
forge /start referrals, my_chat_member blocks, etc."""
import inspect
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import AsyncClient

from app.core.config import get_settings
from app.services.telegram_bot import TelegramService

settings = get_settings()

WEBHOOK_PATH = "/api/v1/webhook/telegram"
HEADER = "X-Telegram-Bot-Api-Secret-Token"


@pytest.fixture
def webhook_secret(monkeypatch):
    monkeypatch.setattr(settings, "WEBHOOK_SECRET", "test_webhook_secret_token")
    return "test_webhook_secret_token"


@pytest.mark.asyncio
async def test_webhook_rejects_missing_secret(client: AsyncClient, webhook_secret):
    response = await client.post(WEBHOOK_PATH, json={"update_id": 1})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_webhook_rejects_wrong_secret(client: AsyncClient, webhook_secret):
    response = await client.post(
        WEBHOOK_PATH, json={"update_id": 1}, headers={HEADER: "wrong_token"}
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_webhook_accepts_correct_secret(client: AsyncClient, webhook_secret, monkeypatch):
    mock_app = MagicMock()
    mock_app.bot = MagicMock()
    mock_app.process_update = AsyncMock()
    monkeypatch.setattr(TelegramService, "application", mock_app)

    response = await client.post(
        WEBHOOK_PATH, json={"update_id": 1}, headers={HEADER: webhook_secret}
    )
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_set_webhook_passes_secret_token():
    """start_receiver must register the secret with Telegram, or the header
    check above would reject every genuine update."""
    source = inspect.getsource(TelegramService.start_receiver.__func__)
    assert "secret_token=settings.WEBHOOK_SECRET" in source
