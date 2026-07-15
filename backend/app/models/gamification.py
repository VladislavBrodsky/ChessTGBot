from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum as SQLEnum, UniqueConstraint
from app.core.database import Base
from datetime import datetime, timezone
import enum

class TaskType(str, enum.Enum):
    WIN = "win"
    PLAY = "play"
    REFER = "refer"
    LOGIN = "login"
    PLAY_HUMAN = "play_human"  # played a PvP game (matchmade or friend invite)

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
    activated_at = Column(DateTime, nullable=True, index=True)

class UnlockedLesson(Base):
    __tablename__ = "unlocked_lessons"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    lesson_id = Column(String, index=True)
    unlocked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

class SolvedPuzzle(Base):
    __tablename__ = "solved_puzzles"
    __table_args__ = (UniqueConstraint('user_id', 'puzzle_id', name='uq_solved_puzzles_user_puzzle'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    puzzle_id = Column(Integer, index=True, nullable=False)
    solved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)


class UnlockedPuzzle(Base):
    __tablename__ = "unlocked_puzzles"
    __table_args__ = (UniqueConstraint('user_id', 'puzzle_id', name='uq_unlocked_puzzles_user_puzzle'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    puzzle_id = Column(Integer, index=True, nullable=False)
    unlocked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # e.g., 'first_win', 'streak_7'
    title = Column(String)
    description = Column(String)
    icon = Column(String)
    xp_reward = Column(Integer, default=0)
    requirement_type = Column(String) # e.g., 'wins', 'puzzles_solved', 'streak'
    requirement_value = Column(Integer)

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint('user_id', 'achievement_id', name='uq_user_achievements_user_achievement'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), index=True, nullable=False)
    unlocked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

class ThemeType(str, enum.Enum):
    BOARD = "board"
    PIECES = "pieces"

class Theme(Base):
    __tablename__ = "themes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True) # e.g., 'neon', 'wood'
    theme_type = Column(SQLEnum(ThemeType))
    name = Column(String)
    description = Column(String)
    price_xp = Column(Integer, default=0)
    css_class = Column(String, nullable=True) # for frontend rendering

class UserInventory(Base):
    __tablename__ = "user_inventory"
    __table_args__ = (UniqueConstraint('user_id', 'theme_id', name='uq_user_inventory_user_theme'),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    theme_id = Column(Integer, ForeignKey("themes.id"), index=True, nullable=False)
    acquired_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)

