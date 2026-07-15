import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.models.content import Lesson, LessonStep, Puzzle  # noqa: E402

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./chess.db")
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def seed_content():
    async with AsyncSessionLocal() as db:
        # Seed Lessons
        lessons = [
            {
                "slug": "piece-values",
                "title": "Piece Values",
                "description": "Learn the relative values of each chess piece to make better trades.",
                "difficulty": "Beginner",
                "order_index": 1,
                "xp_reward": 50,
                "steps": [
                    {"order_index": 1, "content": "A pawn is worth 1 point. Knights and Bishops are worth 3 points.", "fen": None},
                    {"order_index": 2, "content": "A rook is worth 5 points, and a queen is worth 9. The king's value is infinite!", "fen": None}
                ]
            },
            {
                "slug": "forks",
                "title": "Forks",
                "description": "Attack two pieces at once to gain a material advantage.",
                "difficulty": "Intermediate",
                "order_index": 2,
                "xp_reward": 100,
                "steps": [
                    {"order_index": 1, "content": "A fork happens when a single piece attacks two or more of the opponent's pieces simultaneously.", "fen": "8/8/8/3N4/8/2q1k3/8/8 w - - 0 1"},
                    {"order_index": 2, "content": "Knights are especially famous for their forks, often attacking a king and a queen.", "fen": None}
                ]
            }
        ]

        for lesson_data in lessons:
            res = await db.execute(select(Lesson).where(Lesson.slug == lesson_data["slug"]))
            existing_lesson = res.scalars().first()
            if not existing_lesson:
                steps_data = lesson_data.pop("steps")
                lesson = Lesson(**lesson_data)
                db.add(lesson)
                await db.flush() # get lesson.id
                for step_data in steps_data:
                    step = LessonStep(lesson_id=lesson.id, **step_data)
                    db.add(step)

        # Seed Puzzles
        puzzles = [
            {"fen": "8/8/8/8/3Q4/8/6K1/2k5 w - - 0 1", "solution": "d4c5", "theme": "Checkmate", "difficulty": "Beginner", "rating": 800, "xp_reward": 10},
            {"fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1", "solution": "e1g1,e8g8", "theme": "Opening", "difficulty": "Intermediate", "rating": 1200, "xp_reward": 20},
        ]
        
        for puzzle_data in puzzles:
            res = await db.execute(select(Puzzle).where(Puzzle.fen == puzzle_data["fen"]))
            if not res.scalars().first():
                db.add(Puzzle(**puzzle_data))

        await db.commit()
        print("Seeded content successfully.")

if __name__ == "__main__":
    asyncio.run(seed_content())
