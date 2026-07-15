from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.deps import get_current_user, rate_limit
from app.core.database import get_db
from app.services.gamification_service import GamificationService
from app.models.user import User
from pydantic import BaseModel, ConfigDict
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

    model_config = ConfigDict(from_attributes=True)

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

    # 1. Lock the user task first using with_for_update to prevent concurrent verification updates
    user_task_result = await db.execute(
        select(UserTask)
        .where(and_(UserTask.user_id == current_user.id, UserTask.task_id == task_id))
        .with_for_update()
    )
    user_task = user_task_result.scalars().first()
    if not user_task:
        raise HTTPException(status_code=404, detail="Task not found or not assigned")

    # 2. Get the task definition separately
    task_def_result = await db.execute(select(Task).where(Task.id == task_id))
    task_def = task_def_result.scalars().first()
    if not task_def:
        raise HTTPException(status_code=404, detail="Task definition not found")

    if user_task.completed:
        return {"status": "success", "completed": True, "message": "Task already completed"}

    if task_def.title_key == "add_to_home_screen":
        user_task.progress = 1
        user_task.completed = True
        await db.commit()
        return {"status": "success", "completed": True}

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
    except HTTPException:
        raise
    except Exception as e:
        from telegram.error import BadRequest
        from app.core.alerts import is_transient_telegram_error
        if isinstance(e, BadRequest) or "chat not found" in str(e).lower() or "user not found" in str(e).lower():
            logger.warning(f"Telegram subscription check failed for {chat_username} (User not joined): {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Verification failed: Please make sure you have joined {chat_username}."
            )
        if is_transient_telegram_error(e):
            # Momentary Telegram API outage (timeout / 502) — retryable, not
            # an actionable backend fault, so WARNING (no admin alert).
            logger.warning(f"Telegram subscription verification for {chat_username} hit a transient Telegram API error: {e}")
            raise HTTPException(
                status_code=503,
                detail="Verification service temporarily unavailable. Please try again."
            )
        logger.error(f"Telegram subscription verification failed for {chat_username}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Verification service temporarily unavailable"
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


# Coarse timezone buckets used to time the daily-arena heads-up; must match
# app.services.arena_targeting.REGION_OFFSETS.
VALID_REGIONS = {"americas", "europe_africa", "mena_sasia", "apac"}


@router.put("/region")
async def update_region(
    region: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Set the user's self-declared region (used to time arena heads-up)."""
    if region not in VALID_REGIONS:
        raise HTTPException(status_code=400, detail="Invalid region")
    current_user.region = region
    await db.commit()
    return {"status": "success", "region": region}


@router.put("/arena-notifications")
async def update_arena_notifications(
    enabled: bool = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Toggle the daily-arena heads-up opt-out for the current user."""
    current_user.arena_notifications = enabled
    await db.commit()
    return {"status": "success", "arena_notifications": enabled}

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
        "is_premium": updated_user.is_premium_active,
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

@router.get("/academy/completed-lessons")
async def get_completed_lessons(
    current_user: User = Depends(get_current_user)
):
    """Retrieve all lesson IDs completed by the current user."""
    return await GamificationService.get_completed_academy_tasks(current_user, "lesson")


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
    
    if message == "Success":
        updated_user = await GamificationService.update_study_streak(db, updated_user)
        await db.commit()
    return {
        "status": "success",
        "new_xp": updated_user.xp,
        "new_level": updated_user.level
    }

class PuzzleVerifyRequest(BaseModel):
    move: str

@router.get("/academy/puzzles")
async def get_puzzles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all 100 puzzles with solved status, locks, and progressive unlock costs."""
    from app.core.puzzles import CHESS_PUZZLES
    from app.models.gamification import SolvedPuzzle, UnlockedPuzzle
    from sqlalchemy import select
    
    result = await db.execute(
        select(SolvedPuzzle.puzzle_id).where(SolvedPuzzle.user_id == current_user.id)
    )
    solved_ids = set(result.scalars().all())

    unlock_res = await db.execute(
        select(UnlockedPuzzle.puzzle_id).where(UnlockedPuzzle.user_id == current_user.id)
    )
    unlocked_ids = set(unlock_res.scalars().all())
    
    puzzles_list = []
    for p in CHESS_PUZZLES:
        id = p["id"]
        is_solved = id in solved_ids
        
        # 1. Sequential Progression Check
        is_sequential_locked = False
        if id > 1 and (id - 1) not in solved_ids:
            is_sequential_locked = True
            
        # 2. Gating and Unlock check
        is_premium_locked = False
        is_xp_locked = False
        xp_cost = 0
        
        if id <= 10:
            # Free tier
            pass
        elif 11 <= id <= 29:
            # XP Unlock tier
            if not current_user.is_premium_active and id not in unlocked_ids:
                is_xp_locked = True
                xp_cost = 200 + (id - 11) * 50
        else:
            # Premium tier
            if not current_user.is_premium_active:
                is_premium_locked = True
                
        puzzles_list.append({
            "id": id,
            "title": p["title"],
            "description": p["description"],
            "xp_reward": p["xp_reward"],
            "is_solved": is_solved,
            "is_sequential_locked": is_sequential_locked,
            "is_premium_locked": is_premium_locked,
            "is_xp_locked": is_xp_locked,
            "xp_cost": xp_cost
        })
        
    return puzzles_list

@router.get("/academy/puzzles/{puzzle_id}")
async def get_puzzle_by_id(
    puzzle_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve single puzzle details after verifying gating rules."""
    from app.core.puzzles import CHESS_PUZZLES
    from sqlalchemy import select, and_
    
    if puzzle_id > 1:
        # Sequential progression check
        from app.models.gamification import SolvedPuzzle
        solved_check = await db.execute(
            select(SolvedPuzzle).where(
                and_(SolvedPuzzle.user_id == current_user.id, SolvedPuzzle.puzzle_id == puzzle_id - 1)
            )
        )
        if not solved_check.scalars().first():
            raise HTTPException(
                status_code=403,
                detail="You must solve the previous tactical level first."
            )
            
    if 11 <= puzzle_id <= 29:
        if not current_user.is_premium_active:
            from app.models.gamification import UnlockedPuzzle
            unlocked_check = await db.execute(
                select(UnlockedPuzzle).where(
                    and_(UnlockedPuzzle.user_id == current_user.id, UnlockedPuzzle.puzzle_id == puzzle_id)
                )
            )
            if not unlocked_check.scalars().first():
                raise HTTPException(
                    status_code=403,
                    detail="You need to unlock this level using XP or upgrade to Premium."
                )
                
    if puzzle_id >= 30:
        if not current_user.is_premium_active:
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
                "move_count": len(p["solution"])
            }
            
@router.get("/academy/puzzles/{puzzle_id}/hint")
async def get_puzzle_hint(
    puzzle_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve hint for a puzzle. Returns the starting square of the correct move and the coach's textual tip."""
    from app.core.puzzles import CHESS_PUZZLES
    
    if puzzle_id > 10:
        raise HTTPException(status_code=403, detail="Hints are only available for levels 1-10.")
        
    for p in CHESS_PUZZLES:
        if p["id"] == puzzle_id:
            solution_move = p["solution"][0].strip().lower()
            return {
                "from": solution_move[:2],
                "hint_text": p.get("hint_text", "Focus on creating an unstoppable attack on the target.")
            }
            
    raise HTTPException(status_code=404, detail="Puzzle not found")

@router.post("/academy/puzzles/{puzzle_id}/unlock")
async def unlock_puzzle_endpoint(
    puzzle_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Unlock a tactics level using progressive XP."""
    updated_user, message = await GamificationService.unlock_puzzle(db, current_user, puzzle_id)
    if not updated_user:
        raise HTTPException(status_code=400, detail=message)
    return {
        "status": "success",
        "new_xp": updated_user.xp,
        "puzzle_id": puzzle_id
    }

@router.post("/academy/puzzles/{puzzle_id}/verify", dependencies=[Depends(rate_limit(limit=12, window=60))])
async def verify_puzzle_solution(
    puzzle_id: int,
    req: PuzzleVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Verify moves solution after checking locks, and credits ELO & XP."""
    from app.core.puzzles import CHESS_PUZZLES
    
    # 1. Re-fetch user with write lock to prevent race conditions during ELO/XP updates
    from sqlalchemy import select, and_
    user_stmt = select(User).where(User.id == current_user.id).with_for_update()
    res_user = await db.execute(user_stmt)
    locked_user = res_user.scalars().first()
    if not locked_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if puzzle_id > 1:
        # Sequential progression check
        from app.models.gamification import SolvedPuzzle
        solved_check = await db.execute(
            select(SolvedPuzzle).where(
                and_(SolvedPuzzle.user_id == locked_user.id, SolvedPuzzle.puzzle_id == puzzle_id - 1)
            )
        )
        if not solved_check.scalars().first():
            raise HTTPException(
                status_code=403,
                detail="You must solve the previous tactical level first."
            )
            
    if 11 <= puzzle_id <= 29:
        if not locked_user.is_premium_active:
            from app.models.gamification import UnlockedPuzzle
            unlocked_check = await db.execute(
                select(UnlockedPuzzle).where(
                    and_(UnlockedPuzzle.user_id == locked_user.id, UnlockedPuzzle.puzzle_id == puzzle_id)
                )
            )
            if not unlocked_check.scalars().first():
                raise HTTPException(
                    status_code=403,
                    detail="You need to unlock this level using XP or upgrade to Premium."
                )
                
    if puzzle_id >= 30:
        if not locked_user.is_premium_active:
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
    user_move = req.move.strip().lower()
    correct_move = target_puzzle["solution"][0].strip().lower()
    
    if user_move != correct_move and user_move[:4] != correct_move[:4]:
        raise HTTPException(status_code=400, detail="Incorrect move. Try again!")
        
    # Deduplicate to prevent puzzle ELO/XP farming
    from app.services.session_manager import SessionManager
    from app.models.gamification import SolvedPuzzle
    session_mgr = SessionManager()
    redis_key = f"user:solved_puzzles:{locked_user.telegram_id}"
    
    # DB check as primary source of truth (inside user write lock)
    db_check = await db.execute(
        select(SolvedPuzzle).where(
            and_(
                SolvedPuzzle.user_id == locked_user.id,
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
        mem_key = f"{locked_user.telegram_id}:{puzzle_id}"
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
                mem_key = f"{locked_user.telegram_id}:{puzzle_id}"
                GamificationService._solved_puzzles.add(mem_key)

        return {
            "status": "success",
            "solved": True,
            "new_xp": locked_user.xp,
            "new_level": locked_user.level,
            "new_elo": locked_user.elo,
            "message": "Already solved. No additional XP/ELO rewarded.",
            "explanation": target_puzzle.get("explanation", "Excellent! You found the winning tactical pattern.")
        }

    # Save solved puzzle to database
    solved_record = SolvedPuzzle(user_id=locked_user.id, puzzle_id=puzzle_id)
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
        mem_key = f"{locked_user.telegram_id}:{puzzle_id}"
        GamificationService._solved_puzzles.add(mem_key)

    # Award ELO (+5) and XP (puzzle reward)
    locked_user.elo += 5
    updated_user = await GamificationService.add_xp(db, locked_user, target_puzzle["xp_reward"], trigger_kickback=True, apply_booster=True, commit=False)
    
    # Track completion in user tasks: complete task type puzzle
    await GamificationService.update_task_progress(db, locked_user.id, "login", increment=0, commit=False) # dummy keep db hot
    
    # Update study streak
    updated_user = await GamificationService.update_study_streak(db, updated_user)
    
    await db.commit()
    
    return {
        "status": "success",
        "solved": True,
        "new_xp": updated_user.xp,
        "new_level": updated_user.level,
        "new_elo": updated_user.elo,
        "explanation": target_puzzle.get("explanation", "Excellent! You found the winning tactical pattern.")
    }


from datetime import datetime  # noqa: E402

class XpTransactionItem(BaseModel):
    id: int
    amount: int
    reason: str
    reference_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

@router.get("/xp-transactions", response_model=List[XpTransactionItem])
async def get_xp_transactions(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the authenticated user's XP ledger logs.
    """
    from app.models.xp_transaction import XpTransaction
    from sqlalchemy import select, desc
    
    offset = (page - 1) * limit
    result = await db.execute(
        select(XpTransaction)
        .where(XpTransaction.user_id == current_user.telegram_id)
        .order_by(desc(XpTransaction.created_at))
        .offset(offset)
        .limit(limit)
    )
    txs = result.scalars().all()
    return txs

