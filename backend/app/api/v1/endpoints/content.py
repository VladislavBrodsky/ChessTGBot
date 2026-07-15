from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.content import Lesson, Puzzle

router = APIRouter()

class LessonStepResponse(BaseModel):
    id: int
    order_index: int
    content: str
    fen: Optional[str] = None

class LessonResponse(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    difficulty: str
    order_index: int
    xp_reward: int
    steps: List[LessonStepResponse]

class PuzzleResponse(BaseModel):
    id: int
    fen: str
    solution: str
    theme: str
    difficulty: str
    rating: int
    xp_reward: int

@router.get("/lessons", response_model=List[LessonResponse])
async def get_lessons(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all lessons ordered by index."""
    result = await db.execute(
        select(Lesson).options(selectinload(Lesson.steps)).order_by(Lesson.order_index)
    )
    lessons = result.scalars().all()
    return lessons

@router.get("/lessons/{slug}", response_model=LessonResponse)
async def get_lesson(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific lesson by slug."""
    result = await db.execute(
        select(Lesson).options(selectinload(Lesson.steps)).where(Lesson.slug == slug)
    )
    lesson = result.scalars().first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@router.get("/puzzles", response_model=List[PuzzleResponse])
async def get_puzzles(
    difficulty: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get puzzles, optionally filtered by difficulty."""
    stmt = select(Puzzle)
    if difficulty:
        stmt = stmt.where(Puzzle.difficulty == difficulty)
    
    result = await db.execute(stmt)
    puzzles = result.scalars().all()
    return puzzles
