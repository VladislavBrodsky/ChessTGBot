from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock
import pytest
from sqlalchemy import select, func
from app.core.config import get_settings
from app.models.user import User
from app.models.gamification import Referral
from app.models.transaction import Transaction
from app.models.game_history import GameHistory
from app.models.gram_reward import GramReward
from app.services.gamification_service import GamificationService
from app.services.telegram_bot import TelegramService

@pytest.mark.asyncio
async def test_original_referrer_is_preserved(db_session,monkeypatch):
    notify=AsyncMock(); monkeypatch.setattr(TelegramService,'send_notification',notify)
    first=User(telegram_id=847001,first_name='First',referral_code='FIRSTAUDIT')
    second=User(telegram_id=847002,first_name='Second',referral_code='SECONDAUDIT')
    friend=User(telegram_id=847003,first_name='<Friend>')
    db_session.add_all([first,second,friend]); await db_session.commit()
    assert await GamificationService.process_referral(db_session,friend,'ref_FIRSTAUDIT')
    assert not await GamificationService.process_referral(db_session,friend,'ref_SECONDAUDIT')
    rows=(await db_session.execute(select(Referral).where(Referral.referred_user_id==friend.id))).scalars().all()
    assert len(rows)==1 and rows[0].referrer_id==first.id
    copy=' '.join(c.args[1] for c in notify.await_args_list)
    assert 'free ranked game' not in copy and '3 qualifying paid human matches' in copy
    assert '&lt;Friend&gt;' in copy

@pytest.mark.asyncio
async def test_own_signup_bonus_does_not_use_invitation_cap(db_session,monkeypatch):
    monkeypatch.setattr(get_settings(),'REFERRAL_SIGNUP_BONUS_DAILY_CAP',1)
    inviter=User(telegram_id=847010,first_name='Inviter',balance=5,level=1)
    friend=User(telegram_id=847011,first_name='Friend',level=1)
    db_session.add_all([inviter,friend]); await db_session.flush()
    db_session.add(Referral(referrer_id=inviter.id,referred_user_id=friend.id,created_at=datetime.now(timezone.utc).replace(tzinfo=None)-timedelta(hours=1)))
    db_session.add(Transaction(user_id=inviter.telegram_id,type='referral_commission',amount=5,status='completed',reference_id='ref_signup_bonus_recruit_847010'))
    for n in range(3):
        db_session.add(GameHistory(game_id=f'cap-audit-{n}',white_player_id=friend.telegram_id,black_player_id=847012,game_type='online',bid_amount=100,total_moves=30,result_type='resignation'))
    await db_session.commit()
    assert await GamificationService.check_referral_game_milestone(db_session,friend.id)
    await db_session.commit(); await db_session.refresh(inviter)
    assert inviter.balance==15

@pytest.mark.asyncio
async def test_three_settled_games_credit_wallet_once(client,db_session,monkeypatch):
    from app.services.game_service import GameService
    from app.api.v1.endpoints.users import get_referral_stats
    from app.core.socket import sio
    monkeypatch.setattr(TelegramService,'send_notification',AsyncMock()); monkeypatch.setattr(sio,'emit',AsyncMock())
    inviter=User(telegram_id=123456789,first_name='Inviter',referral_code='FLOWAUDIT',balance=0,level=1)
    friend=User(telegram_id=847021,first_name='Friend',balance=300,level=1)
    opponent=User(telegram_id=847022,first_name='Opponent',balance=1000,level=1)
    db_session.add_all([inviter,friend,opponent]); await db_session.commit()
    assert await GamificationService.process_referral(db_session,friend,'ref_FLOWAUDIT')
    db_session.add(Transaction(user_id=friend.telegram_id,type='deposit',amount=300,status='completed',reference_id='audit-local-deposit')); await db_session.commit()
    service=GameService()
    moves=['e2e4','e7e5','g1f3','b8c6','f1c4','g8f6','d2d3','f8c5','b1c3','d7d6','c1g5','h7h6']
    for n in range(3):
        game=f'referral-local-audit-{n}'
        await service.create_game(game,is_bot_game=False,bid_amount=100)
        await service.join_game(game,friend.telegram_id,accept_wager=True); await service.join_game(game,opponent.telegram_id,accept_wager=True)
        for move in moves: assert await service.make_move(game,move) is not None
        state=await service.resign_game(game,friend.telegram_id); assert state is not None
        await db_session.refresh(inviter)
        stats=await get_referral_stats(db_session,inviter)
        assert stats.milestone_progress.qualified == (1 if n==2 else 0)
        assert stats.milestone_progress.usdt_credited == (1 if n==2 else 0)
        assert stats.milestone_progress.gram_credited == (1 if n==2 else 0)
        await service.end_game(game,state)
    wallet=await client.get('/api/v1/wallet/balance'); assert wallet.status_code==200
    await db_session.refresh(inviter)
    assert wallet.json()['balance']==inviter.balance
    assert wallet.json()['gram_rewards_nano']=='1000000000'
    assert (await db_session.execute(select(func.count(Transaction.id)).where(Transaction.reference_id=='ref_signup_bonus_847021',Transaction.status=='completed'))).scalar_one()==1
    assert (await db_session.execute(select(func.count(GramReward.id)).where(GramReward.source_key==f'referral:{friend.id}'))).scalar_one()==1
