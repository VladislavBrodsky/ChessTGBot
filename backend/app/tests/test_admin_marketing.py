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
    assert len(res["scorecard"]) == 4
    # All scorecard items must be our own verified platform channels
    verified_handles = {"@defi_ambassador", "@chess_hub", "web3chess.online", "@chess_matbot"}
    scorecard_handles = {ch["handle"] for ch in res["scorecard"]}
    assert scorecard_handles == verified_handles
    for ch in res["scorecard"]:
        assert ch["is_own"] is True

    assert "competitor_benchmark" in res
    assert res["competitor_benchmark"]["competitor_posts"] == 655

    assert "recent_posts" in res
    posts = res["recent_posts"]
    assert len(posts) >= 20

    # Ensure no duplicate copy-pasted stats across posts
    impressions_set = set(p["impressions"] for p in posts)
    assert len(impressions_set) >= 10, "Post impressions must not be identical copy-paste values"

    # Verify mathematical accuracy of engagement rates
    for p in posts:
        expected_rate = f"{(p['engagements'] / p['impressions'] * 100):.2f}%"
        assert p["rate"] == expected_rate, f"Rate mismatch for post {p['id']}: expected {expected_rate}, got {p['rate']}"

    assert "growth_rules" in res
    assert len(res["growth_rules"]) >= 4

