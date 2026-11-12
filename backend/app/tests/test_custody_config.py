import os
import subprocess
import sys

import pytest


@pytest.mark.parametrize("address", ["", "not-a-ton-address"])
def test_production_rejects_missing_or_invalid_custody_address(address):
    env = {
        **os.environ,
        "ENV": "production",
        "TESTING": "false",
        "DATABASE_URL": "postgresql+asyncpg://localhost/test",
        "SECRET_KEY": "test-secret",
        "WEBHOOK_SECRET": "test-webhook-secret",
        "ADMIN_TELEGRAM_IDS": "999999",
        "MASTER_WALLET_ADDRESS": address,
    }
    result = subprocess.run(
        [sys.executable, "-c", "from app.core.config import get_settings; get_settings()"],
        env=env, capture_output=True, text=True, check=False,
    )
    assert result.returncode != 0
    assert "MASTER_WALLET_ADDRESS" in result.stderr
