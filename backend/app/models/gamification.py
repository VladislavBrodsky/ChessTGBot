from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime, timezone
import enum

class TaskType(str, enum.Enum):
    WIN = "win"
    PLAY = "play"
    REFER = "refer"
    LOGIN = "login"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title_key = Column(String)  # Translation key
    description_key = Column(String) # Translation key
    xp_reward = Column(Integer)
    required_level = Column(Integer, default=0)
    task_type = Column(SQLEnum(TaskType))
    target_count = Column(Integer, default=1)
    is_daily = Column(Boolean, default=False)
    icon = Column(String, nullable=True) # Icon name

class UserTask(Base):
    __tablename__ = "user_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), index=True)
    progress = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    claimed = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Reset daily tasks logic will use updated_at

class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id"), index=True)
    referred_user_id = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

class UnlockedLesson(Base):
    __tablename__ = "unlocked_lessons"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    lesson_id = Column(String, index=True)
    unlocked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

class SolvedPuzzle(Base):
    __tablename__ = "solved_puzzles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    puzzle_id = Column(Integer, index=True, nullable=False)
    solved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)


class UnlockedPuzzle(Base):
    __tablename__ = "unlocked_puzzles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    puzzle_id = Column(Integer, index=True, nullable=False)
    unlocked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

