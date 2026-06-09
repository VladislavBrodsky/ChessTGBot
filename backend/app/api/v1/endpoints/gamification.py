from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.services.gamification_service import GamificationService
from app.models.user import User
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class UserTaskResponse(BaseModel):
    id: int
    task_id: int
    progress: int
    completed: bool
    claimed: bool
    title_key: str
    description_key: str
    xp_reward: int
    target_count: int
    icon: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/tasks", response_model=List[UserTaskResponse])
async def get_my_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get or create daily tasks for the user and return details."""
    from sqlalchemy import select
    from app.models.gamification import Task, UserTask

    # Verify tasks generated
    await GamificationService.get_or_create_daily_tasks(db, current_user.id)

    # Fetch with joined details
    result = await db.execute(
        select(UserTask, Task)
        .join(Task, UserTask.task_id == Task.id)
        .where(UserTask.user_id == current_user.id)
    )

    tasks_list = []
    for user_task, task_def in result.all():
        tasks_list.append(UserTaskResponse(
            id=user_task.id,
            task_id=user_task.task_id,
            progress=user_task.progress,
            completed=user_task.completed,
            claimed=user_task.claimed,
            title_key=task_def.title_key,
            description_key=task_def.description_key,
            xp_reward=task_def.xp_reward,
            target_count=task_def.target_count,
            icon=task_def.icon
        ))
    return tasks_list

@router.post("/tasks/{task_id}/claim")
async def claim_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Claim a completed task reward."""
    """Claim a completed task reward."""
    updated_user, message = await GamificationService.claim_task(db, current_user.id, task_id)
    
    if not updated_user:
        raise HTTPException(status_code=400, detail=message)
        
    return {"status": "success", "new_xp": updated_user.xp, "new_level": updated_user.level}

@router.put("/language")
async def update_language(
    language: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user's preferred language."""
    if language not in ['en', 'es', 'fr', 'de', 'ru', 'pt', 'zh', 'hi', 'ar', 'ja']:
        raise HTTPException(status_code=400, detail="Invalid language code")
    
    current_user.preferred_language = language
    await db.commit()
    return {"status": "success", "language": language}
