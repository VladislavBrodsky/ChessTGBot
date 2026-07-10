"""
Solvency / reserve reconciliation.

The existing LedgerAuditService (ledger_audit.py) proves the ledger is
INTERNALLY consistent — each user's balance equals the sum of their completed
transactions. This service adds the dimension that internal consistency cannot
see: are the balances we owe users actually backed by real funds on-chain?

It produces a read-only report combining:
  • total platform liabilities   = Σ(user balances)          [what we owe users]
  • an aggregate ledger breakdown by transaction type         [where value moved]
  • the custody wallet's on-chain USDT balance                [what we actually hold]

IMPORTANT CAVEAT — multi-asset reserves:
Deposits may arrive in TON / USDC / BTC / ETH and are credited at their USD
value at deposit time, while withdrawals are paid in USDT from the same master
wallet. So the master wallet holds a BASKET of assets, but liabilities are
USD-denominated. The on-chain figure here counts USDT only. It is therefore a
floor indicator of USDT-denominated payout capacity — NOT total reserves. A
USDT balance below liabilities is worth investigating (can we actually cover
withdrawals?), but is not by itself proof of insolvency if other assets are
held. Because of this, the service is intentionally REPORT-ONLY: it does not
auto-alert. Validate the numbers via GET /admin/solvency before wiring alerts.
"""

import asyncio
import logging
from typing import Optional

from sqlalchemy import select, func

from app.models.user import User
from app.models.transaction import Transaction
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Transaction types that move value into or out of user balances. Mirrors
# ledger_audit.BALANCE_TYPES plus the platform-revenue types (fees/rake), which
# stay in custody rather than being owed back to users.
USER_BALANCE_TYPES = [
    "deposit", "withdrawal", "game_wager", "game_win",
    "refund", "game_refund", "subscription",
    "referral_commission", "subscription_commission",
    "deposit_reversal", "ledger_adjustment",
]
PLATFORM_REVENUE_TYPES = ["deposit_fee", "game_rake"]


class SolvencyService:
    @classmethod
    async def get_ledger_summary(cls, db) -> dict:
        """
        Pure-DB accounting summary (no external calls). Provably correct and safe
        to run anywhere.
        """
        # What we owe users right now.
        liab_res = await db.execute(select(func.coalesce(func.sum(User.balance), 0)))
        total_liabilities = int(liab_res.scalar() or 0)

        # Completed transactions aggregated by type.
        rows = await db.execute(
            select(
                Transaction.type,
                func.coalesce(func.sum(Transaction.amount), 0),
            )
            .where(Transaction.status == "completed")
            .group_by(Transaction.type)
        )
        by_type = {t: int(s or 0) for t, s in rows.all()}

        # Aggregate internal reconciliation: the sum of every completed
        # balance-affecting transaction must equal the sum of user balances.
        # (This is the aggregate form of ledger_audit's per-user check.)
        ledger_user_sum = sum(by_type.get(t, 0) for t in USER_BALANCE_TYPES)
        internal_reconciled = ledger_user_sum == total_liabilities

        # Platform revenue retained in custody (fees + rake), stored as negative
        # ledger amounts; report the positive magnitude.
        platform_revenue = -sum(by_type.get(t, 0) for t in PLATFORM_REVENUE_TYPES)

        return {
            "total_liabilities_cents": total_liabilities,
            "ledger_user_sum_cents": ledger_user_sum,
            "internal_reconciled": internal_reconciled,
            "internal_discrepancy_cents": total_liabilities - ledger_user_sum,
            "platform_revenue_cents": platform_revenue,
            "by_type_cents": by_type,
        }

    @classmethod
    async def get_onchain_usdt_cents(cls) -> tuple[Optional[int], Optional[str]]:
        """
        Best-effort fetch of the master (custody) wallet's on-chain USDT balance,
        returned in cents. Returns (cents, None) on success or (None, error) on
        failure — the caller should treat None as "unknown", never as zero.
        """
        settings = get_settings()
        if not settings.MASTER_WALLET_ADDRESS or not settings.USDT_MASTER:
            return None, "MASTER_WALLET_ADDRESS or USDT_MASTER not configured"

        import httpx

        headers = {}
        if settings.TON_API_KEY:
            headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"

        url = (
            f"https://tonapi.io/v2/accounts/{settings.MASTER_WALLET_ADDRESS}"
            f"/jettons/{settings.USDT_MASTER}"
        )
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code != 200:
                    return None, f"TonAPI returned {res.status_code}"
                data = res.json()
            # USDT has 6 decimals; balance is in raw units (10^6 per USDT).
            # 1 cent = 1/100 USDT = 10^4 raw units.
            raw_balance = int(data.get("balance", 0))
            return raw_balance // 10_000, None
        except Exception as e:  # noqa: BLE001 - network/parse errors are all "unknown"
            logger.warning(f"Failed to fetch on-chain USDT balance: {e}")
            return None, str(e)

    @classmethod
    async def get_master_ton_balance(cls) -> tuple[Optional[float], Optional[str]]:
        """
        Best-effort fetch of the master wallet's native TON balance (in TON), used
        for the gas-float guard. Returns (ton, None) on success or (None, error).
        """
        settings = get_settings()
        if not settings.MASTER_WALLET_ADDRESS:
            return None, "MASTER_WALLET_ADDRESS not configured"
        import httpx
        headers = {}
        if settings.TON_API_KEY:
            headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"
        url = f"https://tonapi.io/v2/accounts/{settings.MASTER_WALLET_ADDRESS}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code != 200:
                    return None, f"TonAPI returned {res.status_code}"
                data = res.json()
            nano = int(data.get("balance", 0))
            return nano / 1_000_000_000.0, None
        except Exception as e:  # noqa: BLE001
            logger.warning(f"Failed to fetch master TON balance: {e}")
            return None, str(e)

    @classmethod
    async def run_solvency_report(cls, db, include_onchain: bool = True) -> dict:
        """
        Full report: internal ledger summary + (optionally) the on-chain USDT
        custody balance and a USDT coverage ratio. Report-only; never raises for
        an on-chain fetch failure.
        """
        summary = await cls.get_ledger_summary(db)

        onchain_usdt_cents: Optional[int] = None
        onchain_error: Optional[str] = None
        usdt_coverage_ratio: Optional[float] = None
        usdt_surplus_deficit_cents: Optional[int] = None

        master_ton_balance: Optional[float] = None

        if include_onchain:
            onchain_usdt_cents, onchain_error = await cls.get_onchain_usdt_cents()
            if onchain_usdt_cents is not None:
                liabilities = summary["total_liabilities_cents"]
                usdt_surplus_deficit_cents = onchain_usdt_cents - liabilities
                usdt_coverage_ratio = (
                    round(onchain_usdt_cents / liabilities, 4) if liabilities > 0 else None
                )
            # Gas float — the native TON the master wallet needs to pay payout gas.
            master_ton_balance, _ = await cls.get_master_ton_balance()

        return {
            **summary,
            "onchain_usdt_cents": onchain_usdt_cents,
            "onchain_error": onchain_error,
            "usdt_coverage_ratio": usdt_coverage_ratio,
            "usdt_surplus_deficit_cents": usdt_surplus_deficit_cents,
            "master_ton_gas_balance": master_ton_balance,
            "onchain_note": (
                "onchain_usdt_cents counts USDT only. The custody wallet may also "
                "hold TON/USDC/BTC/ETH, so this is a floor indicator of "
                "USDT-denominated payout capacity, not total reserves. A value "
                "below total_liabilities warrants investigation but is not proof "
                "of insolvency on its own."
            ),
        }

    @staticmethod
    def evaluate_deficit_streak(
        report: dict,
        prev_streak: int,
        buffer_cents: int,
        sustained_checks: int,
    ) -> tuple[int, bool]:
        """
        Pure decision function for the alert loop. Given a solvency report and the
        prior consecutive-deficit streak, returns (new_streak, should_alert).

          • on-chain unknown  -> keep the streak unchanged, never alert
          • deficit <= buffer -> reset streak to 0, never alert
          • deficit >  buffer -> increment streak; alert once it reaches the
                                 sustained threshold
        """
        onchain = report.get("onchain_usdt_cents")
        if onchain is None:
            return prev_streak, False  # unknown: neither count nor reset

        deficit = report.get("total_liabilities_cents", 0) - onchain
        if deficit > buffer_cents:
            new_streak = prev_streak + 1
            return new_streak, new_streak >= sustained_checks
        return 0, False


async def start_solvency_alert_loop():
    """
    Background loop that alerts admins when USDT payout capacity falls short of
    liabilities for a SUSTAINED period.

    Safety properties (see the config knobs in core/config.py):
      • OFF unless SOLVENCY_ALERTS_ENABLED — validate GET /admin/solvency first.
      • A deficit must exceed SOLVENCY_DEFICIT_BUFFER_CENTS for
        SOLVENCY_SUSTAINED_CHECKS consecutive checks before alerting, so a
        transient dip (e.g. mid payout-batch) never fires it.
      • An unknown on-chain reading (TonAPI failure) is skipped, not treated as
        zero, and does not reset the streak — a flaky API neither alarms nor
        masks a real, building deficit.
      • Alerts go through the Redis rate limiter, so multiple workers collapse to
        one notification per window.
    """
    from app.core.database import AsyncSessionLocal

    settings = get_settings()
    if settings.TESTING or not settings.SOLVENCY_ALERTS_ENABLED:
        logger.info("Solvency alert loop disabled. Skipping.")
        return

    # Let startup settle (mirrors the ledger audit loop).
    await asyncio.sleep(30)
    logger.info("Solvency alert loop started.")

    consecutive_deficits = 0
    while True:
        try:
            async with AsyncSessionLocal() as db:
                report = await SolvencyService.run_solvency_report(db, include_onchain=True)

            consecutive_deficits, should_alert = SolvencyService.evaluate_deficit_streak(
                report,
                consecutive_deficits,
                settings.SOLVENCY_DEFICIT_BUFFER_CENTS,
                settings.SOLVENCY_SUSTAINED_CHECKS,
            )

            if report.get("onchain_usdt_cents") is None:
                logger.warning(
                    f"Solvency check: on-chain balance unavailable ({report.get('onchain_error')}). "
                    "Skipping this cycle."
                )
            elif should_alert:
                liabilities = report["total_liabilities_cents"]
                onchain = report["onchain_usdt_cents"]
                deficit = liabilities - onchain
                logger.warning(
                    f"Solvency check: sustained USDT deficit {deficit} cents "
                    f"(streak {consecutive_deficits}). Alerting."
                )
                from app.core.alerts import send_alert_with_redis_rate_limit
                alert_text = (
                    "🏦 <b>SOLVENCY WARNING: USDT payout capacity below liabilities</b>\n\n"
                    f"• <b>Owed to users (liabilities):</b> <code>${liabilities / 100:,.2f}</code>\n"
                    f"• <b>On-chain USDT (custody):</b> <code>${onchain / 100:,.2f}</code>\n"
                    f"• <b>Deficit:</b> <code>${deficit / 100:,.2f}</code>\n"
                    f"• <b>Sustained for:</b> {consecutive_deficits} consecutive checks\n\n"
                    "<i>Note: counts USDT only; the custody wallet may hold other assets. "
                    "Verify reserves and top up the payout wallet if withdrawals are at risk.</i>"
                )
                await send_alert_with_redis_rate_limit("solvency_deficit", alert_text, system="treasury")
        except Exception as e:
            logger.error(f"Error in solvency alert loop: {e}", exc_info=True)

        await asyncio.sleep(settings.SOLVENCY_CHECK_INTERVAL_SECONDS)


async def start_gas_float_alert_loop():
    """
    Background loop that warns admins BEFORE the master wallet's TON gas float
    runs dry. USDT payouts are jetton transfers that each spend ~0.05 TON; if the
    native TON balance depletes, withdrawals fail. (A failed payout already alerts
    via error logging and refunds the user — this is the proactive early warning.)

    Off unless GAS_FLOAT_ALERTS_ENABLED. A low reading fires a rate-limited alert;
    an unknown reading (TonAPI failure) is skipped, never treated as zero.
    """
    settings = get_settings()
    if settings.TESTING or not settings.GAS_FLOAT_ALERTS_ENABLED:
        logger.info("Gas-float alert loop disabled. Skipping.")
        return

    await asyncio.sleep(35)  # let startup settle
    logger.info("Gas-float alert loop started.")

    while True:
        try:
            ton_balance, err = await SolvencyService.get_master_ton_balance()
            if ton_balance is None:
                logger.warning(f"Gas-float check: master TON balance unavailable ({err}). Skipping.")
            elif ton_balance < settings.GAS_FLOAT_MIN_TON:
                logger.warning(
                    f"Gas-float check: master TON balance {ton_balance:.3f} below "
                    f"threshold {settings.GAS_FLOAT_MIN_TON}. Alerting."
                )
                from app.core.alerts import send_alert_with_redis_rate_limit
                alert_text = (
                    "⛽ <b>GAS FLOAT LOW: master wallet running out of TON</b>\n\n"
                    f"• <b>Master TON balance:</b> <code>{ton_balance:.3f} TON</code>\n"
                    f"• <b>Threshold:</b> <code>{settings.GAS_FLOAT_MIN_TON} TON</code>\n\n"
                    "<i>USDT payouts spend ~0.05 TON gas each. Top up the master wallet "
                    "with TON or withdrawals will start failing.</i>"
                )
                await send_alert_with_redis_rate_limit("gas_float_low", alert_text, system="treasury")
        except Exception as e:
            logger.error(f"Error in gas-float alert loop: {e}", exc_info=True)

        await asyncio.sleep(settings.GAS_FLOAT_CHECK_INTERVAL_SECONDS)
