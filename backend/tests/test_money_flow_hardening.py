"""Regression tests for the 2026-10-30 money-flow audit.

Each block pins one defect: payouts judged by any action instead of the USDT
transfer, double refunds of matchmaking stakes, deposits credited from a
spoofable label or an unfinished trace, deposits missed beyond the latest 25
events, webhook credits keyed differently from verify/crawler, ledger audit
false alarms, and concurrent payouts signing the same seqno.
"""
import asyncio
import json
from types import SimpleNamespace

import pytest
from httpx import Response
from sqlalchemy import select, update
from starlette.requests import Request

from app.core.config import get_settings
from app.models.transaction import Transaction
from app.models.user import User

settings = get_settings()
MASTER_JW = "0:c3be92349a44b732b39708915ce4f7a56ec58e9b57ef0da1515b6213c7deaf83"
USER_WALLET = "0:028af26a1ec3ba" + "0" * 50


def _master_raw():
    from app.api.v1.endpoints.wallet import convert_ton_address_to_hex
    return convert_ton_address_to_hex(settings.MASTER_WALLET_ADDRESS)


# --- withdrawal crawler verdicts --------------------------------------------

def _jetton(status, amount, sender=None, jetton=None):
    return {"type": "JettonTransfer", "status": status, "JettonTransfer": {
        "sender": {"address": sender or _master_raw()},
        "recipient": {"address": USER_WALLET},
        "amount": str(amount),
        "jetton": {"address": jetton or settings.USDT_MASTER},
    }}


EXPECTED = 980 * 10_000  # $10 withdrawal minus $0.20 fee, in USDT units


@pytest.mark.parametrize("actions, verdict", [
    # USDT delivered; only the notification to a contract recipient failed
    ([_jetton("ok", EXPECTED), {"type": "SmartContractExec", "status": "failed"}], "completed"),
    # the jetton transfer itself failed: tokens never left (the July 8/9 case)
    ([_jetton("failed", EXPECTED)], "failed"),
    # ignore-errors skipped the send: nothing moved, but nothing failed either
    ([{"type": "TonTransfer", "status": "ok", "TonTransfer": {}}], "unresolved"),
    ([], "unresolved"),
    # right shape, wrong amount or not from us: never auto-complete
    ([_jetton("ok", EXPECTED + 1)], "unresolved"),
    ([_jetton("ok", EXPECTED, sender="0:" + "ab" * 32)], "unresolved"),
    ([_jetton("ok", EXPECTED, jetton="0:" + "cd" * 32)], "unresolved"),
])
def test_withdrawal_verdict_follows_the_usdt_transfer(actions, verdict):
    from app.services.withdrawal_crawler import classify_withdrawal_trace
    event = {"actions": actions}
    assert classify_withdrawal_trace(event, settings.MASTER_WALLET_ADDRESS, settings.USDT_MASTER, EXPECTED) == verdict


# --- ledger audit -----------------------------------------------------------

async def _user(db, tid, balance):
    db.add(User(telegram_id=tid, first_name="L", balance=balance))
    await db.commit()


async def _audit_ids(db):
    from app.services.ledger_audit import LedgerAuditService
    return {row[0] for row in await LedgerAuditService.run_audit(db)}


@pytest.mark.asyncio
async def test_ledger_audit_counts_in_flight_debits_and_refunded_withdrawals(db_session):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    tid = 9101
    # deposit 20.00; queue a 1.00 stake (held); request a 5.00 withdrawal
    # (held for confirmation); a 3.00 withdrawal that failed and was refunded.
    await _user(db_session, tid, 2000 - 100 - 500)
    db_session.add_all([
        Transaction(user_id=tid, type="deposit", amount=2000, fee=0, status="completed", reference_id="d1"),
        Transaction(user_id=tid, type="game_wager", amount=-100, fee=0, status="pending", reference_id="matchmaking"),
        Transaction(user_id=tid, type="withdrawal", amount=-500, fee=20, status="pending_confirmation", reference_id="addr:x"),
        Transaction(id=777001, user_id=tid, type="withdrawal", amount=-300, fee=20, status="failed", reference_id="h"),
        Transaction(user_id=tid, type="withdrawal_refund", amount=300, fee=0, status="completed", reference_id="withdrawal_refund:777001"),
    ])
    await db_session.commit()
    assert tid not in await _audit_ids(db_session)


@pytest.mark.asyncio
async def test_ledger_audit_accepts_legacy_silent_withdrawal_refunds(db_session):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    tid = 9102
    # pre-refund-row era: failed withdrawal credited back with no ledger row
    await _user(db_session, tid, 1000)
    db_session.add_all([
        Transaction(user_id=tid, type="deposit", amount=1000, fee=0, status="completed", reference_id="d2"),
        Transaction(user_id=tid, type="withdrawal", amount=-1000, fee=20, status="failed", reference_id="old"),
    ])
    await db_session.commit()
    assert tid not in await _audit_ids(db_session)


@pytest.mark.asyncio
async def test_ledger_audit_still_catches_a_real_discrepancy(db_session):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    tid = 9103
    await _user(db_session, tid, 1500)  # 5.00 more than the ledger supports
    db_session.add(Transaction(user_id=tid, type="deposit", amount=1000, fee=0, status="completed", reference_id="d3"))
    await db_session.commit()
    assert tid in await _audit_ids(db_session)


# --- matchmaking refund race ------------------------------------------------

@pytest.mark.asyncio
async def test_matchmaking_refund_does_not_reverse_a_converted_stake(db_session):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    from app.socket_events import refund_pending_matchmaking_wager
    tid = 9201
    await _user(db_session, tid, 0)  # stake already debited
    hold = Transaction(user_id=tid, type="game_wager", amount=-500, fee=0, status="pending", reference_id="matchmaking")
    db_session.add(hold)
    await db_session.commit()
    await db_session.refresh(hold)
    hold_id = hold.id
    # establish_match wins the race and converts the hold into a game stake
    await db_session.execute(update(Transaction).where(Transaction.id == hold_id).values(status="completed", reference_id="game-1"))
    await db_session.commit()

    assert await refund_pending_matchmaking_wager(db_session, tid) is False
    db_session.expire_all()
    assert (await db_session.execute(select(User.balance).where(User.telegram_id == tid))).scalar_one() == 0
    row = (await db_session.execute(select(Transaction).where(Transaction.id == hold_id))).scalar_one()
    assert (row.status, row.reference_id) == ("completed", "game-1")


@pytest.mark.asyncio
async def test_matchmaking_refund_returns_an_unmatched_stake_once(db_session):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    from app.socket_events import refund_pending_matchmaking_wager
    tid = 9202
    await _user(db_session, tid, 0)
    db_session.add(Transaction(user_id=tid, type="game_wager", amount=-500, fee=0, status="pending", reference_id="matchmaking"))
    await db_session.commit()

    assert await refund_pending_matchmaking_wager(db_session, tid) is True
    assert await refund_pending_matchmaking_wager(db_session, tid) is False
    db_session.expire_all()
    assert (await db_session.execute(select(User.balance).where(User.telegram_id == tid))).scalar_one() == 500


# --- deposits ---------------------------------------------------------------

@pytest.mark.asyncio
async def test_usdt_label_alone_is_not_a_receipt(monkeypatch):
    from app.api.v1.endpoints import wallet

    async def master_jw():
        return MASTER_JW
    monkeypatch.setattr(wallet, "get_master_usdt_jetton_wallet_hex", master_jw)
    assert await wallet.is_master_usdt_receipt({"recipients_wallet": MASTER_JW}) is True
    assert await wallet.is_master_usdt_receipt({"recipients_wallet": "0:" + "ee" * 32}) is False
    assert await wallet.is_master_usdt_receipt({}) is False

    async def unknown():
        return None
    monkeypatch.setattr(wallet, "get_master_usdt_jetton_wallet_hex", unknown)
    assert await wallet.is_master_usdt_receipt({"recipients_wallet": MASTER_JW}) is False


class _Pages:
    def __init__(self, pages):
        self.pages, self.params = pages, []

    async def get(self, url, headers=None, params=None):
        self.params.append(dict(params or {}))
        status, body = self.pages[len(self.params) - 1]
        return Response(status, json=body)


@pytest.mark.asyncio
async def test_deposit_crawler_pages_back_beyond_the_latest_events():
    import time
    from app.services.deposit_crawler import fetch_recent_events
    now = int(time.time())
    client = _Pages([
        (200, {"events": [{"event_id": f"a{i}", "timestamp": now - i} for i in range(100)], "next_from": 500}),
        (200, {"events": [{"event_id": "old", "timestamp": now - 3 * 86400}], "next_from": 400}),
    ])
    status, events = await fetch_recent_events(client, "u", {})
    assert status == 200 and len(events) == 101
    assert client.params[1]["before_lt"] == 500
    assert len(client.params) == 2  # stopped once past the lookback window


@pytest.mark.asyncio
async def test_deposit_crawler_keeps_events_when_a_later_page_fails():
    import time
    from app.services.deposit_crawler import fetch_recent_events
    now = int(time.time())
    client = _Pages([
        (200, {"events": [{"event_id": "a", "timestamp": now}], "next_from": 5}),
        (429, {}),
    ])
    status, events = await fetch_recent_events(client, "u", {})
    assert (status, [e["event_id"] for e in events]) == (200, ["a"])
    assert (await fetch_recent_events(_Pages([(429, {})]), "u", {}))[0] == 429


def _webhook_request(payload):
    body = json.dumps(payload).encode()

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}
    return Request({"type": "http", "method": "POST", "path": "/api/v1/wallet/webhook",
                    "headers": [(b"content-type", b"application/json")]}, receive)


class _Tonapi:
    def __init__(self, routes):
        self.routes = routes

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def get(self, url, headers=None, params=None):
        for key, (status, body) in self.routes.items():
            if key in url:
                return Response(status, json=body)
        return Response(404, json={})


@pytest.mark.asyncio
async def test_webhook_credits_under_the_trace_id_used_by_verify_and_crawler(db_session, monkeypatch):
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    from app.api.v1.endpoints import wallet
    tid = 9301
    await _user(db_session, tid, 0)
    monkeypatch.setattr(settings, "WEBHOOK_SECRET", "s3cret")

    async def master_jw():
        return MASTER_JW
    monkeypatch.setattr(wallet, "get_master_usdt_jetton_wallet_hex", master_jw)
    routes = {
        "/blockchain/transactions/master_rx_tx": (200, {"in_msg": {
            "source": {"address": MASTER_JW},
            "decoded_op_name": "transfer_notification",
            "decoded_body": {"amount": "5000000", "sender": USER_WALLET, "forward_payload": {"text": f"ref_{tid}"}},
        }}),
        "/events/master_rx_tx": (200, {"event_id": "trace_root_1"}),
    }
    monkeypatch.setattr("httpx.AsyncClient", lambda **kw: _Tonapi(routes))
    for _ in range(2):  # TonAPI may deliver the webhook more than once
        await wallet.receive_ton_deposit_webhook(
            _webhook_request({"account_id": "master", "tx_hash": "master_rx_tx"}),
            x_webhook_secret="s3cret", authorization=None, db=db_session,
        )
    deposits = (await db_session.execute(
        select(Transaction).where(Transaction.user_id == tid, Transaction.type == "deposit")
    )).scalars().all()
    assert [d.reference_id for d in deposits] == ["trace_root_1"]
    db_session.expire_all()
    assert (await db_session.execute(select(User.balance).where(User.telegram_id == tid))).scalar_one() == 475


# --- payout serialization ---------------------------------------------------

@pytest.mark.asyncio
async def test_concurrent_payouts_never_sign_the_same_seqno(monkeypatch):
    from app.services import payout_service
    chain = {"seqno": 4}
    signed = []

    async def fetch_seqno(address, headers):
        return chain["seqno"]

    def build(to_addr, amount, seqno, payload):
        signed.append(seqno)
        from tonsdk.boc import Cell
        c = Cell()
        c.bits.write_uint(seqno, 32)
        return c

    class Client:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def post(self, url, headers=None, json=None):
            await asyncio.sleep(0)
            chain["seqno"] += 1  # the chain accepts the message
            return Response(200, json={})

    async def ton_balance(address, headers):
        return 10**10

    monkeypatch.setattr(payout_service, "_fetch_seqno", fetch_seqno)
    monkeypatch.setattr(payout_service, "_fetch_ton_balance", ton_balance)
    monkeypatch.setattr(payout_service.httpx, "AsyncClient", lambda **kw: Client())
    monkeypatch.setattr(payout_service, "SEQNO_POLL_SECONDS", 0)
    wallet = SimpleNamespace(build=build)
    await asyncio.gather(*[
        payout_service._sign_and_broadcast(wallet, {}, "dest", 1, None, f"p{i}") for i in range(3)
    ])
    assert sorted(signed) == [4, 5, 6]


@pytest.mark.asyncio
async def test_matchmaking_refund_loses_a_race_that_lands_after_it_reads(db_session):
    """The match converts the hold between the refund's read and its write."""
    if hasattr(db_session, "users"):
        pytest.skip("needs a real database")
    from app.socket_events import refund_pending_matchmaking_wager
    tid = 9203
    await _user(db_session, tid, 0)
    hold = Transaction(user_id=tid, type="game_wager", amount=-500, fee=0, status="pending", reference_id="matchmaking")
    db_session.add(hold)
    await db_session.commit()
    await db_session.refresh(hold)
    hold_id = hold.id

    class RacingSession:
        """Runs the opponent's conversion right after the refund reads the hold."""

        def __init__(self, inner):
            self.inner, self.raced = inner, False

        async def execute(self, stmt, *a, **kw):
            result = await self.inner.execute(stmt, *a, **kw)
            if not self.raced and "transactions.amount" in str(stmt) and "SELECT" in str(stmt).upper():
                self.raced = True
                rows = result.all()
                await self.inner.execute(update(Transaction).where(Transaction.id == hold_id)
                                         .values(status="completed", reference_id="game-2"))
                return SimpleNamespace(all=lambda: rows)
            return result

        def __getattr__(self, name):
            return getattr(self.inner, name)

    racing = RacingSession(db_session)
    assert await refund_pending_matchmaking_wager(racing, tid) is False
    assert racing.raced
    db_session.expire_all()
    assert (await db_session.execute(select(User.balance).where(User.telegram_id == tid))).scalar_one() == 0
    row = (await db_session.execute(select(Transaction).where(Transaction.id == hold_id))).scalar_one()
    assert (row.status, row.reference_id) == ("completed", "game-2")


@pytest.mark.asyncio
async def test_unfunded_custody_wallet_reports_zero_usdt_not_unknown(monkeypatch):
    """TonAPI 404s the jetton balance until the first USDT arrives."""
    from app.services.solvency_service import SolvencyService
    monkeypatch.setattr("httpx.AsyncClient", lambda **kw: _Tonapi({"/jettons/": (404, {"error": "not found"})}))
    assert await SolvencyService.get_onchain_usdt_cents() == (0, None)
    monkeypatch.setattr("httpx.AsyncClient", lambda **kw: _Tonapi({"/jettons/": (500, {})}))
    cents, err = await SolvencyService.get_onchain_usdt_cents()
    assert cents is None and "500" in err



# --- custody pre-flight -----------------------------------------------------

class _Recorder(_Tonapi):
    posts = []

    async def post(self, url, headers=None, json=None):
        _Recorder.posts.append(url)
        return Response(200, json={})


def _payout_env(monkeypatch, routes):
    from app.services import payout_service
    _Recorder.posts = []
    monkeypatch.setattr(payout_service, "_load_master_wallet",
                        lambda s: SimpleNamespace(address=None, build=lambda *a: None))
    monkeypatch.setattr(payout_service.httpx, "AsyncClient", lambda **kw: _Recorder(routes))
    return payout_service


@pytest.mark.asyncio
@pytest.mark.parametrize("jetton_route", [
    (200, {"balance": "4999999", "wallet_address": {"address": MASTER_JW}}),  # 4.99 USDT
    (404, {"error": "no jetton wallet"}),  # never held USDT
])
async def test_usdt_payout_refused_before_broadcast_when_custody_is_short(monkeypatch, jetton_route):
    ps = _payout_env(monkeypatch, {"/jettons/": jetton_route})
    with pytest.raises(ps.InsufficientCustodyFunds, match="USDT payout"):
        await ps.execute_usdt_payout(USER_WALLET, 500)  # $5.00
    assert _Recorder.posts == []


@pytest.mark.asyncio
async def test_payout_refused_before_broadcast_without_gas(monkeypatch):
    ps = _payout_env(monkeypatch, {
        "/jettons/": (200, {"balance": "100000000", "wallet_address": {"address": MASTER_JW}}),
        "/accounts/": (200, {"balance": 60_000_000, "status": "active"}),  # 0.06 TON < 0.05 + reserve
    })
    with pytest.raises(ps.InsufficientCustodyFunds, match="TON"):
        await ps.execute_usdt_payout(USER_WALLET, 500)
    assert _Recorder.posts == []


def test_custody_shortfall_is_a_safe_pre_broadcast_error():
    """Callers refund / keep reserved / keep in review on ValueError, and only
    treat BlockchainBroadcastError as possibly-sent."""
    from app.services.payout_service import InsufficientCustodyFunds, BlockchainBroadcastError
    assert issubclass(InsufficientCustodyFunds, ValueError)
    assert not issubclass(InsufficientCustodyFunds, BlockchainBroadcastError)
