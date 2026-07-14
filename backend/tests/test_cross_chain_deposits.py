import base64
import json

import httpx
import pytest
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa

from app.api.v1.endpoints import cross_chain
from app.core.config import get_settings
from app.models.cross_chain_deposit import CrossChainDeposit
from app.models.user import User
from app.services.changelly import ChangellyClient


@pytest.mark.asyncio
async def test_changelly_client_signs_the_exact_request_body():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_der = private_key.private_bytes(
        serialization.Encoding.DER,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    seen_methods = []

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["X-Api-Key"] == "test-api-key"
        private_key.public_key().verify(
            base64.b64decode(request.headers["X-Api-Signature"]),
            request.content,
            padding.PKCS1v15(),
            hashes.SHA256(),
        )
        body = json.loads(request.content)
        seen_methods.append(body["method"])
        if body["method"] == "getFixRateForAmount":
            result = [{"id": "rate-123", "amountFrom": "0.01", "amountTo": "50"}]
        elif body["method"] == "createFixTransaction":
            assert body["params"]["to"] == "usdton"
            assert body["params"]["extraId"] == "ref_7001"
            result = {"id": "order-123", "payinAddress": "bc1-test", "status": "new"}
        else:
            result = [{"id": "order-123", "status": "finished", "payoutHash": "ton-hash"}]
        return httpx.Response(200, json={"jsonrpc": "2.0", "id": body["id"], "result": result})

    client = ChangellyClient(
        api_key="test-api-key",
        private_key_hex=private_der.hex(),
        transport=httpx.MockTransport(handler),
    )
    quote = await client.fixed_quote("btc", "usdton", "0.01")
    order = await client.create_fixed_order(
        source="btc",
        destination="usdton",
        amount="0.01",
        rate_id=quote["id"],
        payout_address="ton-master",
        payout_extra_id="ref_7001",
        refund_address="bc1-refund",
    )
    status = await client.transaction(order["id"])

    assert quote["amountTo"] == "50"
    assert status["payoutHash"] == "ton-hash"
    assert seen_methods == ["getFixRateForAmount", "createFixTransaction", "getTransactions"]


class _Result:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class _FakeDb:
    def __init__(self, results):
        self.results = list(results)
        self.added = []

    async def execute(self, _statement):
        return _Result(self.results.pop(0))

    def add(self, value):
        self.added.append(value)

    async def commit(self):
        return None

    async def refresh(self, value):
        if value.id is None:
            value.id = 41


@pytest.mark.asyncio
async def test_order_always_pays_master_wallet_with_user_attribution(monkeypatch):
    captured = {}

    class Provider:
        async def create_fixed_order(self, **kwargs):
            captured.update(kwargs)
            return {
                "id": "provider-order",
                "payinAddress": "source-deposit-address",
                "payoutAddress": kwargs["payout_address"],
                "payoutExtraId": kwargs["payout_extra_id"],
                "amountExpectedFrom": "0.01",
                "amountExpectedTo": "49.5",
                "networkFee": "0.5",
                "status": "new",
            }

    monkeypatch.setattr(cross_chain, "_ensure_enabled", lambda: None)
    monkeypatch.setattr(cross_chain, "_client", lambda: Provider())
    db = _FakeDb([None])
    user = User(telegram_id=7001, first_name="Test", balance=0)

    response = await cross_chain.create_cross_chain_order(
        cross_chain.CreateOrderRequest(
            source_currency="btc",
            amount="0.01",
            rate_id="rate-123456",
            refund_address="bc1-refund-address",
        ),
        db=db,
        current_user=user,
    )

    settings = get_settings()
    assert captured["destination"] == "usdton"
    assert captured["payout_address"] == settings.MASTER_WALLET_ADDRESS
    assert captured["payout_extra_id"] == "ref_7001"
    assert response["credited"] is False
    assert isinstance(db.added[0], CrossChainDeposit)


@pytest.mark.asyncio
async def test_finished_provider_order_does_not_credit_without_onchain_transaction(monkeypatch):
    order = CrossChainDeposit(
        id=55,
        user_id=7001,
        provider="changelly",
        provider_order_id="provider-order",
        rate_id="rate-123456",
        source_currency="eth",
        source_amount="0.02",
        expected_usdt="50",
        network_fee_usdt="0.2",
        payin_address="0xsource",
        refund_address="0xrefund",
        status="waiting",
    )

    class Provider:
        async def transaction(self, _order_id):
            return {"status": "finished", "payoutHash": "ton-payout-hash"}

    monkeypatch.setattr(cross_chain, "_ensure_enabled", lambda: None)
    monkeypatch.setattr(cross_chain, "_client", lambda: Provider())
    db = _FakeDb([order, None])
    user = User(telegram_id=7001, first_name="Test", balance=0)

    response = await cross_chain.cross_chain_order_status(55, db=db, current_user=user)

    assert response["status"] == "finished"
    assert response["payout_hash"] == "ton-payout-hash"
    assert response["credited"] is False
    assert user.balance == 0
