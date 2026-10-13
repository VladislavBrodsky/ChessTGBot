from datetime import datetime, timedelta, timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import AsyncMock
import pytest
from sqlalchemy import select
from app.models.user import User
from app.models.gamification import Task, TaskType, UserTask, Referral
from app.models.game_history import GameHistory
from app.models.gram_reward import GramReward
from app.services import gram_rewards as rewards, gram_quote as rates
from app.services.gamification_service import GamificationService

@pytest.mark.asyncio
async def test_credit_exact_once_and_rollback(db_session):
    user = User(telegram_id=818100, first_name='Ledger', balance=900)
    db_session.add(user); await db_session.commit()
    assert await rewards.credit_reward(db_session, user, 500_000_000, 'test:once', 'task', 'Reward')
    assert not await rewards.credit_reward(db_session, user, 500_000_000, 'test:once', 'task', 'Reward')
    await db_session.commit()
    assert await rewards.earned_gram_nano(db_session, user.id) == 500_000_000
    assert user.balance == 900
    # A read-only outer transaction must still contain its nested credit.
    await db_session.commit()
    assert await rewards.credit_reward(db_session, user, 100_000_000, 'test:rolledback', 'task', 'Reward')
    user_id = user.id
    await db_session.rollback()
    assert await rewards.earned_gram_nano(db_session, user_id) == 500_000_000

@pytest.mark.asyncio
async def test_task_claim_atomic_and_server_prize(db_session):
    user = User(telegram_id=818101, first_name='Task', balance=500, level=1)
    task = Task(title_key='daily_login', task_type=TaskType.LOGIN, xp_reward=50, target_count=1, is_daily=True)
    db_session.add_all([user, task]); await db_session.flush()
    db_session.add(UserTask(user_id=user.id, task_id=task.id, completed=True, progress=1)); await db_session.commit()
    first, _ = await GamificationService.claim_task(db_session, user.id, task.id)
    assert first is not None
    assert await rewards.earned_gram_nano(db_session, user.id) == 100_000_000
    second, _ = await GamificationService.claim_task(db_session, user.id, task.id)
    assert second is None
    assert await rewards.earned_gram_nano(db_session, user.id) == 100_000_000
    assert user.balance == 500

@pytest.mark.asyncio
async def test_membership_required_even_if_task_completed(db_session, monkeypatch):
    user = User(telegram_id=818102, first_name='Member', level=1)
    task = Task(title_key='join_channel', task_type=TaskType.LOGIN, xp_reward=100, is_daily=False)
    db_session.add_all([user, task]); await db_session.flush()
    db_session.add(UserTask(user_id=user.id, task_id=task.id, completed=True)); await db_session.commit()
    monkeypatch.setattr(rewards, 'verify_channel_membership', AsyncMock(return_value=False))
    result, _ = await GamificationService.claim_task(db_session, user.id, task.id)
    assert result is None
    assert await rewards.earned_gram_nano(db_session, user.id) == 0
    monkeypatch.setattr(rewards, 'verify_channel_membership', AsyncMock(return_value=True))
    result, _ = await GamificationService.claim_task(db_session, user.id, task.id)
    assert result is not None
    assert await rewards.earned_gram_nano(db_session, user.id) == 500_000_000

@pytest.mark.asyncio
@pytest.mark.parametrize('invalid', ['free', 'computer', 'aborted', 'short', 'before_referral', 'no_deposit', 'none'])
async def test_referral_three_paid_human_games_only(db_session, invalid):
    inviter = User(telegram_id=818103, first_name='Inviter', level=1)
    recruit = User(telegram_id=818104, first_name='<Friend>', level=1)
    db_session.add_all([inviter, recruit]); await db_session.flush()
    joined = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=1)
    db_session.add(Referral(referrer_id=inviter.id, referred_user_id=recruit.id, created_at=joined)); await db_session.commit()
    if invalid != 'no_deposit':
        from app.models.transaction import Transaction
        db_session.add(Transaction(user_id=recruit.telegram_id, type='deposit', amount=1000, status='completed', reference_id=f'dep-{invalid}'))
    for i in range(3):
        args = dict(game_id=f'gram-{invalid}-{i}', white_player_id=recruit.telegram_id, black_player_id=818105,
                    bid_amount=100, game_type='online', total_moves=20, result_type='checkmate')
        if invalid != 'none' and i == 2:
            if invalid == 'free': args['bid_amount'] = 0
            if invalid == 'computer': args['black_player_id'] = -1; args['game_type'] = 'computer'
            if invalid == 'aborted': args['result_type'] = 'aborted'
            if invalid == 'short': args['total_moves'] = 1
            if invalid == 'before_referral': args['ended_at'] = joined - timedelta(seconds=1)
        db_session.add(GameHistory(**args))
    await db_session.commit()
    await GamificationService.check_referral_game_milestone(db_session, recruit.id); await db_session.commit()
    assert await rewards.earned_gram_nano(db_session, inviter.id) == (1_000_000_000 if invalid == 'none' else 0)
    if invalid == 'no_deposit':
        from app.models.transaction import Transaction
        db_session.add(Transaction(user_id=recruit.telegram_id, type='deposit', amount=1000, status='completed', reference_id='later-deposit'))
        await db_session.commit()
        await rewards.check_referral_after_deposit(db_session, recruit.id)
        assert await rewards.earned_gram_nano(db_session, inviter.id) == 1_000_000_000
    if invalid == 'none':
        await GamificationService.check_referral_game_milestone(db_session, recruit.id); await db_session.commit()
        assert await rewards.earned_gram_nano(db_session, inviter.id) == 1_000_000_000
        entry = (await db_session.execute(select(GramReward))).scalar_one()
        assert '&lt;Friend&gt;' in entry.notification_text
        assert entry.notification_status == 'pending'

def test_prizes_and_exact_format():
    assert rewards.format_gram(500_000_000) == '0.5'
    assert rewards.format_gram(1_000_000_000) == '1'
    assert rewards.task_reward_nano(SimpleNamespace(task_type=TaskType.REFER, title_key='refer', xp_reward=500)) == 0
    assert all(100_000_000 <= amount <= 1_000_000_000 for amount in rewards.TASK_REWARDS.values())

@pytest.mark.asyncio
async def test_quote_cache_depeg_and_missing_provider(monkeypatch):
    rates._cached = None; rates._retry_after = 0
    monkeypatch.setattr(rates, '_redis', AsyncMock(return_value=None))
    import json
    master = rates.get_settings().USDT_MASTER
    response = SimpleNamespace(text=json.dumps({'rates': {'TON': {'prices': {'USD': 2}}, master: {'prices': {'USD': 0.98}}}}), raise_for_status=lambda: None)
    get = AsyncMock(return_value=response)
    client = AsyncMock(); client.get = get; client.__aenter__.return_value = client
    monkeypatch.setattr(rates.httpx, 'AsyncClient', lambda **kwargs: client)
    first = await rates.get_gram_quote()
    assert first.gram_per_usdt == Decimal('0.49')
    assert await rates.get_gram_quote() is first
    assert get.await_count == 1
    rates._cached = rates.GramQuote(Decimal('0.49'), datetime.now(timezone.utc) - timedelta(minutes=6))
    get.side_effect = RuntimeError('Unavailable')
    assert (await rates.get_gram_quote()).payload()['stale'] is True
    rates._cached = rates.GramQuote(Decimal('0.49'), datetime.now(timezone.utc) - timedelta(minutes=16))
    assert await rates.get_gram_quote() is None
    rates._cached = None; rates._retry_after = 0

@pytest.mark.parametrize('value', ['NaN', 'Infinity', '-1', '0', None, {}])
def test_invalid_quotes_never_used(value):
    assert rates._positive_decimal(value) is None


@pytest.mark.asyncio
async def test_leaderboard_private_default_and_exact_real_values(db_session, monkeypatch):
    from app.api.v1.endpoints import users
    private = User(telegram_id=819100, first_name="Private", balance=99999)
    public = User(telegram_id=819101, first_name="Public", balance=1000, gram_leaderboard_visible=True)
    db_session.add_all([private, public]); await db_session.commit()
    await rewards.credit_reward(db_session, public, 500_000_000, "ranking", "task", "Reward"); await db_session.commit()
    monkeypatch.setattr(rates, "get_gram_quote", AsyncMock(return_value=rates.GramQuote(Decimal("0.5"), datetime.now(timezone.utc))))
    result = await users.gram_leaderboard(db_session)
    assert len(result["players"]) == 1
    row = result["players"][0]
    assert row["first_name"] == "Public"
    assert Decimal(row["gram_value"]) == Decimal("5.5")
    assert "balance" not in row and "gram_rewards_nano" not in row


@pytest.mark.asyncio
async def test_notification_committed_only_and_ambiguous_not_retried(db_session, monkeypatch):
    from sqlalchemy.ext.asyncio import async_sessionmaker
    from app.services.telegram_bot import TelegramService
    from telegram.error import NetworkError
    user = User(telegram_id=819102, first_name="Notify")
    db_session.add(user); await db_session.commit()
    await rewards.credit_reward(db_session, user, 100_000_000, "notify:committed", "task", "Reward"); await db_session.commit()
    monkeypatch.setattr(rewards, "AsyncSessionLocal", async_sessionmaker(db_session.bind, expire_on_commit=False))
    monkeypatch.setattr(rewards, "get_settings", lambda: SimpleNamespace(TELEGRAM_BOT_TOKEN="test:no-network"))
    bot = SimpleNamespace(send_message=AsyncMock(side_effect=NetworkError("uncertain")))
    monkeypatch.setattr(TelegramService, "application", SimpleNamespace(bot=bot))
    assert await rewards.dispatch_notifications() == 0
    assert await rewards.dispatch_notifications() == 0
    assert bot.send_message.await_count == 1
    db_session.expire_all()
    status = (await db_session.execute(select(GramReward.notification_status))).scalar_one()
    assert status == "delivery_unknown"

@pytest.mark.asyncio
async def test_xp_failure_rolls_back_credit_and_claim(db_session, monkeypatch):
    user = User(telegram_id=819103, first_name='Rollback', level=1)
    task = Task(title_key='daily_win', task_type=TaskType.WIN, xp_reward=100, is_daily=True)
    db_session.add_all([user, task]); await db_session.flush()
    assigned = UserTask(user_id=user.id, task_id=task.id, completed=True)
    db_session.add(assigned); await db_session.commit()
    user_id, task_id, assigned_id = user.id, task.id, assigned.id
    monkeypatch.setattr(GamificationService, 'add_xp', AsyncMock(side_effect=RuntimeError('XP failed')))
    with pytest.raises(RuntimeError):
        await GamificationService.claim_task(db_session, user_id, task_id)
    await db_session.rollback()
    assert await rewards.earned_gram_nano(db_session, user_id) == 0
    assert (await db_session.get(UserTask, assigned_id)).claimed is False

@pytest.mark.asyncio
async def test_restricted_nonmember_cannot_verify(monkeypatch):
    from app.services.telegram_bot import TelegramService
    monkeypatch.setattr(rewards, 'get_settings', lambda: SimpleNamespace(TELEGRAM_BOT_TOKEN='test:no-network'))
    bot = SimpleNamespace(get_chat_member=AsyncMock(return_value=SimpleNamespace(status='restricted', is_member=False)))
    monkeypatch.setattr(TelegramService, 'application', SimpleNamespace(bot=bot))
    assert not await rewards.verify_channel_membership(819104, 'join_channel')
    bot.get_chat_member.return_value.is_member = True
    assert await rewards.verify_channel_membership(819104, 'join_channel')
