from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.user import User
from app.models.gamification import Task, UserTask, Referral, TaskType
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
            # Else: Reset logic for daily tasks would go here (e.g. if last updated yesterday, reset)
            
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
        result = await db.execute(select(User).where(User.referral_code == referral_code))
        referrer = result.scalars().first()
        
        if referrer and referrer.id != new_user.id:
            referral = Referral(referrer_id=referrer.id, referred_user_id=new_user.id)
            db.add(referral)
            
            # Award XP to referrer
            await GamificationService.add_xp(db, referrer, 50) # 50 XP for referral
            
            # Award XP to new user
            await GamificationService.add_xp(db, new_user, 20) # 20 XP bonus
            
            await db.commit()
            return True
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
