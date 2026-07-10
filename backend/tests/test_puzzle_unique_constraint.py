import pytest
from sqlalchemy.exc import IntegrityError
from app.models.gamification import SolvedPuzzle, UnlockedPuzzle
from app.crud import user as user_crud
from sqlalchemy import delete
from app.models.user import User

@pytest.mark.asyncio
async def test_solved_puzzle_unique_constraint(db_session):
    if hasattr(db_session, "users"):
        return

    # 1. Create a user
    user = await user_crud.create_user(db_session, 999333001, "PuzzleUniqueTester")
    await db_session.commit()
    user_id = user.id

    try:
        # 2. Insert first solved puzzle
        solved1 = SolvedPuzzle(user_id=user_id, puzzle_id=1)
        db_session.add(solved1)
        await db_session.commit()

        # 3. Try to insert duplicate solved puzzle
        solved2 = SolvedPuzzle(user_id=user_id, puzzle_id=1)
        db_session.add(solved2)
        
        with pytest.raises(IntegrityError):
            await db_session.commit()
            
    finally:
        await db_session.rollback()
        await db_session.execute(delete(SolvedPuzzle).where(SolvedPuzzle.user_id == user_id))
        await db_session.execute(delete(User).where(User.id == user_id))
        await db_session.commit()

@pytest.mark.asyncio
async def test_unlocked_puzzle_unique_constraint(db_session):
    if hasattr(db_session, "users"):
        return

    # 1. Create a user
    user = await user_crud.create_user(db_session, 999333002, "PuzzleUniqueTester2")
    await db_session.commit()
    user_id = user.id

    try:
        # 2. Insert first unlocked puzzle
        unlocked1 = UnlockedPuzzle(user_id=user_id, puzzle_id=1)
        db_session.add(unlocked1)
        await db_session.commit()

        # 3. Try to insert duplicate unlocked puzzle
        unlocked2 = UnlockedPuzzle(user_id=user_id, puzzle_id=1)
        db_session.add(unlocked2)
        
        with pytest.raises(IntegrityError):
            await db_session.commit()
            
    finally:
        await db_session.rollback()
        await db_session.execute(delete(UnlockedPuzzle).where(UnlockedPuzzle.user_id == user_id))
        await db_session.execute(delete(User).where(User.id == user_id))
        await db_session.commit()
