"""Safe gas grants for users who need TON to deposit USDT."""
import logging
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.transaction import Transaction
from app.models.user import User

logger = logging.getLogger(__name__)

GRANT_TX_TYPE = "gas_grant"
PROCESSING_STATUS = "processing_gas_grant"
PENDING_RECONCILIATION_STATUS = "pending_reconciliation"


class GasGrantDenied(Exception):
    """Raised when a grant request fails an eligibility gate."""

    def __init__(self, detail: str, status_code: int = 400):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _grant_reference(wallet_address: str, message_hash: str) -> str:
    return f"gas_grant:{wallet_address}:{message_hash}"


async def fetch_onchain_balances(address: str) -> tuple[int, int]:
    """Return native TON and USDT balances for an address from TonAPI."""
    try:
        from app.api.v1.endpoints.wallet import convert_ton_address_to_hex
        address = convert_ton_address_to_hex(address)
    except Exception:
        pass

    settings = get_settings()
    headers = {"Authorization": f"Bearer {settings.TON_API_KEY}"} if settings.TON_API_KEY else {}
    async with httpx.AsyncClient(timeout=10.0) as client:
        account_response = await client.get(f"https://tonapi.io/v2/accounts/{address}", headers=headers)
        if account_response.status_code != 200:
            raise ValueError(f"TonAPI account lookup failed: {account_response.status_code}")
        ton_nano = int(account_response.json().get("balance", 0))

        jetton_response = await client.get(
            f"https://tonapi.io/v2/accounts/{address}/jettons/{settings.USDT_MASTER}",
            headers=headers,
        )
        if jetton_response.status_code == 404:
            usdt_units = 0
        elif jetton_response.status_code != 200:
            raise ValueError(f"TonAPI jetton lookup failed: {jetton_response.status_code}")
        else:
            usdt_units = int(jetton_response.json().get("balance", 0))
    return ton_nano, usdt_units


async def _persist_grant_result(
    db: AsyncSession,
    transaction: Transaction,
    *,
    status: str,
    reference_id: str,
) -> bool:
    """Persist an external outcome without turning an unknown send into a retry."""
    transaction.status = status
    transaction.reference_id = reference_id
    try:
        await db.commit()
        return True
    except Exception:
        await db.rollback()
        logger.critical("Gas-grant result could not be persisted for transaction %s", transaction.id)
        return False


async def grant_gas(db: AsyncSession, telegram_id: int, wallet_address: str) -> dict:
    """Validate, reserve, and broadcast exactly one gas grant.

    The reservation is committed before the external call. A known failure is
    terminal and can be retried; an uncertain broadcast remains durable and
    blocks every retry until reconciliation.
    """
    settings = get_settings()
    if not settings.GAS_GRANT_ENABLED:
        raise GasGrantDenied("Gas grants are currently disabled.", status_code=503)
    if not settings.PAYOUT_MNEMONIC:
        raise GasGrantDenied("Gas grants are not available right now.", status_code=503)
    if not wallet_address:
        raise GasGrantDenied("Connect your wallet first, then request gas.")

    # Serialize duplicate requests for this account. The processing row below
    # remains visible after a process restart, so it is the retry boundary.
    user = (await db.execute(
        select(User).where(User.telegram_id == telegram_id).with_for_update()
    )).scalars().first()
    if user is None:
        raise GasGrantDenied("Your account could not be found. Please reopen the app.", status_code=404)

    cooldown_since = _now() - timedelta(days=settings.GAS_GRANT_COOLDOWN_DAYS)
    recent_result = await db.execute(
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
    if int(recent_result.scalar() or 0) > 0:
        raise GasGrantDenied(
            f"You already received a gas grant in the last {settings.GAS_GRANT_COOLDOWN_DAYS} days."
        )

    day_since = _now() - timedelta(hours=24)
    global_result = await db.execute(
        select(func.count(Transaction.id)).where(
            and_(
                Transaction.type == GRANT_TX_TYPE,
                Transaction.status != "failed",
                Transaction.created_at >= day_since,
            )
        )
    )
    if int(global_result.scalar() or 0) >= settings.GAS_GRANT_DAILY_GLOBAL_CAP:
        raise GasGrantDenied("The daily gas-grant pool is exhausted. Please try again tomorrow.", status_code=429)

    try:
        ton_nano, usdt_units = await fetch_onchain_balances(wallet_address)
    except Exception as exc:
        logger.warning("Gas grant on-chain check failed for %s: %s", wallet_address, exc)
        raise GasGrantDenied("Could not verify your wallet on-chain. Please try again shortly.", status_code=502)
    if usdt_units < settings.GAS_GRANT_MIN_USDT_UNITS:
        minimum_usdt = settings.GAS_GRANT_MIN_USDT_UNITS / 1_000_000
        raise GasGrantDenied(
            f"Gas grants are for wallets holding at least {minimum_usdt:.0f} USDT ready to deposit."
        )
    if ton_nano >= settings.GAS_GRANT_MAX_TON_BALANCE_NANO:
        raise GasGrantDenied("Your wallet already has enough TON to pay the deposit gas fee.")

    reservation = Transaction(
        user_id=telegram_id,
        type=GRANT_TX_TYPE,
        amount=0,
        fee=0,
        status=PROCESSING_STATUS,
        reference_id=_grant_reference(wallet_address, "pending"),
    )
    db.add(reservation)
    try:
        await db.commit()
        await db.refresh(reservation)
    except Exception:
        await db.rollback()
        raise

    from app.services.payout_service import BlockchainBroadcastError, execute_ton_transfer
    try:
        message_hash = await execute_ton_transfer(
            wallet_address,
            settings.GAS_GRANT_AMOUNT_NANOTON,
            comment="FinChess deposit gas grant",
        )
    except BlockchainBroadcastError as broadcast_error:
        message_hash = broadcast_error.msg_hash or "unknown"
        persisted = await _persist_grant_result(
            db,
            reservation,
            status=PENDING_RECONCILIATION_STATUS,
            reference_id=_grant_reference(wallet_address, message_hash),
        )
        if not persisted:
            logger.critical("Gas-grant uncertain broadcast has only its processing reservation: %s", reservation.id)
        logger.warning("Gas grant broadcast uncertain for %s: %s", wallet_address, broadcast_error)
        return {
            "status": PENDING_RECONCILIATION_STATUS,
            "amount_nanoton": settings.GAS_GRANT_AMOUNT_NANOTON,
            "message_hash": broadcast_error.msg_hash,
        }
    except Exception as exc:
        persisted = await _persist_grant_result(
            db,
            reservation,
            status="failed",
            reference_id=_grant_reference(wallet_address, "failed"),
        )
        if not persisted:
            raise GasGrantDenied(
                "Could not safely record the gas-grant failure. Please contact support before retrying.",
                status_code=503,
            )
        logger.error("Gas grant transfer failed for %s: %s", wallet_address, exc)
        raise GasGrantDenied("Could not send the gas grant. Please try again shortly.", status_code=502)

    persisted = await _persist_grant_result(
        db,
        reservation,
        status="completed",
        reference_id=_grant_reference(wallet_address, message_hash),
    )
    if not persisted:
        return {
            "status": PENDING_RECONCILIATION_STATUS,
            "amount_nanoton": settings.GAS_GRANT_AMOUNT_NANOTON,
            "message_hash": message_hash,
        }

    logger.info(
        "[TRANSACTION] user_id=%s | type=gas_grant | %s nanoTON to %s | msg_hash=%s",
        telegram_id,
        settings.GAS_GRANT_AMOUNT_NANOTON,
        wallet_address,
        message_hash,
    )
    return {
        "status": "sent",
        "amount_nanoton": settings.GAS_GRANT_AMOUNT_NANOTON,
        "message_hash": message_hash,
    }
