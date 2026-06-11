from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.user import User
from app.models.gamification import Task, UserTask, Referral, TaskType, UnlockedLesson
from datetime import datetime, timedelta
import random
import string

class GamificationService:
    @staticmethod
    async def get_or_create_daily_tasks(db: AsyncSession, user_id: int):
        # Logic: Check if user has daily tasks for today. If not, assign them.
        # This is a simplified version.
        
        # 1. Get all daily tasks definitions
        result = await db.execute(select(Task).where(Task.is_daily == True))
        daily_tasks_defs = result.scalars().all()
        
        user_tasks = []
        for task_def in daily_tasks_defs:
            # Check if user has this task assigned today
            # We can check created_at or updated_at
            # For simplicity, we just check if a record exists and if it's "fresh"
            # In a real app, we'd have a 'date' field or reset logic
            
            result = await db.execute(select(UserTask).where(
                and_(UserTask.user_id == user_id, UserTask.task_id == task_def.id)
            ))
            user_task = result.scalars().first()
            
            if not user_task:
                user_task = UserTask(user_id=user_id, task_id=task_def.id, progress=0, completed=False, claimed=False)
                db.add(user_task)
            else:
                # Reset logic for daily tasks: if last updated on a previous UTC day, reset progress & completion
                last_update = user_task.updated_at
                now_utc = datetime.utcnow()
                if not last_update or last_update.date() < now_utc.date():
                    user_task.progress = 0
                    user_task.completed = False
                    user_task.claimed = False
                    user_task.updated_at = now_utc
                    db.add(user_task)
            
            user_tasks.append(user_task)
        
        await db.commit()
        return user_tasks

    @staticmethod
    async def add_xp(db: AsyncSession, user: User, amount: int):
        user.xp += amount
        
        # Simple Level Formula: Level = sqrt(XP) * Constant or Step
        # Let's use: Level N requires 100 * (N-1)^2 XP? 
        # Or simpler: Level up every 100 * Level XP.
        
        # Linear/Exponential accumulation:
        # Level 1: 0-99
        # Level 2: 100-299 (Need 200)
        # Mulitplier: 100
        
        next_level_threshold = user.level * 100 * (user.level + 1) // 2 # Sum of arithmetic progression approx
        
        # Simplified: Level = floor(xp / 100) + 1
        new_level = int(user.xp // 200) + 1 # 200 XP per level fixed for consistency
        
        if new_level > user.level:
            user.level = new_level
            # Trigger "Level Up" event/notification logic here
            
        await db.commit()
        return user

    @staticmethod
    async def generate_referral_code(db: AsyncSession):
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            result = await db.execute(select(User).where(User.referral_code == code))
            if not result.scalars().first():
                return code

    @staticmethod
    async def process_referral(db: AsyncSession, new_user: User, referral_code: str):
        if not referral_code:
            return False
            
        # Strip any deep link prefix (like "ref_")
        clean_code = referral_code
        if clean_code.startswith("ref_"):
            clean_code = clean_code[4:]
            
        result = await db.execute(select(User).where(User.referral_code == clean_code))
        referrer = result.scalars().first()
        
        if referrer and referrer.id != new_user.id:
            # Check if this referral already exists to prevent duplicate rewards
            referral_exists_result = await db.execute(
                select(Referral).where(
                    and_(Referral.referrer_id == referrer.id, Referral.referred_user_id == new_user.id)
                )
            )
            if referral_exists_result.scalars().first():
                return False
                
            referral = Referral(referrer_id=referrer.id, referred_user_id=new_user.id)
            db.add(referral)
            
            # Award XP to referrer
            await GamificationService.add_xp(db, referrer, 50) # 50 XP for referral
            
            # Award XP to new user
            await GamificationService.add_xp(db, new_user, 20) # 20 XP bonus
            
            await db.commit()
            return True
        return False
    @staticmethod
    async def claim_task(db: AsyncSession, user_id: int, task_id: int):
        # Find the specific user task
        result = await db.execute(select(UserTask).where(
            and_(UserTask.user_id == user_id, UserTask.task_id == task_id)
        ))
        user_task = result.scalars().first()

        if not user_task:
            return None, "Task not found"
        
        if not user_task.completed:
            return None, "Task not completed yet"
            
        if user_task.claimed:
            return None, "Task already claimed"

        # Get the task definition for XP reward
        task_def_result = await db.execute(select(Task).where(Task.id == user_task.task_id))
        task_def = task_def_result.scalars().first()
        
        if not task_def:
             return None, "Task definition not found"

        # Mark as claimed
        user_task.claimed = True
        
        # Award XP
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalars().first()
        
        updated_user = await GamificationService.add_xp(db, user, task_def.xp_reward)
        
        await db.commit()
        return updated_user, "Success"

    @staticmethod
    async def update_task_progress(db: AsyncSession, user_id: int, task_type: TaskType, increment: int = 1):
        """
        Increment progress for a specific task type (WIN, PLAY, etc.) for the user.
        If the task becomes completed, mark it.
        """
        result = await db.execute(
            select(UserTask)
            .join(Task, UserTask.task_id == Task.id)
            .where(
                and_(
                    UserTask.user_id == user_id,
                    UserTask.completed == False,
                    Task.task_type == task_type
                )
            )
        )
        
        user_tasks = result.scalars().all()
        for user_task in user_tasks:
            task_def_result = await db.execute(select(Task).where(Task.id == user_task.task_id))
            task_def = task_def_result.scalars().first()
            if not task_def:
                continue
                
            user_task.progress += increment
            if user_task.progress >= task_def.target_count:
                user_task.progress = task_def.target_count
                user_task.completed = True
            user_task.updated_at = datetime.utcnow()
            db.add(user_task)
            
        await db.commit()

    @staticmethod
    async def unlock_lesson(db: AsyncSession, user: User, lesson_id: str):
        """
        Deduct 100 XP to unlock an advanced lesson.
        """
        # Check if already unlocked
        result = await db.execute(
            select(UnlockedLesson).where(
                and_(UnlockedLesson.user_id == user.id, UnlockedLesson.lesson_id == lesson_id)
            )
        )
        existing = result.scalars().first()
        if existing:
            return user, "Lesson already unlocked"

        if user.xp < 100:
            return None, "Insufficient XP. Need 100 XP to unlock."
            
        # Deduct XP
        user.xp -= 100
        
        # Create unlock entry
        unlock = UnlockedLesson(user_id=user.id, lesson_id=lesson_id)
        db.add(unlock)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user, "Success"

    @staticmethod
    async def upgrade_premium_with_xp(db: AsyncSession, user: User):
        """
        Deduct 500 XP to upgrade user to Premium status.
        """
        if user.is_premium:
            return user, "Already Premium"
            
        if user.xp < 500:
            return None, "Insufficient XP. Need 500 XP to upgrade."
            
        # Deduct XP
        user.xp -= 500
        user.is_premium = True
        user.premium_tier = "premium"
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user, "Success"

    @staticmethod
    async def complete_academy_task(db: AsyncSession, user: User, task_type: str, item_id: str = ""):
        """
        Award 50 XP to the user for completing a lesson/puzzle.
        """
        updated_user = await GamificationService.add_xp(db, user, 50)
        return updated_user, "Success"
