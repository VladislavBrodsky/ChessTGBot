"""
Gas grants — the deposit "gas wall" fix.

USDT on TON is a jetton: transferring it costs native TON gas. A user whose
wallet holds USDT but zero TON physically cannot deposit, and there was no
in-app way out. On request the platform sends a small TON splash from the
master wallet so they can complete the deposit.

Anti-abuse gates (a grant costs the platform real TON):
- on-chain proof via TonAPI: the wallet must actually hold at least
  GAS_GRANT_MIN_USDT_UNITS of USDT and have less than
  GAS_GRANT_MAX_TON_BALANCE_NANO of TON;
- one grant per user AND per wallet address per GAS_GRANT_COOLDOWN_DAYS;
- a global cap of GAS_GRANT_DAILY_GLOBAL_CAP grants per rolling 24h;
- grants are recorded as amount=0 ledger transactions (platform balance is
  untouched; the cost is on-chain gas float, already monitored by the
  gas-float alert loop).
"""
import logging
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)

GRANT_TX_TYPE = "gas_grant"


class GasGrantDenied(Exception):
    """Raised when a grant request fails an eligibility gate. .detail is user-facing."""
    def __init__(self, detail: str, status_code: int = 400):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def fetch_onchain_balances(address: str) -> tuple[int, int]:
    """Returns (ton_balance_nanoton, usdt_balance_units) for an address via
    TonAPI. Public chain data; raises on connectivity failure.
    """
    try:
        from app.api.v1.endpoints.wallet import convert_ton_address_to_hex
        address = convert_ton_address_to_hex(address)
    except Exception:
        pass

    settings = get_settings()
    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"

    async with httpx.AsyncClient(timeout=10.0) as client:
        res_acc = await client.get(f"https://tonapi.io/v2/accounts/{address}", headers=headers)
        if res_acc.status_code != 200:
            raise ValueError(f"TonAPI account lookup failed: {res_acc.status_code}")
        ton_nano = int(res_acc.json().get("balance", 0))

        res_jet = await client.get(
            f"https://tonapi.io/v2/accounts/{address}/jettons/{settings.USDT_MASTER}",
            headers=headers,
        )
        if res_jet.status_code == 404:
            usdt_units = 0          # no USDT jetton wallet at all
        elif res_jet.status_code != 200:
            raise ValueError(f"TonAPI jetton lookup failed: {res_jet.status_code}")
        else:
            usdt_units = int(res_jet.json().get("balance", 0))

    return ton_nano, usdt_units


async def grant_gas(db: AsyncSession, telegram_id: int, wallet_address: str) -> dict:
    """Validates every eligibility gate and, if all pass, sends the TON splash.
    Raises GasGrantDenied with a user-facing reason on any gate failure.
    """
    settings = get_settings()

    if not settings.GAS_GRANT_ENABLED:
        raise GasGrantDenied("Gas grants are currently disabled.", status_code=503)
    if not settings.PAYOUT_MNEMONIC:
        raise GasGrantDenied("Gas grants are not available right now.", status_code=503)
    if not wallet_address:
        raise GasGrantDenied("Connect your wallet first, then request gas.")

    # Per-user and per-wallet cooldown.
    cooldown_since = _now() - timedelta(days=settings.GAS_GRANT_COOLDOWN_DAYS)
    recent_res = await db.execute(
        select(func.count(Transaction.id)).where(
            and_(
                Transaction.type == GRANT_TX_TYPE,
                Transaction.status != "failed",
                Transaction.created_at >= cooldown_since,
                or_(
                    Transaction.user_id == telegram_id,
                    Transaction.reference_id.like(f"gas_grant:{wallet_address}:%"),
                ),
            )
        )
    )
    if int(recent_res.scalar() or 0) > 0:
        raise GasGrantDenied(
            f"You already received a gas grant in the last {settings.GAS_GRANT_COOLDOWN_DAYS} days."
        )

    # Global daily cap bounds the worst-case cost of coordinated abuse.
    day_since = _now() - timedelta(hours=24)
    global_res = await db.execute(
        select(func.count(Transaction.id)).where(
            and_(
                Transaction.type == GRANT_TX_TYPE,
                Transaction.status != "failed",
                Transaction.created_at >= day_since,
            )
        )
    )
    if int(global_res.scalar() or 0) >= settings.GAS_GRANT_DAILY_GLOBAL_CAP:
        raise GasGrantDenied("The daily gas-grant pool is exhausted. Please try again tomorrow.", status_code=429)

    # On-chain proof: really holds USDT, really lacks gas.
    try:
        ton_nano, usdt_units = await fetch_onchain_balances(wallet_address)
    except Exception as e:
        logger.warning(f"Gas grant on-chain check failed for {wallet_address}: {e}")
        raise GasGrantDenied("Could not verify your wallet on-chain. Please try again shortly.", status_code=502)

    if usdt_units < settings.GAS_GRANT_MIN_USDT_UNITS:
        min_usdt = settings.GAS_GRANT_MIN_USDT_UNITS / 1_000_000
        raise GasGrantDenied(
            f"Gas grants are for wallets holding at least {min_usdt:.0f} USDT ready to deposit."
        )
    if ton_nano >= settings.GAS_GRANT_MAX_TON_BALANCE_NANO:
        raise GasGrantDenied("Your wallet already has enough TON to pay the deposit gas fee.")

    # All gates passed — send the splash.
    from app.services.payout_service import execute_ton_transfer, BlockchainBroadcastError
    try:
        msg_hash = await execute_ton_transfer(
            wallet_address, settings.GAS_GRANT_AMOUNT_NANOTON, comment="FinChess deposit gas grant"
        )
    except BlockchainBroadcastError as broadcast_err:
        # May have gone through — record it so the cooldown still applies.
        msg_hash = broadcast_err.msg_hash
        logger.warning(f"Gas grant broadcast uncertain for {wallet_address}: {broadcast_err}")
    except Exception as e:
        logger.error(f"Gas grant transfer failed for {wallet_address}: {e}")
        raise GasGrantDenied("Could not send the gas grant. Please try again shortly.", status_code=502)

    tx = Transaction(
        user_id=telegram_id,
        type=GRANT_TX_TYPE,
        amount=0,               # platform balance untouched — cost is on-chain gas float
        fee=0,
        status="completed",
        reference_id=f"gas_grant:{wallet_address}:{msg_hash}",
    )
    db.add(tx)
    await db.commit()
    logger.info(
        f"[TRANSACTION] user_id={telegram_id} | type=gas_grant | "
        f"{settings.GAS_GRANT_AMOUNT_NANOTON} nanoTON to {wallet_address} | msg_hash={msg_hash}"
    )

    return {
        "status": "sent",
        "amount_nanoton": settings.GAS_GRANT_AMOUNT_NANOTON,
        "message_hash": msg_hash,
    }
