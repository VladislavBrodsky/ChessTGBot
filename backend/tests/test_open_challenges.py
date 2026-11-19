"""Open challenges: a staked game listed in the Play lobby for 30 minutes.

The money path is the paid friend invitation's (creator debited at create, guest
debited on consent, durable refund of an unfilled game). These tests pin the parts
that are new: who may see a challenge, that listing never costs anything when the
index write fails, and that the creator is called back safely.
"""
import time

import pytest
from sqlalchemy import select

from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.game_state import GameState
from app.services import open_challenges
from app.services.open_challenges import (
    OPEN_CHALLENGE_LISTED_SECONDS,
    accepted_message,
    is_listable,
    list_open,
)
from app.services.session_manager import SessionManager
from app.services.stale_game_sweeper import UNFILLED_WAGER_GRACE_SECONDS, is_sweepable

CREATOR = 123456789  # the conftest client's dev-fallback user
OTHER = 770002


def _state(**overrides) -> GameState:
    now = time.time()
    values = dict(
        fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", turn="w",
        is_check=False, is_checkmate=False, is_stalemate=False, is_game_over=False,
        legal_moves=[], white_player_id=CREATOR, white_username="Host", white_elo=1210,
        black_player_id=None, bid_amount=100, time_control_seconds=300,
        created_at=now - 60, open_challenge=True,
    )
    values.update(overrides)
    return GameState(**values)


@pytest.fixture
def memory_store(monkeypatch):
    monkeypatch.setattr(SessionManager, "_use_memory", True)
    monkeypatch.setattr(SessionManager, "_redis_client", None)
    monkeypatch.setattr(SessionManager, "_memory_store", {})
    return SessionManager()


def test_only_unfilled_live_staked_open_games_are_listable():
    now = time.time()
    assert is_listable(_state(), now)
    assert not is_listable(None, now)
    assert not is_listable(_state(open_challenge=False), now), "private invitations stay private"
    assert not is_listable(_state(black_player_id=OTHER), now), "already accepted"
    assert not is_listable(_state(is_game_over=True), now), "cancelled or finished"
    assert not is_listable(_state(bid_amount=0), now)
    assert not is_listable(_state(white_player_id=None), now)
    assert not is_listable(_state(created_at=None), now)
    assert not is_listable(_state(created_at=now - OPEN_CHALLENGE_LISTED_SECONDS), now), "about to be refunded"


def test_listing_window_closes_before_the_unfilled_refund():
    """An unaccepted open challenge goes through the existing durable refund, and
    disappears from the lobby before that refund can race an accept."""
    now = time.time()
    expired = _state(created_at=now - UNFILLED_WAGER_GRACE_SECONDS)
    assert is_sweepable(expired, now)
    assert not is_listable(expired, now)
    assert OPEN_CHALLENGE_LISTED_SECONDS < UNFILLED_WAGER_GRACE_SECONDS


@pytest.mark.asyncio
async def test_list_marks_the_viewers_own_challenge_and_prunes_dead_entries(memory_store):
    sm = memory_store
    now = time.time()
    games = {
        "own": _state(created_at=now - 30),
        "theirs": _state(white_player_id=OTHER, white_username="Guest", created_at=now - 300),
        "accepted": _state(white_player_id=OTHER, black_player_id=CREATOR),
        "expired": _state(white_player_id=OTHER, created_at=now - OPEN_CHALLENGE_LISTED_SECONDS - 1),
    }
    for game_id, state in games.items():
        await sm.save_game(game_id, state)
        await open_challenges.publish(sm, game_id)
    await open_challenges.publish(sm, "vanished")

    listed = await list_open(sm, CREATOR, now=now)

    assert [c["game_id"] for c in listed] == ["own", "theirs"]
    assert [c["mine"] for c in listed] == [True, False]
    theirs = listed[1]
    assert theirs["bid_amount"] == 100 and theirs["time_control"] == 300
    assert theirs["creator_name"] == "Guest"
    assert theirs["expires_at"] == int(games["theirs"].created_at + OPEN_CHALLENGE_LISTED_SECONDS)
    assert sm._memory_store[open_challenges.OPEN_CHALLENGES_KEY] == {"own", "theirs"}

    # Another player sees the same two, neither marked as theirs.
    assert [c["mine"] for c in await list_open(sm, 999, now=now)] == [False, False]


def test_callback_message_escapes_the_guests_display_name():
    text = accepted_message("<b>Eve</b> & co", 1300, 250, "https://t.me/bot/app?startapp=g1")
    assert "&lt;b&gt;Eve&lt;/b&gt; &amp; co" in text
    assert "<b>Eve</b>" not in text
    assert "$2.50" in text
    assert "3 minutes" in text


async def _fund(db_session, balance: int):
    user = (await db_session.execute(select(User).where(User.telegram_id == CREATOR))).scalar_one_or_none()
    if user is None:
        user = User(telegram_id=CREATOR, first_name="Protagonist", username="Protagonist", elo=1000)
        db_session.add(user)
    user.balance = balance
    await db_session.commit()


async def _balance_and_holds(db_session, game_id: str):
    db_session.expire_all()
    user = (await db_session.execute(select(User).where(User.telegram_id == CREATOR))).scalar_one()
    holds = (await db_session.execute(select(Transaction).where(
        Transaction.user_id == CREATOR, Transaction.reference_id == game_id
    ))).scalars().all()
    return user.balance, [(tx.type, tx.amount, tx.status) for tx in holds]


@pytest.mark.asyncio
async def test_create_open_challenge_debits_once_and_lists_it(client, db_session, memory_store):
    await _fund(db_session, 300)

    response = await client.post("/api/v1/game/create?type=online&time_control=300&wager=100&open_challenge=true")
    assert response.status_code == 200
    game_id = response.json()["game_id"]

    balance, holds = await _balance_and_holds(db_session, game_id)
    assert balance == 200
    assert holds == [("game_wager", -100, "completed")]
    state = await memory_store.get_game(game_id)
    assert state.open_challenge is True
    assert state.first_move_grace_seconds == open_challenges.ACCEPTED_FIRST_MOVE_GRACE_SECONDS

    listed = (await client.get("/api/v1/game/open-challenges")).json()["challenges"]
    assert [(c["game_id"], c["mine"], c["bid_amount"], c["time_control"]) for c in listed] == [(game_id, True, 100, 300)]
    assert [c["mine"] for c in await list_open(memory_store, OTHER)] == [False]


@pytest.mark.asyncio
async def test_private_invitations_and_coach_games_are_never_listed(client, db_session, memory_store):
    await _fund(db_session, 300)

    private = await client.post("/api/v1/game/create?type=online&time_control=300&wager=100")
    coach = await client.post("/api/v1/game/create?type=computer&open_challenge=true")
    assert private.status_code == 200 and coach.status_code == 200

    assert (await memory_store.get_game(coach.json()["game_id"])).open_challenge is False
    assert (await client.get("/api/v1/game/open-challenges")).json() == {"challenges": []}


@pytest.mark.asyncio
async def test_unlisted_challenge_costs_nothing(client, db_session, memory_store, monkeypatch):
    """If the public index cannot be written, the create fails before the debit commits."""
    await _fund(db_session, 300)

    async def index_down(*_args, **_kwargs):
        raise RuntimeError("simulated index outage")

    monkeypatch.setattr(open_challenges, "publish", index_down)
    with pytest.raises(RuntimeError, match="simulated index outage"):
        await client.post("/api/v1/game/create?type=online&time_control=300&wager=100&open_challenge=true")

    balance, _ = await _balance_and_holds(db_session, "")
    assert balance == 300
    db_session.expire_all()
    wagers = (await db_session.execute(select(Transaction).where(
        Transaction.user_id == CREATOR, Transaction.type == "game_wager"
    ))).scalars().all()
    assert wagers == []
    assert not any(key.startswith("game:") for key in memory_store._memory_store)


@pytest.mark.asyncio
async def test_insufficient_balance_creates_nothing(client, db_session, memory_store):
    await _fund(db_session, 50)
    response = await client.post("/api/v1/game/create?type=online&time_control=300&wager=100&open_challenge=true")
    assert response.status_code == 400
    assert (await client.get("/api/v1/game/open-challenges")).json() == {"challenges": []}
