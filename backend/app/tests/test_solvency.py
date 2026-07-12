"""Unit tests for SolvencyService ledger reconciliation (app/services/solvency_service.py).

Pure unit tests against an in-memory SQLite DB: no network (on-chain fetch is
disabled), no running server. Locks in the accounting invariants:
 - total liabilities = Σ(user balances)
 - internal reconciliation = (Σ user-balance-affecting completed txns == liabilities)
 - platform revenue (fees/rake) is excluded from what is owed to users
"""
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.user import User
from app.models.transaction import Transaction
from app.services.solvency_service import SolvencyService


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as session:
        yield session
    await engine.dispose()


def _user(tid: int, balance: int) -> User:
    return User(telegram_id=tid, first_name=f"U{tid}", balance=balance, elo=1000, referral_code=f"R{tid}")


def _tx(user_id: int, type_: str, amount: int, status: str = "completed") -> Transaction:
    return Transaction(user_id=user_id, type=type_, amount=amount, status=status)


async def test_reconciled_ledger(db):
    db.add_all([_user(1, 800), _user(2, 200)])  # liabilities = 1000
    db.add_all([
        _tx(1, "deposit", 800),
        _tx(2, "deposit", 300),
        _tx(2, "game_wager", -100),  # user2: 300 - 100 = 200
    ])
    await db.commit()

    s = await SolvencyService.get_ledger_summary(db)
    assert s["total_liabilities_cents"] == 1000
    assert s["ledger_user_sum_cents"] == 1000
    assert s["internal_reconciled"] is True
    assert s["internal_discrepancy_cents"] == 0


async def test_reconciled_ledger_with_reversal(db):
    db.add_all([_user(1, 100)])  # liabilities = 100
    db.add_all([
        _tx(1, "deposit", 1036),
        _tx(1, "deposit_reversal", -936),
    ])
    await db.commit()

    s = await SolvencyService.get_ledger_summary(db)
    assert s["total_liabilities_cents"] == 100
    assert s["ledger_user_sum_cents"] == 100
    assert s["internal_reconciled"] is True
    assert s["internal_discrepancy_cents"] == 0


async def test_discrepancy_detected(db):
    # Balance mutated without a matching ledger row: liabilities 1000, ledger 950.
    db.add_all([_user(1, 1000)])
    db.add_all([_tx(1, "deposit", 950)])
    await db.commit()

    s = await SolvencyService.get_ledger_summary(db)
    assert s["internal_reconciled"] is False
    assert s["internal_discrepancy_cents"] == 50  # liabilities - ledger


async def test_platform_revenue_excluded_from_liabilities(db):
    db.add_all([_user(1, 950)])
    db.add_all([
        _tx(1, "deposit", 950),
        _tx(1, "deposit_fee", -50),   # platform revenue, not owed to a user
        _tx(1, "game_rake", -30),
    ])
    await db.commit()

    s = await SolvencyService.get_ledger_summary(db)
    # Fees/rake must NOT reduce the reconciled user sum...
    assert s["ledger_user_sum_cents"] == 950
    assert s["internal_reconciled"] is True
    # ...but must be reported as retained revenue (positive magnitude).
    assert s["platform_revenue_cents"] == 80


async def test_pending_transactions_ignored(db):
    db.add_all([_user(1, 500)])
    db.add_all([
        _tx(1, "deposit", 500, status="completed"),
        _tx(1, "deposit", 999, status="pending"),  # must be ignored
    ])
    await db.commit()

    s = await SolvencyService.get_ledger_summary(db)
    assert s["ledger_user_sum_cents"] == 500
    assert s["internal_reconciled"] is True


async def test_onchain_disabled_returns_none_safely(db):
    db.add_all([_user(1, 100)])
    db.add_all([_tx(1, "deposit", 100)])
    await db.commit()

    report = await SolvencyService.run_solvency_report(db, include_onchain=False)
    assert report["onchain_usdt_cents"] is None
    assert report["usdt_coverage_ratio"] is None
    assert report["total_liabilities_cents"] == 100


# --- evaluate_deficit_streak: pure alert-decision logic (no DB, no network) ---

BUF = 5000        # $50 buffer
SUSTAINED = 3


def _report(liabilities, onchain):
    return {"total_liabilities_cents": liabilities, "onchain_usdt_cents": onchain}


def test_streak_no_deficit_within_buffer_never_alerts():
    # onchain just below liabilities but within the buffer -> not a deficit
    streak, alert = SolvencyService.evaluate_deficit_streak(_report(100000, 96000), 0, BUF, SUSTAINED)
    assert streak == 0 and alert is False


def test_streak_builds_and_alerts_only_when_sustained():
    r = _report(100000, 50000)  # $500 deficit, well over buffer
    streak, alert = SolvencyService.evaluate_deficit_streak(r, 0, BUF, SUSTAINED)
    assert (streak, alert) == (1, False)
    streak, alert = SolvencyService.evaluate_deficit_streak(r, streak, BUF, SUSTAINED)
    assert (streak, alert) == (2, False)
    streak, alert = SolvencyService.evaluate_deficit_streak(r, streak, BUF, SUSTAINED)
    assert (streak, alert) == (3, True)  # sustained -> fire


def test_streak_resets_on_recovery():
    # a deficit that recovers within buffer wipes the streak (no alert)
    streak, alert = SolvencyService.evaluate_deficit_streak(_report(100000, 50000), 2, BUF, SUSTAINED)
    assert (streak, alert) == (3, True)
    streak, alert = SolvencyService.evaluate_deficit_streak(_report(100000, 99000), streak, BUF, SUSTAINED)
    assert (streak, alert) == (0, False)


def test_streak_unknown_onchain_holds_and_never_alerts():
    # a TonAPI failure (None) must neither reset a building streak nor alarm
    streak, alert = SolvencyService.evaluate_deficit_streak(_report(100000, None), 2, BUF, SUSTAINED)
    assert (streak, alert) == (2, False)


# --- gas float ---

async def test_master_ton_balance_unconfigured_returns_error(monkeypatch):
    # No network: with no master wallet configured the fetch reports an error
    # (never a false zero that could trip a "gas low" alert).
    from app.core.config import get_settings
    monkeypatch.setattr(get_settings(), "MASTER_WALLET_ADDRESS", "")
    balance, err = await SolvencyService.get_master_ton_balance()
    assert balance is None
    assert err is not None


async def test_gas_float_loop_dormant_by_default():
    import asyncio
    from app.services.solvency_service import start_gas_float_alert_loop
    # Disabled by default/testing -> returns immediately (no 35s sleep, no loop, no network).
    await asyncio.wait_for(start_gas_float_alert_loop(), timeout=5)


async def test_solvency_loop_dormant_by_default():
    import asyncio
    from app.services.solvency_service import start_solvency_alert_loop
    # Disabled by default/testing -> returns immediately.
    await asyncio.wait_for(start_solvency_alert_loop(), timeout=5)

