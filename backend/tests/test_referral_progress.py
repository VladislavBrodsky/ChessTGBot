from datetime import datetime, timedelta, timezone
import pytest
from app.models.user import User
from app.models.gamification import Referral
from app.models.game_history import GameHistory
from app.models.transaction import Transaction
from app.api.v1.endpoints.users import get_referral_stats
from app.services.gamification_service import GamificationService

@pytest.mark.asyncio
async def test_qualification_is_not_credit_and_stats_are_read_only(db_session):
    inviter = User(telegram_id=827701, first_name='Inviter', balance=0, level=1)
    recruit = User(telegram_id=827702, first_name='Friend', balance=0, level=1)
    db_session.add_all([inviter, recruit]); await db_session.flush()
    joined = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=1)
    db_session.add(Referral(referrer_id=inviter.id, referred_user_id=recruit.id, created_at=joined))
    games=[]
    for i in range(3):
        g=GameHistory(game_id=f'progress-{i}', white_player_id=recruit.telegram_id, black_player_id=827703,
                      game_type='computer', bid_amount=0, result_type='checkmate', total_moves=30)
        games.append(g); db_session.add(g)
    await db_session.commit()
    stats=await get_referral_stats(db_session,inviter)
    assert stats.milestone_progress.pending_activity == 1
    assert stats.milestone_progress.qualified == 0
    assert stats.reward_terms.referrer_bonus_cents == 10
    for game in games:
        game.game_type='online'; game.bid_amount=100
    await db_session.commit()
    stats=await get_referral_stats(db_session,inviter)
    assert stats.milestone_progress.qualified == 1
    assert stats.milestone_progress.usdt_credited == 0
    assert stats.milestone_progress.gram_credited == 0
    assert inviter.balance == 0
    db_session.add(Transaction(user_id=recruit.telegram_id,type='deposit',amount=100,status='completed',reference_id='progress-deposit'))
    await db_session.commit()
    await GamificationService.check_referral_game_milestone(db_session,recruit.id); await db_session.commit()
    await GamificationService.check_referral_game_milestone(db_session,recruit.id); await db_session.commit()
    stats=await get_referral_stats(db_session,inviter)
    assert stats.milestone_progress.usdt_credited == 1
    assert stats.milestone_progress.gram_credited == 1
    assert inviter.balance == 10
