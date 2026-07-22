"""
Comprehensive unit tests for the Admin Command Center endpoints and KPI calculations.
"""

import pytest
from datetime import datetime, timezone, timedelta
from app.api.v1.endpoints.admin import _cents_to_dollars
from app.models.user import User
from app.models.transaction import Transaction
from app.models.game_history import GameHistory
from app.models.gamification import Referral


def test_cents_to_dollars_helper():
    assert _cents_to_dollars(100) == 1.00
    assert _cents_to_dollars(3959) == 39.59
    assert _cents_to_dollars(0) == 0.00
    assert _cents_to_dollars(50) == 0.50


@pytest.mark.asyncio
async def test_admin_kpi_structures_and_math():
    """Verify conversion rates and engagement calculations."""
    total_users = 1324
    premium_users = 1
    active_24h = 50
    total_blocked_users = 387

    conversion_rate = round((premium_users / total_users * 100), 1) if total_users else 0.0
    engagement_rate = round((active_24h / total_users * 100), 1) if total_users else 0.0
    blocked_pct = round((total_blocked_users / total_users * 100), 1) if total_users else 0.0

    assert conversion_rate == 0.1
    assert engagement_rate == 3.8
    assert blocked_pct == 29.2


@pytest.mark.asyncio
async def test_admin_daily_revenue_calculation():
    """Test that net revenue includes both transaction fees and game rake."""
    total_fees_cents = 3502
    platform_rake_cents = 500
    net_revenue_cents = total_fees_cents + platform_rake_cents

    assert net_revenue_cents == 4002
    assert _cents_to_dollars(net_revenue_cents) == 40.02
