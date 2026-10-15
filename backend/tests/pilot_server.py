"""Production authentication/transport with external delivery stubbed in local tests."""
import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock

if os.getenv("PILOT_LOCAL_SERVER") != "1":
    raise RuntimeError("Only the isolated pilot test harness may start this server")
sys.path.insert(0, str(Path(__file__).parents[1]))
from app.services.telegram_bot import TelegramService
TelegramService.send_notification = AsyncMock()
from app.core import alerts
alerts.send_alert_with_redis_rate_limit = AsyncMock()
alerts.send_admin_alert = AsyncMock()
from app.main import app
import uvicorn
uvicorn.run(app, host="127.0.0.1", port=int(sys.argv[1]), lifespan="off", log_level="warning")
