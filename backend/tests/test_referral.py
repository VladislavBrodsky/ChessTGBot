import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.gamification import Referral
from app.models.telemetry import TelemetryLog
from app.services.gamification_service import GamificationService
from app.api.v1.endpoints.users import get_referral_stats
from app.core.config import get_settings

async def _add_qualifying_games(db, telegram_id: int, n: int = 3, moves: int = 30):
    """The signup-bonus milestone now requires 3 REAL games (total_moves >=
    REFERRAL_MILESTONE_MIN_MOVES), not just games_played >= 3 — instant
    resigns no longer qualify. Tests create qualifying GameHistory rows."""
    import uuid
    from app.models.game_history import GameHistory
    for _ in range(n):
        db.add(GameHistory(
            game_id=f"qual_{uuid.uuid4().hex[:12]}",
            white_player_id=telegram_id,
            black_player_id=-1,
            total_moves=moves,
        ))
    await db.commit()


settings = get_settings()

@pytest.mark.asyncio
async def test_process_referral_success(db_session: AsyncSession):
    # Skip if using mock session to prevent table insert issues
    if hasattr(db_session, "users"):
        return

    # 1. Create a referrer user
    referrer = User(
        telegram_id=111111,
        first_name="Referrer",
        referral_code="REF12345",
        xp=100,
        level=1
    )
    db_session.add(referrer)

    # 2. Create a referred user
    referred = User(
        telegram_id=222222,
        first_name="Referred",
        referral_code="REF67890",
        xp=0,
        level=1
    )
    db_session.add(referred)
    await db_session.commit()
    await db_session.refresh(referrer)
    await db_session.refresh(referred)

    # 3. Process referral with raw code — no rewards yet, only link is recorded
    success = await GamificationService.process_referral(db_session, referred, "REF12345")
    assert success is True

    # 4. Verify referral record was created
    result = await db_session.execute(
        select(Referral).where(
            Referral.referrer_id == referrer.id,
            Referral.referred_user_id == referred.id
        )
    )
    ref_record = result.scalars().first()
    assert ref_record is not None

    # 5. Verify NO XP was awarded yet (bonus is deferred until 3 games)
    await db_session.refresh(referrer)
    await db_session.refresh(referred)
    assert referrer.xp == 100  # unchanged from initial value
    assert referred.xp == 0    # unchanged

    # 6. Simulate the referred user completing 3 games
    referred.games_played = 3
    db_session.add(referred)
    await db_session.commit()
    await db_session.refresh(referred)
    await _add_qualifying_games(db_session, referred.telegram_id)

    milestone_triggered = await GamificationService.check_referral_game_milestone(db_session, referred.id)
    assert milestone_triggered is True

    # 7. Now verify bonuses were credited: referrer +50 XP + 50 XP milestone, referred +20 XP
    await db_session.refresh(referrer)
    await db_session.refresh(referred)
    assert referrer.xp == 200   # 100 (initial) + 50 (referral_invite) + 50 (milestone_ref_1)
    assert referred.xp == 20    # 0 + 20 (referral_signup)

    await db_session.flush()
    await db_session.refresh(ref_record)
    assert ref_record.activated_at is not None

    activation_event = (
        await db_session.execute(
            select(TelemetryLog).where(
                TelemetryLog.user_id == referred.telegram_id,
                TelemetryLog.event_type == "referral_activated",
            )
        )
    ).scalars().one()
    assert activation_event.event_data["referrer_user_id"] == referrer.id
    assert activation_event.event_data["qualifying_games"] >= 3

    referral_stats = await get_referral_stats(db=db_session, current_user=referrer)
    assert referral_stats.total_referrals == 1
    assert referral_stats.activated_referrals == 1
    assert referral_stats.activation_rate == 100.0


@pytest.mark.asyncio
async def test_process_referral_with_prefix(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # Create referrer
    referrer = User(
        telegram_id=333333,
        first_name="Referrer2",
        referral_code="XYZ54321",
        xp=0,
        level=1
    )
    db_session.add(referrer)

    # Create referred
    referred = User(
        telegram_id=444444,
        first_name="Referred2",
        referral_code="ABC09876",
        xp=0,
        level=1
    )
    db_session.add(referred)
    await db_session.commit()
    await db_session.refresh(referrer)
    await db_session.refresh(referred)

    # Process referral with ref_ prefix — no rewards granted yet
    success = await GamificationService.process_referral(db_session, referred, "ref_XYZ54321")
    assert success is True

    # Verify no XP was awarded yet
    await db_session.refresh(referrer)
    await db_session.refresh(referred)
    assert referrer.xp == 0
    assert referred.xp == 0

    # Simulate 3 games and trigger milestone
    referred.games_played = 3
    db_session.add(referred)
    await db_session.commit()
    await db_session.refresh(referred)
    await _add_qualifying_games(db_session, referred.telegram_id)

    milestone_triggered = await GamificationService.check_referral_game_milestone(db_session, referred.id)
    assert milestone_triggered is True

    # Verify XP awarded: referrer +50 invite + 50 milestone = 100, referred +20
    await db_session.refresh(referrer)
    await db_session.refresh(referred)
    assert referrer.xp == 100   # 0 + 50 (invite) + 50 (milestone_ref_1)
    assert referred.xp == 20


@pytest.mark.asyncio
async def test_process_referral_duplicate_prevented(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # Create referrer and referred
    referrer = User(
        telegram_id=555555,
        first_name="Referrer3",
        referral_code="DUP11111",
        xp=0,
        level=1
    )
    db_session.add(referrer)

    referred = User(
        telegram_id=666666,
        first_name="Referred3",
        referral_code="DUP22222",
        xp=0,
        level=1
    )
    db_session.add(referred)
    await db_session.commit()
    await db_session.refresh(referrer)
    await db_session.refresh(referred)

    # First referral processing should succeed
    success1 = await GamificationService.process_referral(db_session, referred, "DUP11111")
    assert success1 is True

    # Second referral processing (duplicate) should fail
    success2 = await GamificationService.process_referral(db_session, referred, "DUP11111")
    assert success2 is False

    # No XP should be awarded yet (bonus deferred to 3 games)
    await db_session.refresh(referrer)
    await db_session.refresh(referred)
    assert referrer.xp == 0
    assert referred.xp == 0

    # Simulate 3 games completed and trigger milestone
    referred.games_played = 3
    db_session.add(referred)
    await db_session.commit()
    await db_session.refresh(referred)
    await _add_qualifying_games(db_session, referred.telegram_id)

    milestone_triggered = await GamificationService.check_referral_game_milestone(db_session, referred.id)
    assert milestone_triggered is True

    # Trigger milestone again — should be idempotent
    milestone_triggered_2 = await GamificationService.check_referral_game_milestone(db_session, referred.id)
    assert milestone_triggered_2 is False

    # XP should only be awarded once: referrer +50 invite + 50 milestone = 100, referred +20
    await db_session.refresh(referrer)
    await db_session.refresh(referred)
    assert referrer.xp == 100   # 0 + 50 (invite) + 50 (milestone_ref_1)
    assert referred.xp == 20   # referral_signup XP only


@pytest.mark.asyncio
async def test_process_referral_self_referral_prevented(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # Create user
    user = User(
        telegram_id=777777,
        first_name="SelfReferrer",
        referral_code="SELF999",
        xp=0,
        level=1
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Try self referral
    success = await GamificationService.process_referral(db_session, user, "SELF999")
    assert success is False
    assert user.xp == 0


@pytest.mark.asyncio
async def test_sync_endpoint_returns_bot_username(client: AsyncClient, db_session: AsyncSession):
    # Fetch /sync endpoint
    # The client uses get_current_user dependency which auto-registers telegram_id 123456789 in SQLite
    response = await client.post("/api/v1/users/sync")
    assert response.status_code == 200
    data = response.json()
    
    # Assert bot_username is in response and matches config
    assert "bot_username" in data
    assert data["bot_username"] == settings.TELEGRAM_BOT_USERNAME


@pytest.mark.asyncio
async def test_get_user_stats_returns_bot_username(client: AsyncClient, db_session: AsyncSession):
    # Get stats for a user
    import json
    from urllib.parse import quote
    telegram_id = 123456789
    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'TestUser'}))}"
    response = await client.get(f"/api/v1/users/{telegram_id}", headers={"X-Telegram-Init-Data": init_data})
    assert response.status_code == 200
    data = response.json()
    
    assert "bot_username" in data
    assert data["bot_username"] == settings.TELEGRAM_BOT_USERNAME


@pytest.mark.asyncio
async def test_three_tier_referral_commission(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    from app.services.referral_commission_service import ReferralCommissionService
    from app.models.transaction import Transaction

    # 1. Create a 3-tier referrer structure
    # Tier 3 Referrer (Grandparent) - Premium
    r3 = User(telegram_id=300001, first_name="R3", referral_code="R3CODE", is_premium=True, balance=0)
    db_session.add(r3)
    
    # Tier 2 Referrer (Parent) - Premium
    r2 = User(telegram_id=200001, first_name="R2", referral_code="R2CODE", is_premium=True, balance=0)
    db_session.add(r2)

    # Tier 1 Referrer (Direct) - Premium
    r1 = User(telegram_id=100001, first_name="R1", referral_code="R1CODE", is_premium=True, balance=0)
    db_session.add(r1)

    # Player (Referred by R1)
    player = User(telegram_id=400001, first_name="Player", referral_code="PLAYCODE", is_premium=False, balance=0)
    db_session.add(player)
    
    await db_session.commit()
    await db_session.refresh(r3)
    await db_session.refresh(r2)
    await db_session.refresh(r1)
    await db_session.refresh(player)

    # Create Referral records to link them
    # R3 referred R2
    ref_3_2 = Referral(referrer_id=r3.id, referred_user_id=r2.id)
    db_session.add(ref_3_2)
    # R2 referred R1
    ref_2_1 = Referral(referrer_id=r2.id, referred_user_id=r1.id)
    db_session.add(ref_2_1)
    # R1 referred Player
    ref_1_p = Referral(referrer_id=r1.id, referred_user_id=player.id)
    db_session.add(ref_1_p)
    await db_session.commit()

    # Distribute wager commissions (Bid = 10000 cents, Pot = 20000 cents / $200.00)
    # Since referrers are Level 1 (Recruit), only r1 (L1) gets commission:
    # L1 (r1) gets 2.0% of 20000 pot = 400 cents
    wager = 10000
    deduction = await ReferralCommissionService.distribute_wager_commissions(db_session, "test_game_comm", player.id, wager, is_winner=True)
    await db_session.commit()

    await db_session.refresh(r1)
    await db_session.refresh(r2)
    await db_session.refresh(r3)

    assert r1.balance == 400
    assert r2.balance == 0
    assert r3.balance == 0
    assert deduction == 400

    # Verify transaction entries
    txs_result = await db_session.execute(
        select(Transaction).where(Transaction.reference_id == "ref_test_game_comm")
    )
    txs = txs_result.scalars().all()
    assert len(txs) == 1
    assert txs[0].amount == 400
    assert txs[0].user_id == r1.telegram_id


@pytest.mark.asyncio
async def test_wager_referral_commission_retry_is_a_no_op(db_session: AsyncSession):
    """A recovered game-settlement worker must not pay a referrer twice."""
    if hasattr(db_session, "users"):
        return

    from app.models.money_operation import MoneyOperationClaim
    from app.models.transaction import Transaction
    from app.services.referral_commission_service import ReferralCommissionService

    referrer = User(telegram_id=410001, first_name="Referrer", balance=0)
    player = User(telegram_id=410002, first_name="Player", balance=0)
    db_session.add_all([referrer, player])
    await db_session.commit()
    await db_session.refresh(referrer)
    await db_session.refresh(player)
    db_session.add(Referral(referrer_id=referrer.id, referred_user_id=player.id))
    await db_session.commit()

    game_id = "retry_safe_referral_game"
    first = await ReferralCommissionService.distribute_wager_commissions(
        db_session, game_id, player.id, 10_000, is_winner=True
    )
    await db_session.commit()
    second = await ReferralCommissionService.distribute_wager_commissions(
        db_session, game_id, player.id, 10_000, is_winner=True
    )
    await db_session.commit()

    await db_session.refresh(referrer)
    ledger = (await db_session.execute(
        select(Transaction).where(
            Transaction.user_id == referrer.telegram_id,
            Transaction.type == "referral_commission",
            Transaction.reference_id == f"ref_{game_id}",
        )
    )).scalars().all()
    claims = (await db_session.execute(
        select(MoneyOperationClaim).where(
            MoneyOperationClaim.operation_type == "wager_referral_commission",
            MoneyOperationClaim.reference_id == game_id,
        )
    )).scalars().all()

    assert first == 400
    assert second == 0
    assert referrer.balance == 400
    assert len(ledger) == 1
    assert len(claims) == 1


@pytest.mark.asyncio
async def test_three_tier_referral_commission_non_premium_skipped(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    from app.services.referral_commission_service import ReferralCommissionService
    from app.models.transaction import Transaction

    # 1. Create a 3-tier referrer structure where Tier 2 is NOT premium
    r3 = User(telegram_id=300002, first_name="R3_P", referral_code="R3P", is_premium=True, balance=0)
    db_session.add(r3)
    
    r2 = User(telegram_id=200002, first_name="R2_NP", referral_code="R2NP", is_premium=False, balance=0)
    db_session.add(r2)

    r1 = User(telegram_id=100002, first_name="R1_P", referral_code="R1P", is_premium=True, balance=0)
    db_session.add(r1)

    player = User(telegram_id=400002, first_name="Player2", referral_code="PLAY2", is_premium=False, balance=0)
    db_session.add(player)
    
    await db_session.commit()
    await db_session.refresh(r3)
    await db_session.refresh(r2)
    await db_session.refresh(r1)
    await db_session.refresh(player)

    # Link referrals
    db_session.add(Referral(referrer_id=r3.id, referred_user_id=r2.id))
    db_session.add(Referral(referrer_id=r2.id, referred_user_id=r1.id))
    db_session.add(Referral(referrer_id=r1.id, referred_user_id=player.id))
    await db_session.commit()

    # Distribute commissions
    wager = 10000
    deduction = await ReferralCommissionService.distribute_wager_commissions(db_session, "test_game_comm_np", player.id, wager, is_winner=True)
    await db_session.commit()

    await db_session.refresh(r1)
    await db_session.refresh(r2)
    await db_session.refresh(r3)

    assert r1.balance == 400
    assert r2.balance == 0
    assert r3.balance == 0
    assert deduction == 400

    # Verify transaction entries
    txs_result = await db_session.execute(
        select(Transaction).where(Transaction.reference_id == "ref_test_game_comm_np")
    )
    txs = txs_result.scalars().all()
    assert len(txs) == 1


@pytest.mark.asyncio
async def test_premium_xp_booster(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # Create one normal user and one premium user
    u_normal = User(telegram_id=900001, first_name="Normal", is_premium=False, xp=0)
    u_premium = User(telegram_id=900002, first_name="Premium", is_premium=True, xp=0)
    db_session.add(u_normal)
    db_session.add(u_premium)
    await db_session.commit()
    await db_session.refresh(u_normal)
    await db_session.refresh(u_premium)

    # Award XP to both with booster active
    await GamificationService.add_xp(db_session, u_normal, 100, trigger_kickback=False, apply_booster=True)
    await GamificationService.add_xp(db_session, u_premium, 100, trigger_kickback=False, apply_booster=True)

    await db_session.refresh(u_normal)
    await db_session.refresh(u_premium)

    assert u_normal.xp == 100
    assert u_premium.xp == 200 # doubled!


@pytest.mark.asyncio
async def test_premium_referral_signup_boost(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # Case 1: Premium Referrer, Premium Recruit — bonus deferred until 3 games
    r_prem = User(telegram_id=900101, first_name="RPrem", referral_code="RPREM", is_premium=True, xp=0)
    u_prem = User(telegram_id=900102, first_name="UPrem", referral_code="UPREM", is_premium=True, xp=0)
    db_session.add(r_prem)
    db_session.add(u_prem)
    await db_session.commit()
    await db_session.refresh(r_prem)
    await db_session.refresh(u_prem)

    await GamificationService.process_referral(db_session, u_prem, "RPREM")
    await db_session.refresh(r_prem)
    await db_session.refresh(u_prem)

    # No bonuses yet — deferred to 3 games
    assert r_prem.xp == 0
    assert u_prem.xp == 0

    # Simulate 3 games and trigger the milestone
    u_prem.games_played = 3
    db_session.add(u_prem)
    await db_session.commit()
    await db_session.refresh(u_prem)
    await _add_qualifying_games(db_session, u_prem.telegram_id)

    await GamificationService.check_referral_game_milestone(db_session, u_prem.id)
    await db_session.refresh(r_prem)
    await db_session.refresh(u_prem)

    # Premium referrer gets 100 XP (invite) + 50 XP (milestone) = 150, premium recruit gets 50 XP
    assert r_prem.xp == 150
    assert u_prem.xp == 50

    # Case 2: Non-Premium Referrer, Non-Premium Recruit
    r_norm = User(telegram_id=900103, first_name="RNorm", referral_code="RNORM", is_premium=False, xp=0)
    u_norm = User(telegram_id=900104, first_name="UNorm", referral_code="UNORM", is_premium=False, xp=0)
    db_session.add(r_norm)
    db_session.add(u_norm)
    await db_session.commit()
    await db_session.refresh(r_norm)
    await db_session.refresh(u_norm)

    await GamificationService.process_referral(db_session, u_norm, "RNORM")
    await db_session.refresh(r_norm)
    await db_session.refresh(u_norm)

    # No bonuses yet
    assert r_norm.xp == 0
    assert u_norm.xp == 0

    # Simulate 3 games and trigger milestone
    u_norm.games_played = 3
    db_session.add(u_norm)
    await db_session.commit()
    await db_session.refresh(u_norm)
    await _add_qualifying_games(db_session, u_norm.telegram_id)

    await GamificationService.check_referral_game_milestone(db_session, u_norm.id)
    await db_session.refresh(r_norm)
    await db_session.refresh(u_norm)

    # Non-premium referrer gets 50 XP (invite) + 50 XP (milestone) = 100, non-premium recruit gets 20 XP
    assert r_norm.xp == 100
    assert u_norm.xp == 20


@pytest.mark.asyncio
async def test_multi_tier_xp_kickbacks(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    # Tier 3 (Premium)
    r3 = User(telegram_id=900201, first_name="R3", referral_code="R3X", is_premium=True, xp=0)
    # Tier 2 (Non-premium - should be skipped for kickbacks)
    r2 = User(telegram_id=900202, first_name="R2", referral_code="R2X", is_premium=False, xp=0)
    # Tier 1 (Premium)
    r1 = User(telegram_id=900203, first_name="R1", referral_code="R1X", is_premium=True, xp=0)
    # Player
    player = User(telegram_id=900204, first_name="Player", referral_code="PX", is_premium=False, xp=0)

    db_session.add_all([r3, r2, r1, player])
    await db_session.commit()
    await db_session.refresh(r3)
    await db_session.refresh(r2)
    await db_session.refresh(r1)
    await db_session.refresh(player)

    # Link referrals: r3 -> r2 -> r1 -> player
    db_session.add(Referral(referrer_id=r3.id, referred_user_id=r2.id))
    db_session.add(Referral(referrer_id=r2.id, referred_user_id=r1.id))
    db_session.add(Referral(referrer_id=r1.id, referred_user_id=player.id))
    await db_session.commit()

    # Player earns 1000 XP (from active game/academy task)
    await GamificationService.add_xp(db_session, player, 1000, trigger_kickback=True, apply_booster=True)

    await db_session.refresh(r3)
    await db_session.refresh(r2)
    await db_session.refresh(r1)
    await db_session.refresh(player)

    # Player got 1000 XP
    assert player.xp == 1000
    # Tier 1 (Premium) gets 10% of 1000 = 100 XP
    assert r1.xp == 100
    # Tier 2 (Non-premium) gets 0 XP
    assert r2.xp == 0
    # Tier 3 (Premium) gets 2.5% of 1000 = 25 XP
    assert r3.xp == 25


@pytest.mark.asyncio
async def test_wager_scaling_xp_bonus(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    from app.services.game_service import GameService
    from app.schemas.game_state import GameState

    p1 = User(telegram_id=950001, first_name="P1", elo=1000, xp=0)
    p2 = User(telegram_id=950002, first_name="P2", elo=1000, xp=0)
    db_session.add(p1)
    db_session.add(p2)
    await db_session.commit()
    await db_session.refresh(p1)
    await db_session.refresh(p2)

    # Wager = 1000 cents ($10.00). Wager bonus = (1000 // 100) * 5 = 50 XP.
    # PVP win: Winner base match XP = 20, Loser base match XP = 5.
    # Total XP for Winner = 20 + 50 = 70 XP.
    # Total XP for Loser = 5 + 50 = 55 XP.
    state = GameState(
        fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        turn="w",
        is_check=False,
        is_checkmate=False,
        is_stalemate=False,
        legal_moves=[],
        is_game_over=True,
        winner="w",
        result_type="checkmate",
        white_player_id=950001,
        black_player_id=950002,
        time_control_seconds=600,
        white_time_left=600.0,
        black_time_left=600.0,
        move_history=[]
    )
    # Inject bid_amount
    state.bid_amount = 1000

    service = GameService()
    await service.end_game("test_wager_game", state)

    # Refresh users from db
    await db_session.refresh(p1)
    await db_session.refresh(p2)

    assert p1.xp == 70
    assert p2.xp == 55


@pytest.mark.asyncio
async def test_win_streak_xp_bonus(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    from app.services.game_service import GameService
    from app.schemas.game_state import GameState
    from app.models.game_history import GameHistory

    p1 = User(telegram_id=960001, first_name="P1", elo=1000, xp=0)
    p2 = User(telegram_id=960002, first_name="P2", elo=1000, xp=0)
    db_session.add(p1)
    db_session.add(p2)
    await db_session.commit()
    await db_session.refresh(p1)
    await db_session.refresh(p2)

    # Insert 2 previous victories for P1 to create a 2-win streak
    h1 = GameHistory(
        game_id="sim_streak_h1",
        white_player_id=960001,
        black_player_id=960002,
        winner="w",
        result_type="checkmate",
        white_elo_before=1000,
        white_elo_after=1010,
        black_elo_before=1000,
        black_elo_after=990,
        total_moves=20,
        game_type="online"
    )
    h2 = GameHistory(
        game_id="sim_streak_h2",
        white_player_id=960001,
        black_player_id=960002,
        winner="w",
        result_type="checkmate",
        white_elo_before=1010,
        white_elo_after=1020,
        black_elo_before=990,
        black_elo_after=980,
        total_moves=20,
        game_type="online"
    )
    db_session.add(h1)
    db_session.add(h2)
    await db_session.commit()

    # P1 wins the 3rd game -> should trigger 3-win streak bonus (+5 XP)
    # Total P1 XP = 20 (base victory) + 5 (streak bonus) = 25 XP
    state = GameState(
        fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        turn="w",
        is_check=False,
        is_checkmate=False,
        is_stalemate=False,
        legal_moves=[],
        is_game_over=True,
        winner="w",
        result_type="checkmate",
        white_player_id=960001,
        black_player_id=960002,
        time_control_seconds=600,
        white_time_left=600.0,
        black_time_left=600.0,
        move_history=["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6", "e1g1", "f8e7", "f1e1", "b7b5", "a4b3", "d7d6", "c2c3", "e8g8", "h2h3", "c6a5", "b3c2", "c7c5", "d2d4", "d8c7", "d4d5", "a5c4", "b2b3", "c4b6"]
    )

    service = GameService()
    await service.end_game("test_streak_game", state)

    await db_session.refresh(p1)
    assert p1.xp == 25


@pytest.mark.asyncio
async def test_blitzkrieg_victory_bonus(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    from app.services.game_service import GameService
    from app.schemas.game_state import GameState

    p1 = User(telegram_id=970001, first_name="P1", elo=1000, xp=0)
    p2 = User(telegram_id=970002, first_name="P2", elo=1000, xp=0)
    db_session.add(p1)
    db_session.add(p2)
    await db_session.commit()
    await db_session.refresh(p1)
    await db_session.refresh(p2)

    # Winner base = 20, blitz bonus = 10, total = 30 XP (moves = 4, which is <= 24)
    state = GameState(
        fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        turn="w",
        is_check=False,
        is_checkmate=False,
        is_stalemate=False,
        legal_moves=[],
        is_game_over=True,
        winner="w",
        result_type="checkmate",
        white_player_id=970001,
        black_player_id=970002,
        time_control_seconds=600,
        white_time_left=600.0,
        black_time_left=600.0,
        move_history=["f2f3", "e7e5", "g2g4", "d8h4"]
    )

    service = GameService()
    await service.end_game("test_blitz_game", state)

    await db_session.refresh(p1)
    assert p1.xp == 30


@pytest.mark.asyncio
async def test_david_vs_goliath_comeback_bonus(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    from app.services.game_service import GameService
    from app.schemas.game_state import GameState

    # P1 (1000 ELO) beats P2 (1200 ELO) -> ELO diff 200 >= 150
    # Winner base = 20, comeback bonus = 15, total = 35 XP
    p1 = User(telegram_id=980001, first_name="P1", elo=1000, xp=0)
    p2 = User(telegram_id=980002, first_name="P2", elo=1200, xp=0)
    db_session.add(p1)
    db_session.add(p2)
    await db_session.commit()
    await db_session.refresh(p1)
    await db_session.refresh(p2)

    state = GameState(
        fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        turn="w",
        is_check=False,
        is_checkmate=False,
        is_stalemate=False,
        legal_moves=[],
        is_game_over=True,
        winner="w",
        result_type="checkmate",
        white_player_id=980001,
        black_player_id=980002,
        time_control_seconds=600,
        white_time_left=600.0,
        black_time_left=600.0,
        move_history=["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6", "e1g1", "f8e7", "f1e1", "b7b5", "a4b3", "d7d6", "c2c3", "e8g8", "h2h3", "c6a5", "b3c2", "c7c5", "d2d4", "d8c7", "d4d5", "a5c4", "b2b3", "c4b6"]
    )

    service = GameService()
    await service.end_game("test_comeback_game", state)

    await db_session.refresh(p1)
    assert p1.xp == 35


@pytest.mark.asyncio
async def test_permanent_achievements_initialization(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    from app.models.gamification import UserTask, Task, TaskType
    
    # Seed achievements into test db
    ach1 = Task(id=101, title_key="ach_first_win", description_key="First Blood", xp_reward=50, task_type=TaskType.WIN, target_count=1, is_daily=False)
    ach2 = Task(id=102, title_key="ach_win_10", description_key="Novice Victor", xp_reward=150, task_type=TaskType.WIN, target_count=10, is_daily=False)
    ach3 = Task(id=103, title_key="ach_play_25", description_key="Chess Enthusiast", xp_reward=250, task_type=TaskType.PLAY, target_count=25, is_daily=False)
    ach4 = Task(id=104, title_key="ach_refer_5", description_key="Network Builder", xp_reward=500, task_type=TaskType.REFER, target_count=5, is_daily=False)
    db_session.add_all([ach1, ach2, ach3, ach4])
    await db_session.commit()

    # Create a fresh user
    user = User(telegram_id=990001, first_name="Tester", xp=0)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Initialize achievements
    await GamificationService.get_or_create_achievements(db_session, user.id)

    # Verify achievement records created in user_tasks
    result = await db_session.execute(
        select(UserTask, Task)
        .join(Task, UserTask.task_id == Task.id)
        .where(UserTask.user_id == user.id)
    )
    user_tasks = result.all()
    
    # Filter to only permanent achievements (is_daily=False)
    achievements = [ut for ut, t in user_tasks if not t.is_daily]
    assert len(achievements) == 4
    
    first_win_ut = next(ut for ut, t in user_tasks if t.title_key == "ach_first_win")
    assert first_win_ut.progress == 0
    assert not first_win_ut.completed

    # Trigger progress update for WIN
    await GamificationService.update_task_progress(db_session, user.id, TaskType.WIN)
    
    await db_session.refresh(first_win_ut)
    assert first_win_ut.progress == 1
    assert first_win_ut.completed


@pytest.mark.asyncio
async def test_xp_tier_escalating_commission(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    from app.services.referral_commission_service import ReferralCommissionService

    # 1. Test L1-L3 eligibility and XP tier rates (some Free, some Premium)
    # L1: Elite, Premium, level 51 (10000 XP)
    r1 = User(telegram_id=500001, first_name="R1_Elite", is_premium=True, xp=10000, level=51, balance=0)
    # L2: Master, Free, level 41 (8000 XP)
    r2 = User(telegram_id=500002, first_name="R2_Master", is_premium=False, xp=8000, level=41, balance=0)
    # L3: Knight, Premium, level 25 (4800 XP)
    r3 = User(telegram_id=500003, first_name="R3_Knight", is_premium=True, xp=4800, level=25, balance=0)
    # L4: Pawn, Premium, level 15 (2800 XP)
    r4 = User(telegram_id=500004, first_name="R4_Pawn", is_premium=True, xp=2800, level=15, balance=0)
    # L5: Recruit, Premium, level 5 (800 XP)
    r5 = User(telegram_id=500005, first_name="R5_Recruit", is_premium=True, xp=800, level=5, balance=0)
    # L6: Elite, Free, level 60 (12000 XP) -> L6 is deep referral, but not Premium
    r6 = User(telegram_id=500006, first_name="R6_Elite_Free", is_premium=False, xp=12000, level=60, balance=0)

    db_session.add_all([r1, r2, r3, r4, r5, r6])
    await db_session.commit()

    # Link player to r1 -> r2 -> r3 -> r4 -> r5 -> r6
    player = User(telegram_id=500007, first_name="Player", is_premium=False, balance=0)
    db_session.add(player)
    await db_session.commit()

    db_session.add(Referral(referrer_id=r1.id, referred_user_id=player.id))
    db_session.add(Referral(referrer_id=r2.id, referred_user_id=r1.id))
    db_session.add(Referral(referrer_id=r3.id, referred_user_id=r2.id))
    db_session.add(Referral(referrer_id=r4.id, referred_user_id=r3.id))
    db_session.add(Referral(referrer_id=r5.id, referred_user_id=r4.id))
    db_session.add(Referral(referrer_id=r6.id, referred_user_id=r5.id))
    await db_session.commit()

    wager = 100000
    total_dist = await ReferralCommissionService.distribute_wager_commissions(db_session, "test_escalating", player.id, wager, is_winner=True)
    await db_session.commit()

    await db_session.refresh(r1)
    await db_session.refresh(r2)
    await db_session.refresh(r3)
    await db_session.refresh(r4)
    await db_session.refresh(r5)
    await db_session.refresh(r6)

    # L1 (r1) gets Elite L1 = 0.7% of 200000 pot = 1400 cents
    assert r1.balance == 1400
    # L2 (r2) gets Elite L2 = 0.4% of 200000 pot = 800 cents
    assert r2.balance == 800
    # L3 (r3) gets Elite L3 = 0.3% of 200000 pot = 600 cents
    assert r3.balance == 600
    # L4 (r4) is Pawn, so L4 is not supported on Pawn tier (only L1-L2) -> gets 0
    assert r4.balance == 0
    # L5 (r5) is Recruit, so L5 is not supported on Recruit tier (only L1) -> gets 0
    assert r5.balance == 0
    # L6 (r6) is Free, so skipped
    assert r6.balance == 0
    assert total_dist == 2800

    # 2. Test L4-L6 deep commissions with Premium referrers
    r1_p = User(telegram_id=600001, first_name="R1_P", is_premium=True, xp=800, level=5, balance=0)
    r2_p = User(telegram_id=600002, first_name="R2_P", is_premium=True, xp=2800, level=15, balance=0)
    r3_p = User(telegram_id=600003, first_name="R3_P", is_premium=True, xp=4800, level=25, balance=0)
    r4_p = User(telegram_id=600004, first_name="R4_P", is_premium=True, xp=8800, level=45, balance=0)
    r5_p = User(telegram_id=600005, first_name="R5_P", is_premium=True, xp=10800, level=55, balance=0)
    r6_p = User(telegram_id=600006, first_name="R6_P", is_premium=True, xp=12800, level=65, balance=0)

    db_session.add_all([r1_p, r2_p, r3_p, r4_p, r5_p, r6_p])
    await db_session.commit()

    player2 = User(telegram_id=600007, first_name="Player2", is_premium=False, balance=0)
    db_session.add(player2)
    await db_session.commit()

    db_session.add(Referral(referrer_id=r1_p.id, referred_user_id=player2.id))
    db_session.add(Referral(referrer_id=r2_p.id, referred_user_id=r1_p.id))
    db_session.add(Referral(referrer_id=r3_p.id, referred_user_id=r2_p.id))
    db_session.add(Referral(referrer_id=r4_p.id, referred_user_id=r3_p.id))
    db_session.add(Referral(referrer_id=r5_p.id, referred_user_id=r4_p.id))
    db_session.add(Referral(referrer_id=r6_p.id, referred_user_id=r5_p.id))
    await db_session.commit()

    total_dist_p = await ReferralCommissionService.distribute_wager_commissions(db_session, "test_escalating_p", player2.id, wager, is_winner=True)
    await db_session.commit()

    await db_session.refresh(r1_p)
    await db_session.refresh(r2_p)
    await db_session.refresh(r3_p)
    await db_session.refresh(r4_p)
    await db_session.refresh(r5_p)
    await db_session.refresh(r6_p)

    # L1 (r1_p): Recruit, L1 = 2% of 200000 pot = 4000 cents
    assert r1_p.balance == 4000
    # L2 (r2_p): Pawn, L2 = 0% of 200000 pot = 0 cents
    assert r2_p.balance == 0
    # L3 (r3_p): Knight, L3 = 0% of 200000 pot = 0 cents
    assert r3_p.balance == 0
    # L4 (r4_p): Master, L4 = 0% of 200000 pot = 0 cents
    assert r4_p.balance == 0
    # L5 (r5_p): Elite, L5 = 0% of 200000 pot = 0 cents
    assert r5_p.balance == 0
    # L6 (r6_p): Elite, L6 = 0% of 200000 pot = 0 cents
    assert r6_p.balance == 0
    assert total_dist_p == 4000


@pytest.mark.asyncio
async def test_subscription_commission_distribution(db_session):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    from app.models.user import User
    from app.models.gamification import Referral
    from app.services.referral_commission_service import ReferralCommissionService

    # 1. Create a chain of 6 referrers
    # Free referrers:
    r1 = User(telegram_id=700001, first_name="R1", is_premium=False, xp=800, level=5, balance=0) # Recruit
    r2 = User(telegram_id=700002, first_name="R2", is_premium=False, xp=2800, level=15, balance=0) # Pawn
    r3 = User(telegram_id=700003, first_name="R3", is_premium=False, xp=4800, level=25, balance=0) # Knight
    r4 = User(telegram_id=700004, first_name="R4", is_premium=False, xp=8800, level=45, balance=0) # Master
    r5 = User(telegram_id=700005, first_name="R5", is_premium=False, xp=10800, level=55, balance=0) # Elite
    r6 = User(telegram_id=700006, first_name="R6", is_premium=False, xp=12800, level=65, balance=0) # Elite

    db_session.add_all([r1, r2, r3, r4, r5, r6])
    await db_session.commit()

    player = User(telegram_id=700007, first_name="Player", is_premium=False, balance=0)
    db_session.add(player)
    await db_session.commit()

    db_session.add(Referral(referrer_id=r1.id, referred_user_id=player.id))
    db_session.add(Referral(referrer_id=r2.id, referred_user_id=r1.id))
    db_session.add(Referral(referrer_id=r3.id, referred_user_id=r2.id))
    db_session.add(Referral(referrer_id=r4.id, referred_user_id=r3.id))
    db_session.add(Referral(referrer_id=r5.id, referred_user_id=r4.id))
    db_session.add(Referral(referrer_id=r6.id, referred_user_id=r5.id))
    await db_session.commit()

    # Purchase price = $295.80 (29580 cents)
    price = 29580
    total_dist = await ReferralCommissionService.distribute_subscription_commissions(db_session, player.id, price)
    await db_session.commit()

    await db_session.refresh(r1)
    await db_session.refresh(r2)
    await db_session.refresh(r3)
    await db_session.refresh(r4)
    await db_session.refresh(r5)
    await db_session.refresh(r6)

    # L1 (r1) gets Recruit L1 = 15.0% of 29580 = 4437 cents
    assert r1.balance == 4437
    # L2 (r2) gets Recruit L2 = 0% of 29580 = 0 cents
    assert r2.balance == 0
    # L3 (r3) gets Recruit L3 = 0% of 29580 = 0 cents
    assert r3.balance == 0
    # L4 (r4) gets Recruit L4 = 0% = 0 cents
    assert r4.balance == 0
    # L5 (r5) gets Recruit L5 = 0% = 0 cents
    assert r5.balance == 0
    # L6 (r6) gets Recruit L6 = 0% = 0 cents
    assert r6.balance == 0
    assert total_dist == 4437

    # 2. Now test with Premium referrers
    r1_p = User(telegram_id=800001, first_name="R1_P", is_premium=True, xp=800, level=5, balance=0)
    r2_p = User(telegram_id=800002, first_name="R2_P", is_premium=True, xp=2800, level=15, balance=0)
    r3_p = User(telegram_id=800003, first_name="R3_P", is_premium=True, xp=4800, level=25, balance=0)
    r4_p = User(telegram_id=800004, first_name="R4_P", is_premium=True, xp=8800, level=45, balance=0)
    r5_p = User(telegram_id=800005, first_name="R5_P", is_premium=True, xp=10800, level=55, balance=0)
    r6_p = User(telegram_id=800006, first_name="R6_P", is_premium=True, xp=12800, level=65, balance=0)

    db_session.add_all([r1_p, r2_p, r3_p, r4_p, r5_p, r6_p])
    await db_session.commit()

    player2 = User(telegram_id=800007, first_name="Player2", is_premium=False, balance=0)
    db_session.add(player2)
    await db_session.commit()

    db_session.add(Referral(referrer_id=r1_p.id, referred_user_id=player2.id))
    db_session.add(Referral(referrer_id=r2_p.id, referred_user_id=r1_p.id))
    db_session.add(Referral(referrer_id=r3_p.id, referred_user_id=r2_p.id))
    db_session.add(Referral(referrer_id=r4_p.id, referred_user_id=r3_p.id))
    db_session.add(Referral(referrer_id=r5_p.id, referred_user_id=r4_p.id))
    db_session.add(Referral(referrer_id=r6_p.id, referred_user_id=r5_p.id))
    await db_session.commit()

    total_dist_p = await ReferralCommissionService.distribute_subscription_commissions(db_session, player2.id, price)
    await db_session.commit()

    await db_session.refresh(r1_p)
    await db_session.refresh(r2_p)
    await db_session.refresh(r3_p)
    await db_session.refresh(r4_p)
    await db_session.refresh(r5_p)
    await db_session.refresh(r6_p)

    # L1 (r1_p): Recruit -> 15% of 29580 = 4437 cents
    assert r1_p.balance == 4437
    # L2 (r2_p): Pawn -> 0% of 29580 = 0 cents
    assert r2_p.balance == 0
    # L3 (r3_p): Knight -> 0% of 29580 = 0 cents
    assert r3_p.balance == 0
    # L4 (r4_p): Master -> 0% of 29580 = 0 cents
    assert r4_p.balance == 0
    # L5 (r5_p): Elite -> 0% of 29580 = 0 cents
    assert r5_p.balance == 0
    # L6 (r6_p): Elite -> 0% of 29580 = 0 cents
    assert r6_p.balance == 0
    assert total_dist_p == 4437
@pytest.mark.asyncio
async def test_referral_ach_self_healing(db_session: AsyncSession):
    # Skip if using mock session
    if hasattr(db_session, "users"):
        return

    from app.models.gamification import UserTask, Task, TaskType, Referral
    from app.services.gamification_service import GamificationService

    # 1. Create referrer
    referrer = User(telegram_id=991001, first_name="Referrer", xp=0, referral_code="REF991")
    db_session.add(referrer)
    await db_session.commit()
    await db_session.refresh(referrer)

    # 2. Add referrers tasks definition (ach_refer_5)
    ach = Task(id=104, title_key="ach_refer_5", description_key="Invite 5 friends", xp_reward=500, task_type=TaskType.REFER, target_count=5, is_daily=False)
    db_session.add(ach)
    await db_session.commit()

    # 3. Create 3 recruits (referrals)
    recruits = []
    for i in range(3):
        rec = User(telegram_id=991100 + i, first_name=f"Recruit_{i}", xp=0)
        db_session.add(rec)
        await db_session.commit()
        await db_session.refresh(rec)
        recruits.append(rec)
        
        # Link referral
        ref = Referral(referrer_id=referrer.id, referred_user_id=rec.id)
        db_session.add(ref)
        await db_session.commit()

    # 4. Trigger self-healing via get_or_create_achievements
    await GamificationService.get_or_create_achievements(db_session, referrer.id)

    # Verify achievement progress has been synced to 3
    result = await db_session.execute(
        select(UserTask).where(UserTask.user_id == referrer.id, UserTask.task_id == ach.id)
    )
    user_task = result.scalars().first()
    assert user_task is not None
    assert user_task.progress == 3
    assert not user_task.completed

    # 5. Add two more recruits to reach 5
    for i in range(3, 5):
        rec = User(telegram_id=991100 + i, first_name=f"Recruit_{i}", xp=0)
        db_session.add(rec)
        await db_session.commit()
        await db_session.refresh(rec)

        # Process referral using the real-time flow
        success = await GamificationService.process_referral(db_session, rec, "REF991")
        assert success is True

        # Simulate the recruit playing 3 games to trigger the milestone
        rec.games_played = 3
        db_session.add(rec)
        await db_session.commit()
        await db_session.refresh(rec)
        await _add_qualifying_games(db_session, rec.telegram_id)

        await GamificationService.check_referral_game_milestone(db_session, rec.id)

    # Refresh user task and check it is completed (5/5)
    await db_session.refresh(user_task)
    assert user_task.progress == 5
    assert user_task.completed


@pytest.mark.asyncio
async def test_circular_referral_loop_prevention(db_session: AsyncSession):
    if hasattr(db_session, "users"):
        return

    # Create two users: A and B
    user_a = User(telegram_id=992201, first_name="UserA", referral_code="CODEA")
    user_b = User(telegram_id=992202, first_name="UserB", referral_code="CODEB")
    db_session.add_all([user_a, user_b])
    await db_session.commit()
    await db_session.refresh(user_a)
    await db_session.refresh(user_b)

    # 1. A refers B (should succeed)
    success1 = await GamificationService.process_referral(db_session, user_b, "CODEA")
    assert success1 is True

    # 2. B attempts to refer A (should fail because A is B's parent)
    success2 = await GamificationService.process_referral(db_session, user_a, "CODEB")
    assert success2 is False


@pytest.mark.asyncio
async def test_referrer_chain_loop_breaking(db_session: AsyncSession):
    if hasattr(db_session, "users"):
        return

    # Create two users: A and B
    user_a = User(telegram_id=992301, first_name="UserA", referral_code="CODEA")
    user_b = User(telegram_id=992302, first_name="UserB", referral_code="CODEB")
    db_session.add_all([user_a, user_b])
    await db_session.commit()
    await db_session.refresh(user_a)
    await db_session.refresh(user_b)

    # Manually inject a circular loop in the database bypass of service validation to test retrieval robustness:
    # A refers B and B refers A
    ref1 = Referral(referrer_id=user_a.id, referred_user_id=user_b.id)
    ref2 = Referral(referrer_id=user_b.id, referred_user_id=user_a.id)
    db_session.add_all([ref1, ref2])
    await db_session.commit()

    # When retrieving the chain for user_a, it should not infinitely loop or contain duplicates
    from app.services.referral_commission_service import ReferralCommissionService
    chain = await ReferralCommissionService.get_referrer_chain(db_session, user_a.id, levels=6)
    
    # The chain should break the cycle and only return user_b, not containing user_a itself
    assert len(chain) == 1
    assert chain[0].id == user_b.id


@pytest.mark.asyncio
async def test_ai_match_xp_daily_cap(db_session: AsyncSession):
    if hasattr(db_session, "users"):
        return

    # Create a user
    user = User(telegram_id=992401, first_name="UserAI", xp=0)
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # 1. Earn 100 XP from AI match (should succeed)
    user = await GamificationService.add_xp(db_session, user, 100, reason="ai_match")
    await db_session.commit()
    assert user.xp == 100

    # 2. Earn another 100 XP (should succeed)
    user = await GamificationService.add_xp(db_session, user, 100, reason="ai_match")
    await db_session.commit()
    assert user.xp == 200

    # 3. Earn another 100 XP (should hit daily cap of 250, only adding 50 XP)
    user = await GamificationService.add_xp(db_session, user, 100, reason="ai_match")
    await db_session.commit()
    assert user.xp == 250

    # 4. Earn another 100 XP (should be completely capped, adding 0 XP)
    user = await GamificationService.add_xp(db_session, user, 100, reason="ai_match")
    await db_session.commit()
    assert user.xp == 250

    # 5. Earn XP from regular activities (should bypass AI match cap)
    user = await GamificationService.add_xp(db_session, user, 100, reason="game_win")
    await db_session.commit()
    assert user.xp == 350
