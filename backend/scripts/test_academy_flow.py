import asyncio
import sys
import os

# Ensure backend root is in PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.services.gamification_service import GamificationService
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        # Create or get a test user
        result = await db.execute(select(User).where(User.telegram_id == 999888777))
        test_user = result.scalar_one_or_none()
        if not test_user:
            test_user = User(
                telegram_id=999888777,
                username="test_academy_user",
                first_name="Test",
                xp=0,
                elo=1000,
                study_streak=0
            )
            db.add(test_user)
            await db.commit()
            await db.refresh(test_user)
            print("Created new test user.")
        else:
            print("Found existing test user.")
            
        initial_xp = test_user.xp
        initial_streak = test_user.study_streak
        
        lesson_id = "opening-principles"
        
        # Clean up in-memory cache for test idempotency
        mem_key = f"{test_user.telegram_id}:lesson:{lesson_id}"
        from app.services.session_manager import SessionManager
        session_mgr = SessionManager()
        if session_mgr.redis:
            try:
                await session_mgr.redis.srem(f"user:completed_academy:{test_user.telegram_id}", f"lesson:{lesson_id}")
                print("Cleaned up existing completed task in Redis.")
            except Exception as e:
                print(f"Redis not available: {e}")
        
        if hasattr(GamificationService, "_completed_academy"):
            if mem_key in GamificationService._completed_academy:
                GamificationService._completed_academy.remove(mem_key)
                print("Cleaned up existing completed task in memory.")
        
        # Test 1: Complete lesson
        updated_user, msg = await GamificationService.complete_academy_task(db, test_user, "lesson", lesson_id)
        if msg == "Success":
            updated_user = await GamificationService.update_study_streak(db, updated_user)
            await db.commit()
        
        print(f"Test 1 - After first completion: Msg: {msg}")
        print(f"XP: {initial_xp} -> {updated_user.xp} (Expected increase by 50)")
        print(f"Streak: {initial_streak} -> {updated_user.study_streak} (Expected +1 or active)")
        
        if updated_user.xp <= initial_xp:
            print("❌ FAILED: XP did not increase!")
        else:
            print("✅ PASSED: XP increased correctly.")
            
        print("MEMORY CACHE:", getattr(GamificationService, "_completed_academy", "Not found"))
            
        # Test 2: Complete again (idempotency check)
        updated_user2, msg2 = await GamificationService.complete_academy_task(db, updated_user, "lesson", lesson_id)
        
        print(f"Test 2 - After second completion: Msg: {msg2}")
        print(f"XP: {updated_user.xp} -> {updated_user2.xp}")
        
        if msg2 == "Already completed":
            print("✅ PASSED: Idempotency check worked, prevented duplicate completion.")
        else:
            print("❌ FAILED: Did not catch already completed state.")
            
        if updated_user2.xp > updated_user.xp:
            print("❌ FAILED: XP increased again!")
        else:
            print("✅ PASSED: XP did not increase again.")

if __name__ == "__main__":
    asyncio.run(main())
