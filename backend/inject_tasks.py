import asyncio
import os
import sys

# Add the app directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import AsyncSessionLocal
from app.models.gamification import Task, TaskType
from sqlalchemy import select

async def inject_tasks():
    async with AsyncSessionLocal() as session:
        # Check if they exist
        existing = await session.execute(select(Task).where(Task.id.in_([105, 106])))
        existing_tasks = existing.scalars().all()
        existing_ids = [t.id for t in existing_tasks]

        if 105 not in existing_ids:
            task105 = Task(
                id=105, 
                title_key="ach_refer_1", 
                description_key="First Blood: Invite 1 friend to FinChess", 
                xp_reward=200, 
                task_type=TaskType.REFER, 
                target_count=1, 
                is_daily=False, 
                icon="users"
            )
            session.add(task105)
            print("Added task 105")

        if 106 not in existing_ids:
            task106 = Task(
                id=106, 
                title_key="ach_refer_3", 
                description_key="Socializer: Invite 3 friends to FinChess", 
                xp_reward=500, 
                task_type=TaskType.REFER, 
                target_count=3, 
                is_daily=False, 
                icon="users"
            )
            session.add(task106)
            print("Added task 106")

        # Also update the xp_reward of ach_refer_5 (id 104) to 1000 if it's currently 500
        t104_res = await session.execute(select(Task).where(Task.id == 104))
        t104 = t104_res.scalars().first()
        if t104 and t104.xp_reward != 1000:
            t104.xp_reward = 1000
            print("Updated task 104 xp_reward to 1000")

        await session.commit()
        print("Done")

if __name__ == "__main__":
    asyncio.run(inject_tasks())
