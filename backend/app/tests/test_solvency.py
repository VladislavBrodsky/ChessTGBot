"""Unit tests for SolvencyService ledger reconciliation (app/services/solvency_service.py).

Pure unit tests against an in-memory SQLite DB: no network (on-chain fetch is
disabled), no running server. Locks in the accounting invariants:
 - total liabilities = Σ(user balances)
 - internal reconciliation = (Σ user-balance-affecting completed txns == liabilities)
 - platform revenue (fees/rake) is excluded from what is owed to users
"""
import pytest
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
