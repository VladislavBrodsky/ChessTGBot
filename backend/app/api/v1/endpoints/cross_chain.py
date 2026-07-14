from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user, rate_limit
from app.core.config import get_settings
from app.core.database import get_db
from app.models.cross_chain_deposit import CrossChainDeposit
from app.models.transaction import Transaction
from app.models.user import User
from app.services.changelly import ChangellyClient, ChangellyError


router = APIRouter()
logger = logging.getLogger(__name__)

SUPPORTED_SOURCES = {
    "btc": {"symbol": "BTC", "name": "Bitcoin", "network": "Bitcoin"},
    "eth": {"symbol": "ETH", "name": "Ethereum", "network": "Ethereum"},
}
TERMINAL_PROVIDER_STATUSES = {"finished", "failed", "refunded", "expired", "overdue"}


class QuoteRequest(BaseModel):
    source_currency: str
    amount: Decimal = Field(gt=0, max_digits=36, decimal_places=18)

    @field_validator("source_currency")
    @classmethod
    def validate_source(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in SUPPORTED_SOURCES:
            raise ValueError("Unsupported source currency")
        return normalized


class CreateOrderRequest(QuoteRequest):
    rate_id: str = Field(min_length=8, max_length=256)
    refund_address: str = Field(min_length=8, max_length=512)


def _client() -> ChangellyClient:
    settings = get_settings()
    return ChangellyClient(
        api_key=settings.CHANGELLY_API_KEY,
        private_key_hex=settings.CHANGELLY_PRIVATE_KEY_HEX,
        base_url=settings.CHANGELLY_API_URL,
    )


def _ensure_enabled() -> None:
    settings = get_settings()
    if not (
        settings.CROSS_CHAIN_DEPOSITS_ENABLED
        and settings.CHANGELLY_API_KEY
        and settings.CHANGELLY_PRIVATE_KEY_HEX
    ):
        raise HTTPException(status_code=503, detail="Cross-chain deposits are not enabled")


def _decimal_string(value: Decimal | str | int | float) -> str:
    try:
        decimal = Decimal(str(value))
    except InvalidOperation as exc:
        raise HTTPException(status_code=502, detail="Provider returned an invalid amount") from exc
    return format(decimal, "f")


def _parse_pay_till(value: object) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if parsed.tzinfo:
            parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed
    except ValueError:
        return None


def _public_order(order: CrossChainDeposit, *, credited_amount_cents: int | None = None) -> dict:
    return {
        "id": order.id,
        "provider": order.provider,
        "provider_order_id": order.provider_order_id,
        "source_currency": order.source_currency,
        "source_amount": order.source_amount,
        "expected_usdt": order.expected_usdt,
        "network_fee_usdt": order.network_fee_usdt,
        "payin_address": order.payin_address,
        "payin_extra_id": order.payin_extra_id,
        "status": order.status,
        "payout_hash": order.payout_hash,
        "pay_till": order.pay_till,
        "credited": credited_amount_cents is not None,
        "credited_amount_cents": credited_amount_cents,
    }


@router.get("/cross-chain/assets")
async def cross_chain_assets(current_user: User = Depends(get_current_user)):
    del current_user
    settings = get_settings()
    enabled = bool(
        settings.CROSS_CHAIN_DEPOSITS_ENABLED
        and settings.CHANGELLY_API_KEY
        and settings.CHANGELLY_PRIVATE_KEY_HEX
    )
    return {
        "enabled": enabled,
        "provider": "Changelly" if enabled else None,
        "settlement_asset": "USDT",
        "settlement_network": "TON",
        "assets": list(SUPPORTED_SOURCES.values()) if enabled else [],
    }


@router.post("/cross-chain/quote", dependencies=[Depends(rate_limit(limit=10, window=60))])
async def cross_chain_quote(
    payload: QuoteRequest,
    current_user: User = Depends(get_current_user),
):
    del current_user
    _ensure_enabled()
    settings = get_settings()
    try:
        quote = await _client().fixed_quote(
            payload.source_currency,
            settings.CHANGELLY_PAYOUT_CURRENCY,
            _decimal_string(payload.amount),
        )
    except ChangellyError as exc:
        logger.warning("Cross-chain quote failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    amount_to = Decimal(_decimal_string(quote.get("amountTo", "0")))
    network_fee = Decimal(_decimal_string(quote.get("networkFee", "0")))
    estimated_payout = max(amount_to - network_fee, Decimal("0"))
    estimated_credit = (estimated_payout / Decimal("1.05")).quantize(Decimal("0.000001"))
    return {
        "rate_id": str(quote.get("id") or ""),
        "source_currency": payload.source_currency,
        "amount_from": _decimal_string(quote.get("amountFrom", payload.amount)),
        "amount_to_usdt": _decimal_string(amount_to),
        "estimated_credit_usdt": _decimal_string(estimated_credit),
        "network_fee_usdt": _decimal_string(network_fee),
        "min_from": _decimal_string(quote.get("minFrom", quote.get("min", "0"))),
        "max_from": _decimal_string(quote.get("maxFrom", quote.get("max", "0"))),
        "expires_at": quote.get("expiredAt"),
        "provider": "Changelly",
    }


@router.post("/cross-chain/orders", dependencies=[Depends(rate_limit(limit=3, window=60))])
async def create_cross_chain_order(
    payload: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_enabled()
    settings = get_settings()
    attribution_memo = f"ref_{current_user.telegram_id}"
    try:
        result = await _client().create_fixed_order(
            source=payload.source_currency,
            destination=settings.CHANGELLY_PAYOUT_CURRENCY,
            amount=_decimal_string(payload.amount),
            rate_id=payload.rate_id,
            payout_address=settings.MASTER_WALLET_ADDRESS,
            payout_extra_id=attribution_memo,
            refund_address=payload.refund_address.strip(),
        )
    except ChangellyError as exc:
        logger.warning(
            "Cross-chain order creation failed for user_id=%s: %s",
            current_user.telegram_id,
            exc,
        )
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    provider_order_id = str(result.get("id") or "")
    payin_address = str(result.get("payinAddress") or "")
    if not provider_order_id or not payin_address:
        raise HTTPException(status_code=502, detail="Provider returned an incomplete order")
    if str(result.get("payoutAddress") or "") != settings.MASTER_WALLET_ADDRESS:
        raise HTTPException(status_code=502, detail="Provider did not confirm the configured payout wallet")
    if str(result.get("payoutExtraId") or "") != attribution_memo:
        raise HTTPException(status_code=502, detail="Provider did not confirm the required deposit attribution memo")

    existing = await db.execute(
        select(CrossChainDeposit).where(
            CrossChainDeposit.provider == "changelly",
            CrossChainDeposit.provider_order_id == provider_order_id,
        )
    )
    order = existing.scalar_one_or_none()
    if order is None:
        order = CrossChainDeposit(
            user_id=current_user.telegram_id,
            provider="changelly",
            provider_order_id=provider_order_id,
            rate_id=payload.rate_id,
            source_currency=payload.source_currency,
            source_amount=_decimal_string(result.get("amountExpectedFrom", payload.amount)),
            expected_usdt=_decimal_string(result.get("amountExpectedTo", "0")),
            network_fee_usdt=_decimal_string(result.get("networkFee", "0")),
            payin_address=payin_address,
            payin_extra_id=(str(result.get("payinExtraId")) if result.get("payinExtraId") else None),
            refund_address=payload.refund_address.strip(),
            status=str(result.get("status") or "waiting").lower(),
            pay_till=_parse_pay_till(result.get("payTill")),
        )
        db.add(order)
        await db.commit()
        await db.refresh(order)
    return _public_order(order)


@router.get("/cross-chain/orders/{order_id}", dependencies=[Depends(rate_limit(limit=30, window=60))])
async def cross_chain_order_status(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_enabled()
    result = await db.execute(
        select(CrossChainDeposit).where(
            CrossChainDeposit.id == order_id,
            CrossChainDeposit.user_id == current_user.telegram_id,
        )
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Cross-chain deposit order not found")

    if order.status not in TERMINAL_PROVIDER_STATUSES:
        try:
            provider_tx = await _client().transaction(order.provider_order_id)
        except ChangellyError as exc:
            logger.warning("Cross-chain status refresh failed for order_id=%s: %s", order.id, exc)
            provider_tx = None
        if provider_tx:
            order.status = str(provider_tx.get("status") or order.status).lower()
            payout_hash = provider_tx.get("payoutHash")
            if payout_hash:
                order.payout_hash = str(payout_hash)
            await db.commit()
            await db.refresh(order)

    credited_amount_cents = None
    if order.payout_hash:
        credit_result = await db.execute(
            select(Transaction).where(
                Transaction.user_id == current_user.telegram_id,
                Transaction.type == "deposit",
                Transaction.status == "completed",
                Transaction.reference_id == order.payout_hash,
            )
        )
        credit = credit_result.scalar_one_or_none()
        if credit is not None:
            credited_amount_cents = credit.amount

    return _public_order(order, credited_amount_cents=credited_amount_cents)
