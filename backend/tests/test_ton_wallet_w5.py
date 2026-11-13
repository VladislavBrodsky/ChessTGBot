"""W5 (wallet v5r1) signing must match the reference SDK exactly.

fixtures/w5r1_vectors.json was produced by @ton/ton's WalletContractV5R1 and
@ton/core's external-message serializer for a fixed test key. On TON a message
is identified by its cell hash, so equal hashes mean the chain sees the same
transfer. Covers a first transfer from an undeployed wallet (state init
attached), a USDT jetton payout, and a bare transfer.
"""
import json
from pathlib import Path

import nacl.signing
import pytest
from httpx import Response
from tonsdk.boc import Cell

from app.services import payout_service
from app.services.ton_wallet_w5 import WalletV5R1, wallet_id

VECTORS = json.loads((Path(__file__).parent / "fixtures" / "w5r1_vectors.json").read_text())


@pytest.fixture(scope="module")
def wallet():
    seed = bytes.fromhex(VECTORS["seed_hex"])
    pub = bytes(nacl.signing.SigningKey(seed).verify_key)
    assert pub.hex() == VECTORS["public_key_hex"]
    return WalletV5R1(pub, seed + pub)


def test_mainnet_wallet_id_matches_reference():
    # @ton/ton default: networkGlobalId -239, client context wc 0, v5r1, subwallet 0
    assert wallet_id() == 2147483409


def test_address_matches_reference(wallet):
    assert wallet.address.to_string(True, True, False) == VECTORS["address"]


@pytest.mark.parametrize("case", VECTORS["cases"], ids=[c["name"] for c in VECTORS["cases"]])
def test_external_message_matches_reference(wallet, case):
    payload = Cell.one_from_boc(bytes.fromhex(case["payload_boc_hex"])) if case["payload_boc_hex"] else None
    msg = wallet.create_transfer_message(
        to_addr=case["to"], amount=int(case["value"]), seqno=case["seqno"],
        valid_until=case["timeout"], payload=payload, bounce=case["bounce"],
        send_mode=case["sendMode"],
    )
    assert msg.bytes_hash().hex() == case["external_hash_hex"]


class _Client:
    """Stands in for httpx.AsyncClient: serves canned TonAPI responses by URL."""

    def __init__(self, routes):
        self.routes = routes
        self.calls = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def get(self, url, headers=None):
        self.calls.append(url)
        for key, (status, body) in self.routes.items():
            if url.endswith(key):
                return Response(status, json=body)
        return Response(404, json={})


@pytest.mark.asyncio
@pytest.mark.parametrize("status", ["uninit", "nonexist"])
async def test_undeployed_master_wallet_uses_seqno_zero(monkeypatch, status):
    client = _Client({"/accounts/ADDR": (200, {"status": status})})
    monkeypatch.setattr(payout_service.httpx, "AsyncClient", lambda **kw: client)
    assert await payout_service._fetch_seqno("ADDR", {}) == 0
    assert not any("methods/seqno" in c for c in client.calls)


@pytest.mark.asyncio
async def test_active_master_wallet_reads_seqno(monkeypatch):
    client = _Client({
        "/accounts/ADDR": (200, {"status": "active"}),
        "/methods/seqno": (200, {"success": True, "decoded": {"state": 9}}),
    })
    monkeypatch.setattr(payout_service.httpx, "AsyncClient", lambda **kw: client)
    assert await payout_service._fetch_seqno("ADDR", {}) == 9


@pytest.mark.asyncio
async def test_unknown_account_state_never_defaults_to_zero(monkeypatch):
    client = _Client({"/accounts/ADDR": (500, {"error": "boom"})})
    monkeypatch.setattr(payout_service.httpx, "AsyncClient", lambda **kw: client)
    with pytest.raises(ValueError, match="failed to fetch seqno"):
        await payout_service._fetch_seqno("ADDR", {})
