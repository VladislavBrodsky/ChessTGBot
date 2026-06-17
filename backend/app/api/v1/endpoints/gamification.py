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
    await GamificationService.get_or_create_achievements(db, current_user.id)

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

@router.post("/tasks/{task_id}/verify")
async def verify_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify a subscription task status by checking Telegram channel/group membership.
    """
    from app.models.gamification import Task, UserTask
    from sqlalchemy import select, and_
    from app.core.config import get_settings
    import logging
    
    logger = logging.getLogger(__name__)
    settings = get_settings()

    result = await db.execute(
        select(UserTask, Task)
        .join(Task, UserTask.task_id == Task.id)
        .where(and_(UserTask.user_id == current_user.id, Task.id == task_id))
    )
    user_task_and_def = result.first()
    if not user_task_and_def:
        raise HTTPException(status_code=404, detail="Task not found or not assigned")

    user_task, task_def = user_task_and_def

    if user_task.completed:
        return {"status": "success", "completed": True, "message": "Task already completed"}

    chat_username = None
    if task_def.title_key == "join_channel":
        chat_username = "@chess_hub"
    elif task_def.title_key == "join_chat":
        chat_username = "@chesshub_chat"
    else:
        raise HTTPException(status_code=400, detail="Only subscription tasks can be verified via this endpoint")

    from app.core.database import engine
    is_sqlite = engine.url.drivername.startswith("sqlite")
    if is_sqlite or not settings.TELEGRAM_BOT_TOKEN or settings.TELEGRAM_BOT_TOKEN == "123456789:test_token":
        user_task.progress = 1
        user_task.completed = True
        await db.commit()
        return {"status": "success", "completed": True, "message": "Verification bypassed (Dev mode active)"}

    from app.services.telegram_bot import TelegramService
    bot = TelegramService.application.bot if (TelegramService.application and TelegramService.application.bot) else None
    if not bot:
        from telegram import Bot
        bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)

    try:
        member = await bot.get_chat_member(chat_id=chat_username, user_id=current_user.telegram_id)
        if member.status in ["member", "creator", "administrator", "restricted"]:
            user_task.progress = 1
            user_task.completed = True
            await db.commit()
            return {"status": "success", "completed": True}
        else:
            raise HTTPException(status_code=400, detail="You have not joined this channel or group yet.")
    except Exception as e:
        logger.error(f"Telegram subscription verification failed for {chat_username}: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"Verification failed: Please make sure you have joined {chat_username}."
        )

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

class LessonUnlockRequest(BaseModel):
    lesson_id: str

class AcademyTaskCompleteRequest(BaseModel):
    task_type: str  # 'lesson' or 'puzzle'
    item_id: Optional[str] = ""

@router.post("/premium/upgrade-with-xp")
async def upgrade_premium_with_xp(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upgrade the current user to premium by spending 500 XP."""
    updated_user, message = await GamificationService.upgrade_premium_with_xp(db, current_user)
    if not updated_user:
        raise HTTPException(status_code=400, detail=message)
    return {
        "status": "success",
        "new_xp": updated_user.xp,
        "is_premium": updated_user.is_premium,
        "premium_tier": updated_user.premium_tier
    }

@router.post("/academy/unlock-lesson")
async def unlock_lesson(
    req: LessonUnlockRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Unlock an advanced lesson by spending 100 XP."""
    updated_user, message = await GamificationService.unlock_lesson(db, current_user, req.lesson_id)
    if not updated_user:
        raise HTTPException(status_code=400, detail=message)
    return {
        "status": "success",
        "new_xp": updated_user.xp,
        "lesson_id": req.lesson_id
    }

@router.get("/academy/unlocked-lessons")
async def get_unlocked_lessons(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all lesson IDs unlocked by the current user."""
    from sqlalchemy import select
    from app.models.gamification import UnlockedLesson
    result = await db.execute(
        select(UnlockedLesson).where(UnlockedLesson.user_id == current_user.id)
    )
    unlocks = result.scalars().all()
    return [unlock.lesson_id for unlock in unlocks]

@router.post("/academy/complete-task")
async def complete_academy_task(
    req: AcademyTaskCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Award 50 XP to the user for completing an academy lesson or puzzle."""
    updated_user, message = await GamificationService.complete_academy_task(
        db, current_user, req.task_type, req.item_id
    )
    return {
        "status": "success",
        "new_xp": updated_user.xp,
        "new_level": updated_user.level
    }

class PuzzleVerifyRequest(BaseModel):
    solution: List[str]

@router.get("/academy/puzzles")
async def get_puzzles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all 100 puzzles with solved status, without solutions to prevent cheating."""
    from app.core.puzzles import CHESS_PUZZLES
    from app.models.gamification import SolvedPuzzle
    from sqlalchemy import select
    
    result = await db.execute(
        select(SolvedPuzzle.puzzle_id).where(SolvedPuzzle.user_id == current_user.id)
    )
    solved_ids = set(result.scalars().all())
    
    return [
        {
            "id": p["id"],
            "title": p["title"],
            "description": p["description"],
            "xp_reward": p["xp_reward"],
            "is_premium_locked": p["id"] > 1 and not current_user.is_premium,
            "is_solved": p["id"] in solved_ids
        }
        for p in CHESS_PUZZLES
    ]

@router.get("/academy/puzzles/{puzzle_id}")
async def get_puzzle_by_id(
    puzzle_id: int,
    current_user: User = Depends(get_current_user)
):
    """Retrieve single puzzle details. Gates puzzles > 1 behind premium check."""
    from app.core.puzzles import CHESS_PUZZLES
    
    if puzzle_id > 1 and not current_user.is_premium:
        raise HTTPException(
            status_code=403,
            detail="Premium subscription required to access this tactical level."
        )
        
    for p in CHESS_PUZZLES:
        if p["id"] == puzzle_id:
            return {
                "id": p["id"],
                "title": p["title"],
                "description": p["description"],
                "fen": p["fen"],
                "xp_reward": p["xp_reward"],
                "solution": p["solution"]
            }
            
    raise HTTPException(status_code=404, detail="Puzzle not found")

@router.post("/academy/puzzles/{puzzle_id}/verify")
async def verify_puzzle_solution(
    puzzle_id: int,
    req: PuzzleVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify moves solution, checks premium if >1, and credits ELO & XP."""
    from app.core.puzzles import CHESS_PUZZLES
    
    if puzzle_id > 1 and not current_user.is_premium:
        raise HTTPException(
            status_code=403,
            detail="Premium subscription required to access this tactical level."
        )
        
    target_puzzle = None
    for p in CHESS_PUZZLES:
        if p["id"] == puzzle_id:
            target_puzzle = p
            break
            
    if not target_puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")

    # Match solution moves (case-insensitive and whitespace-stripped comparison)
    user_sol = [move.strip().lower() for move in req.solution]
    correct_sol = [move.strip().lower() for move in target_puzzle["solution"]]
    
    if user_sol != correct_sol:
        raise HTTPException(status_code=400, detail="Incorrect move sequence. Try again!")
        
    # Deduplicate to prevent puzzle ELO/XP farming
    from app.services.session_manager import SessionManager
    from app.models.gamification import SolvedPuzzle
    from sqlalchemy import select, and_
    session_mgr = SessionManager()
    redis_key = f"user:solved_puzzles:{current_user.telegram_id}"
    
    # DB check as primary source of truth
    db_check = await db.execute(
        select(SolvedPuzzle).where(
            and_(
                SolvedPuzzle.user_id == current_user.id,
                SolvedPuzzle.puzzle_id == puzzle_id
            )
        )
    )
    already_solved_db = db_check.scalars().first() is not None

    already_solved_redis = False
    if session_mgr.redis and not session_mgr._use_memory:
        try:
            already_solved_redis = await session_mgr.redis.sismember(redis_key, str(puzzle_id))
        except Exception:
            pass

    if (not session_mgr.redis or session_mgr._use_memory) or already_solved_redis is None:
        if not hasattr(GamificationService, "_solved_puzzles"):
            GamificationService._solved_puzzles = set()
        mem_key = f"{current_user.telegram_id}:{puzzle_id}"
        already_solved_redis = mem_key in GamificationService._solved_puzzles

    already_solved = already_solved_db or already_solved_redis

    if already_solved:
        # If solved in DB but not in memory/Redis (e.g. cold start), backfill them
        if not already_solved_redis:
            if session_mgr.redis and not session_mgr._use_memory:
                try:
                    await session_mgr.redis.sadd(redis_key, str(puzzle_id))
                except Exception:
                    pass
            else:
                if not hasattr(GamificationService, "_solved_puzzles"):
                    GamificationService._solved_puzzles = set()
                mem_key = f"{current_user.telegram_id}:{puzzle_id}"
                GamificationService._solved_puzzles.add(mem_key)

        return {
            "status": "success",
            "solved": True,
            "new_xp": current_user.xp,
            "new_level": current_user.level,
            "new_elo": current_user.elo,
            "message": "Already solved. No additional XP/ELO rewarded."
        }

    # Save solved puzzle to database
    solved_record = SolvedPuzzle(user_id=current_user.id, puzzle_id=puzzle_id)
    db.add(solved_record)

    # Add to Redis set
    if session_mgr.redis and not session_mgr._use_memory:
        try:
            await session_mgr.redis.sadd(redis_key, str(puzzle_id))
        except Exception:
            pass
    else:
        if not hasattr(GamificationService, "_solved_puzzles"):
            GamificationService._solved_puzzles = set()
        mem_key = f"{current_user.telegram_id}:{puzzle_id}"
        GamificationService._solved_puzzles.add(mem_key)

    # Award ELO (+5) and XP (puzzle reward)
    current_user.elo += 5
    updated_user = await GamificationService.add_xp(db, current_user, target_puzzle["xp_reward"], trigger_kickback=True, apply_booster=True, commit=False)
    
    # Track completion in user tasks: complete task type puzzle
    await GamificationService.update_task_progress(db, current_user.id, "login", increment=0, commit=False) # dummy keep db hot
    
    await db.commit()
    
    return {
        "status": "success",
        "solved": True,
        "new_xp": updated_user.xp,
        "new_level": updated_user.level,
        "new_elo": updated_user.elo
    }
