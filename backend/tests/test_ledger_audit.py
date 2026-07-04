import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.transaction import Transaction
from app.services.ledger_audit import LedgerAuditService

@pytest.mark.asyncio
async def test_ledger_audit_no_mismatches(db_session: AsyncSession):
    """Verify that a user with matching balance and transaction logs passes the audit."""
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # 1. Create user with 0 balance
    telegram_id = 999101
    user = User(
        telegram_id=telegram_id,
        first_name="HealthyUser",
        username="healthy_user",
        balance=0,
        xp=0,
        level=1
    )
    db_session.add(user)
    await db_session.commit()

    # Run audit - should be 0 mismatches
    mismatches = await LedgerAuditService.run_audit(db_session)
    # Check if our user is in mismatches (filter by telegram_id since other tests might have dirty data)
    user_mismatches = [m for m in mismatches if m[0] == telegram_id]
    assert len(user_mismatches) == 0

@pytest.mark.asyncio
async def test_ledger_audit_detects_mismatch(db_session: AsyncSession):
    """Verify that a user with a balance but no transactions is flagged in the audit."""
    if hasattr(db_session, "users"):
        return

    # 1. Create user with $50.00 (5000 cents) balance but NO transaction logs
    telegram_id = 999102
    user = User(
        telegram_id=telegram_id,
        first_name="AnomalyUser",
        username="anomaly_user",
        balance=5000,
        xp=0,
        level=1
    )
    db_session.add(user)
    await db_session.commit()

    # Run audit - should detect mismatch for this user
    mismatches = await LedgerAuditService.run_audit(db_session)
    user_mismatches = [m for m in mismatches if m[0] == telegram_id]
    assert len(user_mismatches) == 1
    assert user_mismatches[0][2] == 5000  # Profile balance
    assert user_mismatches[0][3] == 0     # Ledger sum

@pytest.mark.asyncio
async def test_ledger_audit_matches_with_transactions(db_session: AsyncSession):
    """Verify that a user with matching balance and completed transactions passes the audit."""
    if hasattr(db_session, "users"):
        return

    # 1. Create user with $20.00 (2000 cents) balance
    telegram_id = 999103
    user = User(
        telegram_id=telegram_id,
        first_name="AuditGoodUser",
        username="audit_good_user",
        balance=2000,
        xp=0,
        level=1
    )
    db_session.add(user)
    await db_session.commit()

    # 2. Add completed deposit of $30.00 (3000 cents)
    tx_dep = Transaction(
        user_id=telegram_id,
        type="deposit",
        amount=3000,
        status="completed"
    )
    # 3. Add completed game wager of -$10.00 (-1000 cents)
    tx_wag = Transaction(
        user_id=telegram_id,
        type="game_wager",
        amount=-1000,
        status="completed"
    )
    # 4. Add failed transaction (should be ignored in audit)
    tx_fail = Transaction(
        user_id=telegram_id,
        type="deposit",
        amount=5000,
        status="failed"
    )
    db_session.add_all([tx_dep, tx_wag, tx_fail])
    await db_session.commit()

    # Run audit - should have no mismatches for this user (3000 - 1000 = 2000 = profile balance)
    mismatches = await LedgerAuditService.run_audit(db_session)
    user_mismatches = [m for m in mismatches if m[0] == telegram_id]
    assert len(user_mismatches) == 0
