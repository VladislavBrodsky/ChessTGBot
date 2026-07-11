"""
Sybil / account-farming detection helpers.

The farmable surface is the referral signup bonus (it mints real USDT
balance). The guards live in three places:
- gamification_service.process_referral refuses attribution when referrer
  and recruit signed up from the same IP;
- gamification_service.check_referral_game_milestone enforces the daily
  bonus cap and the real-games requirement;
- this module observes account-creation clusters and alerts Security when
  one IP mints several accounts within 24h (carrier NAT makes shared IPs
  normal, so clusters are alerted for review — not blocked).
"""
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.user import User

logger = logging.getLogger(__name__)


async def count_recent_signups_from_ip(db: AsyncSession, ip_hash: str, hours: int = 24) -> int:
    """How many accounts were created from this hashed IP in the last N hours."""
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=hours)
    res = await db.execute(
        select(func.count(User.id)).where(
            User.signup_ip_hash == ip_hash,
            User.created_at >= since,
        )
    )
    return int(res.scalar() or 0)


async def note_signup(db: AsyncSession, ip_hash: str) -> None:
    """Called after an account is auto-registered. Alerts Security (rate-limited
    per IP) when the 24h signup count from this IP reaches the threshold.
    Best-effort: never raises into the auth path.
    """
    if not ip_hash:
        return
    try:
        settings = get_settings()
        count = await count_recent_signups_from_ip(db, ip_hash)
        if count >= settings.SIGNUP_IP_CLUSTER_ALERT_THRESHOLD:
            logger.warning(f"Signup cluster: {count} accounts created from ip_hash={ip_hash[:12]}... in 24h")
            from app.core.alerts import send_alert_with_redis_rate_limit
            await send_alert_with_redis_rate_limit(
                f"signup_cluster:{ip_hash}",
                "👥 <b>Account-creation cluster detected</b>\n\n"
                f"• <b>Accounts in last 24h:</b> {count}\n"
                f"• <b>IP hash:</b> <code>{ip_hash[:16]}…</code>\n\n"
                "<i>Could be a shared network (carrier NAT) or an account farm. "
                "Referral bonuses from same-IP signups are already blocked; "
                "review the newest accounts if the count keeps climbing.</i>",
                system="security",
            )
    except Exception as e:
        logger.warning(f"Sybil signup-cluster check failed: {e}")
