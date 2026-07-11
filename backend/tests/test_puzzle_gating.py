import pytest
from app.crud import user as user_crud
from app.models.gamification import SolvedPuzzle, UnlockedPuzzle
from sqlalchemy import select

@pytest.mark.asyncio
async def test_puzzle_gating_and_progression(client, db_session):
    # Skip if using mock session to prevent database exceptions
    if hasattr(db_session, "users"):
        return

    # 1. Sync Test User
    import json
    from urllib.parse import quote
    telegram_id = 999111222
    init_data = f"user={quote(json.dumps({'id': telegram_id, 'first_name': 'PuzzleTester'}))}"
    
    # Sync first to create user
    response = await client.post(
        "/api/v1/users/sync",
        headers={"X-Telegram-Init-Data": init_data}
    )
    assert response.status_code == 200

    # Get user_id from DB using telegram_id
    db_user_stmt = select(user_crud.User).where(user_crud.User.telegram_id == telegram_id)
    db_user_res = await db_session.execute(db_user_stmt)
    db_user = db_user_res.scalars().first()
    user_id = db_user.id

    # 2. Verify levels structure
    response = await client.get(
        "/api/v1/gamification/academy/puzzles",
        headers={"X-Telegram-Init-Data": init_data}
    )
    assert response.status_code == 200
    puzzles = response.json()
    assert len(puzzles) == 100

    # Level 1 is free and unlocked
    assert puzzles[0]["id"] == 1
    assert not puzzles[0]["is_premium_locked"]
    assert not puzzles[0]["is_xp_locked"]
    assert not puzzles[0]["is_sequential_locked"]

    # Level 2 is free but sequential locked (since Level 1 is unsolved)
    assert puzzles[1]["id"] == 2
    assert not puzzles[1]["is_premium_locked"]
    assert not puzzles[1]["is_xp_locked"]
    assert puzzles[1]["is_sequential_locked"]

    # Level 11 is XP locked (cost = 200 XP)
    assert puzzles[10]["id"] == 11
    assert not puzzles[10]["is_premium_locked"]
    assert puzzles[10]["is_xp_locked"]
    assert puzzles[10]["xp_cost"] == 200
    assert puzzles[10]["is_sequential_locked"]

    # Level 29 is XP locked (cost = 200 + 18 * 50 = 1100 XP)
    assert puzzles[28]["id"] == 29
    assert not puzzles[28]["is_premium_locked"]
    assert puzzles[28]["is_xp_locked"]
    assert puzzles[28]["xp_cost"] == 1100
    assert puzzles[28]["is_sequential_locked"]

    # Level 30 is Premium locked
    assert puzzles[29]["id"] == 30
    assert puzzles[29]["is_premium_locked"]
    assert not puzzles[29]["is_xp_locked"]
    assert puzzles[29]["is_sequential_locked"]

    # 3. Access locked Level 2 directly (should fail with 403)
    response = await client.get(
        "/api/v1/gamification/academy/puzzles/2",
        headers={"X-Telegram-Init-Data": init_data}
    )
    assert response.status_code == 403
    assert "solve the previous tactical level first" in response.json()["detail"]

    # 4. Solve Level 1
    response = await client.post(
        "/api/v1/gamification/academy/puzzles/1/verify",
        headers={"X-Telegram-Init-Data": init_data},
        json={"move": "g5f7"}
    )
    assert response.status_code == 200

    # Now verify Level 2 is unlocked sequentially
    response = await client.get(
        "/api/v1/gamification/academy/puzzles",
        headers={"X-Telegram-Init-Data": init_data}
    )
    assert response.status_code == 200
    puzzles = response.json()
    assert puzzles[0]["is_solved"]
    assert not puzzles[1]["is_sequential_locked"]

    # Access Level 2 details directly (should succeed now)
    response = await client.get(
        "/api/v1/gamification/academy/puzzles/2",
        headers={"X-Telegram-Init-Data": init_data}
    )
    assert response.status_code == 200
    assert response.json()["id"] == 2

    # 5. Let's solve puzzles 2 to 10 using DB session to fast-forward
    # Lock/Refetch the user model
    db_user_stmt = select(user_crud.User).where(user_crud.User.telegram_id == telegram_id)
    db_user_res = await db_session.execute(db_user_stmt)
    db_user = db_user_res.scalars().first()

    for i in range(2, 11):
        sp = SolvedPuzzle(user_id=db_user.id, puzzle_id=i)
        db_session.add(sp)
    await db_session.commit()

    # Now level 11 should be XP-locked but NOT sequential locked
    response = await client.get(
        "/api/v1/gamification/academy/puzzles",
        headers={"X-Telegram-Init-Data": init_data}
    )
    assert response.status_code == 200
    puzzles = response.json()
    assert not puzzles[10]["is_sequential_locked"]
    assert puzzles[10]["is_xp_locked"]

    # 6. Attempt to unlock level 11 without enough XP (should fail with 400)
    response = await client.post(
        "/api/v1/gamification/academy/puzzles/11/unlock",
        headers={"X-Telegram-Init-Data": init_data}
    )
    assert response.status_code == 400
    assert "Insufficient XP" in response.json()["detail"]

    # 7. Grant user enough XP (e.g. 500 XP) and unlock
    db_user.xp = 500
    db_session.add(db_user)
    await db_session.commit()

    response = await client.post(
        "/api/v1/gamification/academy/puzzles/11/unlock",
        headers={"X-Telegram-Init-Data": init_data}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["new_xp"] == 300  # 500 - 200 = 300 XP

    # Level 11 is now unlocked
    response = await client.get(
        "/api/v1/gamification/academy/puzzles",
        headers={"X-Telegram-Init-Data": init_data}
    )
    assert response.status_code == 200
    puzzles = response.json()
    assert not puzzles[10]["is_xp_locked"]
    assert not puzzles[10]["is_sequential_locked"]

    # But level 12 is sequential locked (since 11 is unsolved)
    assert puzzles[11]["is_sequential_locked"]

    # 8. Grant user Premium and check that everything is unlocked
    db_user.is_premium = True
    db_user.premium_tier = "premium"
    from datetime import datetime, timedelta, timezone
    db_user.premium_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=30)
    db_session.add(db_user)
    await db_session.commit()

    response = await client.get(
        "/api/v1/gamification/academy/puzzles",
        headers={"X-Telegram-Init-Data": init_data}
    )
    assert response.status_code == 200
    puzzles = response.json()
    # Level 12 has sequential lock (still unsolved 11) but no premium/XP lock
    assert not puzzles[11]["is_premium_locked"]
    assert not puzzles[11]["is_xp_locked"]
    assert puzzles[11]["is_sequential_locked"]

    # Level 30 has sequential lock but no premium lock!
    assert not puzzles[29]["is_premium_locked"]
    assert puzzles[29]["is_sequential_locked"]


def test_all_puzzle_solutions_are_single_move():
    """TRIPWIRE: the verify endpoint validates only solution[0] server-side
    (the full solution is never sent to the client — puzzle-leak fix). A
    multi-move puzzle would silently award XP after the first move. If this
    test fails because you added one, build server-side incremental move
    validation first — do NOT just delete this test."""
    from app.core.puzzles import CHESS_PUZZLES
    multi = [(p["id"], len(p["solution"])) for p in CHESS_PUZZLES if len(p["solution"]) != 1]
    assert multi == [], f"Multi-move puzzles need incremental validation: {multi}"
    # And every solution move is UCI-shaped (what the client submits).
    import re
    bad = [p["id"] for p in CHESS_PUZZLES if not re.fullmatch(r"[a-h][1-8][a-h][1-8][qrbn]?", p["solution"][0].strip().lower())]
    assert bad == [], f"Non-UCI solution moves: {bad}"
