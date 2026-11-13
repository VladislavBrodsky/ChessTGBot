"""Admin top-up / Premium alerts: format, escaping and routing."""
import pytest
from unittest.mock import AsyncMock, patch

from app.core import alerts

HASH = "b2ef5481688c55c5fa65d65138ed624b228dce15c7fec4813ec779a9011ffe3c"


async def _render(coro_fn, *args, **kwargs):
    with patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock) as send, \
         patch.object(alerts.settings, "ADMIN_TELEGRAM_IDS", "111,222", create=True), \
         patch.object(type(alerts.settings), "admin_telegram_ids", property(lambda self: [111, 222])):
        await coro_fn(*args, **kwargs)
    assert [c.args[0] for c in send.call_args_list] == [111, 222]
    return send.call_args_list[0].args[1]


@pytest.mark.asyncio
async def test_usdt_topup_alert():
    text = await _render(alerts.send_deposit_alert, "USDT", "jiojil", 5138992367, 45.0, HASH)
    assert text.startswith("💰 <b>Новое пополнение в USDT</b>")
    assert '<a href="tg://user?id=5138992367">@jiojil</a>' in text
    assert "<b>$45.00</b>" in text
    assert f'<a href="https://tonviewer.com/transaction/{HASH}">' in text
    assert "Дата и время:" in text and "#пополнение #usdt" in text


@pytest.mark.asyncio
async def test_stripe_topup_alert_keeps_session_id_copyable():
    text = await _render(alerts.send_deposit_alert, "Stripe", "fsdfsd", 1, 45.0, "cs_live_abc")
    assert text.startswith("🎯 <b>Новое пополнение в Stripe</b>")
    assert "<code>cs_live_abc</code>" in text and "tonviewer" not in text
    assert "#пополнение #stripe" in text


@pytest.mark.parametrize("period, title, tag, amount", [
    ("monthly", "Новая подписка Premium (1 month)", "#premium #monthly", 29.0),
    ("annual", "Новая подписка Premium (1 year)", "#premium #yearly", 245.0),
])
@pytest.mark.asyncio
async def test_premium_alerts(period, title, tag, amount):
    text = await _render(alerts.send_premium_subscription_alert, "fsdfsd", 1, period, amount, "in_123")
    assert text.startswith(f"⭐️ <b>{title}</b>")
    assert f"<b>${amount:,.2f}</b>" in text and tag in text


@pytest.mark.asyncio
async def test_user_controlled_names_are_escaped():
    text = await _render(alerts.send_deposit_alert, "USDT", "<b>x</b>&", 7, 1.0, "<script>")
    assert "@&lt;b&gt;x&lt;/b&gt;&amp;" in text
    assert "<code>&lt;script&gt;</code>" in text
    assert "<script>" not in text


@pytest.mark.asyncio
async def test_missing_username_falls_back_to_id():
    text = await _render(alerts.send_deposit_alert, "USDT", None, 42, 1.0, None)
    assert '<a href="tg://user?id=42">ID 42</a>' in text
    assert "Transaction ID:</b> —" in text
