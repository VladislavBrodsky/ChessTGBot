import pytest
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

    assert "recent_posts" in res
    posts = res["recent_posts"]
    assert len(posts) >= 20

    # The legacy benchmark now describes our verified publishing corpus. Its
    # totals must follow that corpus rather than a historical competitor count.
    benchmark = res["competitor_benchmark"]
    summary = res["executive_summary"]
    assert benchmark["competitor_posts"] == len(posts)
    assert summary["our_published_assets"] == len(posts)
    assert summary["total_posts_monitored"] == len(posts)
    total_impressions = sum(post["impressions"] for post in posts)
    total_engagements = sum(post["engagements"] for post in posts)
    assert summary["our_total_impressions"] == total_impressions
    assert benchmark["competitor_median_rate"] == f"{total_engagements / total_impressions * 100:.2f}%"
    assert benchmark["ecosystem_views"] == sum(channel["impressions"] for channel in res["scorecard"])
    assert res["publishing_standards"]["verified_channels"] == len(res["scorecard"])

    # Ensure no duplicate copy-pasted stats across posts
    impressions_set = set(p["impressions"] for p in posts)
    assert len(impressions_set) >= 10, "Post impressions must not be identical copy-paste values"

    # Verify mathematical accuracy of engagement rates
    for p in posts:
        expected_rate = f"{(p['engagements'] / p['impressions'] * 100):.2f}%"
        assert p["rate"] == expected_rate, f"Rate mismatch for post {p['id']}: expected {expected_rate}, got {p['rate']}"

    assert "growth_rules" in res
    assert len(res["growth_rules"]) >= 4

