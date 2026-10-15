import pytest
from app.models.user import User
from app.api.v1.endpoints.admin import get_marketing_metrics


@pytest.mark.asyncio
async def test_marketing_metrics_do_not_invent_reach_or_conversion():
    result = await get_marketing_metrics(_admin=User(telegram_id=99999, first_name="Admin"))
    assert result["status"] == "success"
    assert result["data_status"] == "unavailable"
    assert result["executive_summary"]["our_mini_app_funnel_ctr"] is None
    assert result["executive_summary"]["our_total_impressions"] is None
    assert result["scorecard"] == []
    assert result["recent_posts"] == []
