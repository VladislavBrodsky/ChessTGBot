from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.services.gamification_service import GamificationService
from app.models.user import User

router = APIRouter()

@router.get("/tasks")
async def get_my_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get or create daily tasks for the user."""
    tasks = await GamificationService.get_or_create_daily_tasks(db, current_user.id)
    return tasks

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
