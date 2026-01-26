from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime
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
    user_id = Column(Integer, ForeignKey("users.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"))
    progress = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    claimed = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Reset daily tasks logic will use updated_at

class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id"))
    referred_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
