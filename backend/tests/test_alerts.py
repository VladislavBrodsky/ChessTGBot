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
            call_args = mock_send.call_args_list
            matching_calls = [
                c for c in call_args 
                if c[0][0] == admin_id 
                and "Database connection dropped!" in c[0][1] 
                and "🚨 <b>[SYSTEM ALERT]</b>" in c[0][1] 
                and "Time:" in c[0][1]
            ]
            assert len(matching_calls) > 0

@pytest.mark.asyncio
async def test_telegram_alert_handler_emits_error_log():
    """Verify that logging an ERROR triggers TelegramAlertHandler and notifies admins."""
    # Setup test logger with TelegramAlertHandler
    logger = logging.getLogger("test_alert_logger")
    logger.setLevel(logging.INFO)
    logger.propagate = False
    
    from app.core.alerts import clear_alerts_cache
    from app.services.session_manager import SessionManager
    SessionManager._use_memory = True
    clear_alerts_cache()
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

@pytest.mark.asyncio
async def test_telegram_alert_handler_rate_limiting():
    """Verify that logging multiple duplicate ERRORs within the rate limit window only notifies once."""
    logger = logging.getLogger("test_rate_limit_logger")
    logger.setLevel(logging.INFO)
    logger.propagate = False
    
    from app.core.alerts import clear_alerts_cache
    from app.services.session_manager import SessionManager
    SessionManager._use_memory = True
    clear_alerts_cache()
    alert_handler = TelegramAlertHandler()
    alert_handler.setLevel(logging.ERROR)
    logger.addHandler(alert_handler)
    
    try:
        with patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock) as mock_send:
            # Log 5 identical errors (dynamic messages that normalize to the same string)
            for i in range(5):
                logger.error(f"Database connection dropped! Session ID: {1000 + i}")
            
            await asyncio_sleep_helper()
            
            # Should only alert once per config admin
            expected_admins = [admin_id for admin_id in ADMIN_IDS if admin_id > 0]
            assert mock_send.call_count == len(expected_admins)
    finally:
        logger.removeHandler(alert_handler)

async def asyncio_sleep_helper():
    # Helper to allow async loop tasks to execute
    await pytest.importorskip("asyncio").sleep(0.05)

def test_system_for_logger_attribution():
    """Logger names map to the named alert systems; unknown loggers fall back to Core API."""
    from app.core.alerts import system_for_logger
    assert system_for_logger("app.client") == "game_client"
    assert system_for_logger("app.services.solvency_service") == "treasury"
    assert system_for_logger("app.services.deposit_crawler") == "treasury"
    assert system_for_logger("app.api.v1.endpoints.wallet") == "treasury"
    assert system_for_logger("app.services.matchmaker") == "realtime"
    assert system_for_logger("app.api.v1.endpoints.users") == "core_api"

@pytest.mark.asyncio
async def test_send_admin_alert_names_the_system():
    """The alert header names the subsystem the error is attributed to."""
    with patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock) as mock_send:
        await send_admin_alert("Frontend crash report", system="game_client")
        expected_admins = [admin_id for admin_id in ADMIN_IDS if admin_id > 0]
        assert mock_send.call_count == len(expected_admins)
        for c in mock_send.call_args_list:
            assert "GAME CLIENT" in c[0][1]
            assert "🚨 <b>[SYSTEM ALERT]</b>" in c[0][1]

    with patch("app.services.telegram_bot.TelegramService.send_notification", new_callable=AsyncMock) as mock_send:
        await send_admin_alert("Backend error with no explicit system")
        for c in mock_send.call_args_list:
            assert "CORE API" in c[0][1]

def test_alert_metadata_never_leaks_db_credentials():
    """The metadata block must not contain any part of the DB password (a previous
    version leaked its length and 8 characters into every Telegram alert)."""
    from unittest.mock import MagicMock
    from app.core import alerts as alerts_module

    fake_settings = MagicMock()
    fake_settings.DATABASE_URL = "postgresql://dbuser:xHQEZsupersecretpasswordFIM@dbhost.internal:5432/railway"
    with patch("app.core.config.get_settings", return_value=fake_settings):
        metadata = alerts_module.get_alert_metadata()

    assert "xHQEZ" not in metadata
    assert "FIM" not in metadata
    assert "supersecret" not in metadata
    assert "PW" not in metadata
    # Non-sensitive identification stays
    assert "dbhost.internal" in metadata
    assert "railway" in metadata
