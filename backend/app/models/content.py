from sqlalchemy import Integer, String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from typing import List, Optional

class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String) # Beginner, Intermediate, Advanced
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    xp_reward: Mapped[int] = mapped_column(Integer, default=50)

    steps: Mapped[List["LessonStep"]] = relationship("LessonStep", back_populates="lesson", order_by="LessonStep.order_index")

class LessonStep(Base):
    __tablename__ = "lesson_steps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lesson_id: Mapped[int] = mapped_column(Integer, ForeignKey("lessons.id"), index=True)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    content: Mapped[str] = mapped_column(Text)
    fen: Mapped[Optional[str]] = mapped_column(String, nullable=True) # FEN representation for the board, if applicable

    lesson: Mapped["Lesson"] = relationship("Lesson", back_populates="steps")

class Puzzle(Base):
    __tablename__ = "puzzles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fen: Mapped[str] = mapped_column(String)
    solution: Mapped[str] = mapped_column(String) # e.g., "e2e4,e7e5" (comma separated LAN moves)
    theme: Mapped[str] = mapped_column(String) # e.g., "Fork", "Pin"
    difficulty: Mapped[str] = mapped_column(String)
    rating: Mapped[int] = mapped_column(Integer, default=1000)
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)
