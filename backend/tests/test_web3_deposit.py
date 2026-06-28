import pytest
import hmac
import hashlib
import json
import time
import httpx
from urllib.parse import quote
from app.models.user import User
from app.models.transaction import Transaction
from app.crud import user as user_crud
from app.api.v1.endpoints.wallet import (
    convert_ton_address_to_hex,
    convert_raw_to_friendly,
    crc16
)
from sqlalchemy.future import select

# Address conversion unit tests
def test_address_converters():
    # USDT Master friendly address
    friendly = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
    raw = "0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe"
    
    assert convert_ton_address_to_hex(friendly) == raw
    assert convert_raw_to_friendly(raw) == friendly

    # Test invalid base64 length or letters
    with pytest.raises(ValueError):
        convert_ton_address_to_hex("invalid_address")


@pytest.mark.asyncio
async def test_web3_deposit_endpoints(client, db_session, monkeypatch):
    # Setup test user
    telegram_id = 999111222
    user = await user_crud.create_user(db_session, telegram_id, "Web3Player")
    user.balance = 500  # $5.00
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Auth Mocking
    from app.core.config import get_settings
    settings = get_settings()
    original_token = settings.TELEGRAM_BOT_TOKEN
    settings.TELEGRAM_BOT_TOKEN = "123456789:test_token"

    user_str = json.dumps({"id": telegram_id, "first_name": "Web3Player"})
    auth_date = str(int(time.time()))
    check_list = [f"auth_date={auth_date}", f"user={user_str}"]
    data_check_string = "\n".join(check_list)
    secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    init_data = f"auth_date={quote(auth_date)}&user={quote(user_str)}&hash={calculated_hash}"
    headers = {"X-Telegram-Init-Data": init_data}

    try:
        # Mock TonAPI prices query
        async def mock_fetch_all_prices():
            return {
                "TON": 5.00,
                "USDT": 1.00,
                "USDC": 1.00,
                "BTC": 60000.00,
                "ETH": 30000.00
            }
        import app.api.v1.endpoints.wallet as wallet_module
        monkeypatch.setattr(wallet_module, "fetch_all_prices", mock_fetch_all_prices)

        # 1. Test GET /prices
        res_prices = await client.get("/api/v1/wallet/prices", headers=headers)
        assert res_prices.status_code == 200
        prices_data = res_prices.json()
        assert prices_data["TON"] == 5.00
        assert prices_data["USDT"] == 1.00

        # 2. Test GET /jetton-wallet mock
        class MockResponse:
            def __init__(self, status_code, json_data):
                self.status_code = status_code
                self.json_data = json_data
            def json(self):
                return self.json_data

        original_get = httpx.AsyncClient.get

        async def mock_get(self, url, **kwargs):
            url_str = str(url)
            if "tonapi.io" not in url_str:
                return await original_get(self, url, **kwargs)
            url_str = str(url)
            if "jettons" in url_str:
                return MockResponse(200, {
                    "wallet_address": {
                        "address": "0:c3be92349a44b732b39708915ce4f7a56ec58e9b57ef0da1515b6213c7deaf83"
                    }
                })
            elif "events" in url_str:
                # Mock a native TON transfer event
                if "msg_ton_hash" in url_str:
                    return MockResponse(200, {
                        "event_id": "msg_ton_hash",
                        "actions": [{
                            "type": "TonTransfer",
                            "status": "ok",
                            "TonTransfer": {
                                "sender": {"address": "0:sender_address"},
                                "recipient": {"address": convert_ton_address_to_hex(settings.MASTER_WALLET_ADDRESS)},
                                "amount": 2000000000,  # 2.0 TON
                                "comment": f"ref_{telegram_id}"
                            }
                        }]
                    })
                # Mock a USDT jetton transfer event
                elif "msg_usdt_hash" in url_str:
                    return MockResponse(200, {
                        "event_id": "msg_usdt_hash",
                        "actions": [{
                            "type": "JettonTransfer",
                            "status": "ok",
                            "JettonTransfer": {
                                "sender": {"address": "0:sender_address"},
                                "recipient": {"address": convert_ton_address_to_hex(settings.MASTER_WALLET_ADDRESS)},
                                "amount": 10000000,  # 10.0 USDT
                                "comment": f"ref_{telegram_id}",
                                "jetton": {
                                    "address": settings.USDT_MASTER,
                                    "symbol": "USDT",
                                    "decimals": 6
                                }
                            }
                        }]
                    })
                # Mock a low-value USDT jetton transfer event (0.01 USDT)
                elif "msg_low_usdt_hash" in url_str:
                    return MockResponse(200, {
                        "event_id": "msg_low_usdt_hash",
                        "actions": [{
                            "type": "JettonTransfer",
                            "status": "ok",
                            "JettonTransfer": {
                                "sender": {"address": "0:sender_address"},
                                "recipient": {"address": convert_ton_address_to_hex(settings.MASTER_WALLET_ADDRESS)},
                                "amount": 10000,  # 0.01 USDT
                                "comment": f"ref_{telegram_id}",
                                "jetton": {
                                    "address": settings.USDT_MASTER,
                                    "symbol": "USDT",
                                    "decimals": 6
                                }
                            }
                        }]
                    })
                # Mock resolved transaction event
                elif "msg_usdt_hash_resolved" in url_str:
                    return MockResponse(200, {
                        "event_id": "msg_usdt_hash_resolved",
                        "actions": [{
                            "type": "JettonTransfer",
                            "status": "ok",
                            "JettonTransfer": {
                                "sender": {"address": "0:sender_address"},
                                "recipient": {"address": convert_ton_address_to_hex(settings.MASTER_WALLET_ADDRESS)},
                                "amount": 10000000,  # 10.0 USDT
                                "comment": f"ref_{telegram_id}",
                                "jetton": {
                                    "address": settings.USDT_MASTER,
                                    "symbol": "USDT",
                                    "decimals": 6
                                }
                            }
                        }]
                    })
            elif "blockchain/messages" in url_str:
                if "msg_resolvable_hash" in url_str:
                    return MockResponse(200, {
                        "hash": "msg_usdt_hash_resolved"
                    })
            return MockResponse(404, {})

        monkeypatch.setattr(httpx.AsyncClient, "get", mock_get)

        # Query jetton-wallet
        res_jw = await client.get(
            f"/api/v1/wallet/jetton-wallet?user_address={settings.MASTER_WALLET_ADDRESS}&jetton_master={settings.USDT_MASTER}",
            headers=headers
        )
        assert res_jw.status_code == 200
        jw_data = res_jw.json()
        assert "jetton_wallet_address" in jw_data

        # 3. Test Verify TON Deposit
        res_v_ton = await client.post(
            "/api/v1/wallet/deposit/verify",
            json={"message_hash": "msg_ton_hash"},
            headers=headers
        )
        assert res_v_ton.status_code == 200
        v_ton_data = res_v_ton.json()
        # 2 TON * $5.00 = $10.00 = 1000 cents. Under new top-up fee math: 1000 / 1.05 = 952 cents credited.
        assert v_ton_data["credited_amount"] == 952
        assert v_ton_data["new_balance"] == 1452 # 500 + 952

        # Verify DB Transactions were written
        tx_res = await db_session.execute(
            select(Transaction).filter(Transaction.reference_id == "msg_ton_hash")
        )
        tx = tx_res.scalars().first()
        assert tx is not None
        assert tx.amount == 952
        assert tx.type == "deposit"

        # 4. Test Replay Protection
        res_replay = await client.post(
            "/api/v1/wallet/deposit/verify",
            json={"message_hash": "msg_ton_hash"},
            headers=headers
        )
        assert res_replay.status_code == 400
        assert "already processed" in res_replay.json()["detail"].lower()

        # 5. Test Verify USDT Jetton Deposit
        res_v_usdt = await client.post(
            "/api/v1/wallet/deposit/verify",
            json={"message_hash": "msg_usdt_hash"},
            headers=headers
        )
        assert res_v_usdt.status_code == 200
        v_usdt_data = res_v_usdt.json()
        # 10 USDT * $1.00 = $10.00 = 1000 cents. Under new top-up fee math: 1000 / 1.05 = 952 cents.
        assert v_usdt_data["credited_amount"] == 952
        assert v_usdt_data["new_balance"] == 2404 # 1452 + 952

        # 6. Test Verify Low-Value USDT Jetton Deposit (0.01 USDT)
        res_v_low_usdt = await client.post(
            "/api/v1/wallet/deposit/verify",
            json={"message_hash": "msg_low_usdt_hash"},
            headers=headers
        )
        assert res_v_low_usdt.status_code == 200
        v_low_usdt_data = res_v_low_usdt.json()
        # 0.01 USDT = 1 cent. Under new top-up fee math: round(1 / 1.05) = 1 cent.
        assert v_low_usdt_data["credited_amount"] == 1
        assert v_low_usdt_data["new_balance"] == 2405 # 2404 + 1

        # 7. Test Verify via Resolvable Message Hash (Resolves to transaction hash then event)
        res_v_resolved = await client.post(
            "/api/v1/wallet/deposit/verify",
            json={"message_hash": "msg_resolvable_hash"},
            headers=headers
        )
        assert res_v_resolved.status_code == 200
        v_resolved_data = res_v_resolved.json()
        assert v_resolved_data["credited_amount"] == 952
        assert v_resolved_data["new_balance"] == 3357 # 2405 + 952

    finally:
        settings.TELEGRAM_BOT_TOKEN = original_token
