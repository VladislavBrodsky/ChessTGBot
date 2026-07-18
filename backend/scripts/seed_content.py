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
        import importlib.util
        alembic_path = os.path.join(backend_dir, "alembic", "versions", "c7d20b3f9e14_seed_academy_content_and_gamification.py")
        spec = importlib.util.spec_from_file_location("seed_gamification", alembic_path)
        seed_gamification = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(seed_gamification)
        
        lessons = seed_gamification.LESSONS

        for lesson_data in lessons:
            res = await db.execute(select(Lesson).where(Lesson.slug == lesson_data["slug"]))
            existing_lesson = res.scalars().first()
            steps_data = lesson_data.pop("steps")
            
            if not existing_lesson:
                lesson = Lesson(**lesson_data)
                db.add(lesson)
                await db.flush() # get lesson.id
                for step_data in steps_data:
                    step = LessonStep(lesson_id=lesson.id, **step_data)
                    db.add(step)
            else:
                # Update existing lesson
                for key, value in lesson_data.items():
                    setattr(existing_lesson, key, value)
                
                # Update steps (simplest is to delete and recreate)
                await db.execute(LessonStep.__table__.delete().where(LessonStep.lesson_id == existing_lesson.id))
                for step_data in steps_data:
                    step = LessonStep(lesson_id=existing_lesson.id, **step_data)
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
