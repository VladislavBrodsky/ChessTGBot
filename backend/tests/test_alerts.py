import pytest
import logging
from unittest.mock import patch, AsyncMock
from app.core.alerts import TelegramAlertHandler, send_admin_alert, ADMIN_IDS

@pytest.mark.asyncio
async def test_send_admin_alert():
    """Verify send_admin_alert dispatches formatted notification to all target admin IDs."""
    with patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock) as mock_send:
        await send_admin_alert("Database connection dropped!")
        
        # Verify call count equals the number of configured admins
        expected_admins = [admin_id for admin_id in ADMIN_IDS if admin_id > 0]
        assert mock_send.call_count == len(expected_admins)
        
        for admin_id in expected_admins:
            mock_send.assert_any_call(admin_id, "🚨 <b>[SYSTEM ALERT]</b>\n\nDatabase connection dropped!")

@pytest.mark.asyncio
async def test_telegram_alert_handler_emits_error_log():
    """Verify that logging an ERROR triggers TelegramAlertHandler and notifies admins."""
    # Setup test logger with TelegramAlertHandler
    logger = logging.getLogger("test_alert_logger")
    logger.setLevel(logging.INFO)
    logger.propagate = False
    
    alert_handler = TelegramAlertHandler()
    alert_handler.setLevel(logging.ERROR) # Only ERROR and above
    logger.addHandler(alert_handler)
    
    try:
        with patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock) as mock_send:
            # 1. Log an INFO level message (should NOT trigger alert)
            logger.info("Normal heartbeat info log.")
            await asyncio_sleep_helper()
            assert mock_send.call_count == 0
            
            # 2. Log an ERROR level message (should trigger alert)
            logger.error("Critical API endpoint down!")
            await asyncio_sleep_helper()
            
            expected_admins = [admin_id for admin_id in ADMIN_IDS if admin_id > 0]
            assert mock_send.call_count == len(expected_admins)
            
            for admin_id in expected_admins:
                # The logged message should be forwarded
                call_args = mock_send.call_args_list
                matching_calls = [c for c in call_args if c[0][0] == admin_id and "Critical API endpoint down!" in c[0][1]]
                assert len(matching_calls) > 0
                
    finally:
        logger.removeHandler(alert_handler)

async def asyncio_sleep_helper():
    # Helper to allow async loop tasks to execute
    await pytest.importorskip("asyncio").sleep(0.05)
