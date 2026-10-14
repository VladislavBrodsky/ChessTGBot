import pytest
from unittest.mock import MagicMock
from app.models.user import User
from app.api.v1.endpoints.admin import get_marketing_metrics

@pytest.mark.asyncio
async def test_get_marketing_metrics_payload():
    admin_user = User(telegram_id=99999, first_name="Admin")
    res = await get_marketing_metrics(_admin=admin_user)

    assert res["status"] == "success"
    assert "audit_period" in res
    assert "executive_summary" in res
    assert "scorecard" in res
    assert len(res["scorecard"]) >= 3
    assert "recent_posts" in res
    assert len(res["recent_posts"]) >= 5
    assert "growth_rules" in res
    assert len(res["growth_rules"]) >= 4
