import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app.models.gamification import Achievement, Theme  # noqa: E402

# Get database URL (use same logic as env.py if needed, or just let SQLAlchemy handle it)
# Assuming SQLite for local dev
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./chess.db")

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def seed_gamification():
    async with AsyncSessionLocal() as db:
        # Achievements
        achievements = [
            {"code": "first_win", "title": "First Blood", "description": "Win your first game.", "icon": "fa-trophy", "xp_reward": 50, "requirement_type": "wins", "requirement_value": 1},
            {"code": "wins_10", "title": "Rising Star", "description": "Win 10 games.", "icon": "fa-star", "xp_reward": 200, "requirement_type": "wins", "requirement_value": 10},
            {"code": "games_played_50", "title": "Veteran", "description": "Play 50 games total.", "icon": "fa-shield-alt", "xp_reward": 500, "requirement_type": "games_played", "requirement_value": 50},
            {"code": "study_streak_3", "title": "Dedicated Scholar", "description": "Maintain a 3-day study streak.", "icon": "fa-book", "xp_reward": 100, "requirement_type": "study_streak", "requirement_value": 3},
            {"code": "study_streak_7", "title": "Grandmaster Apprentice", "description": "Maintain a 7-day study streak.", "icon": "fa-fire", "xp_reward": 500, "requirement_type": "study_streak", "requirement_value": 7},
            {"code": "xp_5000", "title": "XP Hoarder", "description": "Accumulate 5,000 XP.", "icon": "fa-coins", "xp_reward": 0, "requirement_type": "xp", "requirement_value": 5000},
        ]
        
        for ach_data in achievements:
            res = await db.execute(select(Achievement).where(Achievement.code == ach_data["code"]))
            if not res.scalars().first():
                db.add(Achievement(**ach_data))

        # Themes
        themes = [
            {"code": "default", "theme_type": "board", "name": "Classic Wood", "description": "The default classic wood board.", "price_xp": 0, "css_class": "board-classic"},
            {"code": "neon", "theme_type": "board", "name": "Cyberpunk Neon", "description": "A futuristic neon glowing board.", "price_xp": 5000, "css_class": "board-neon"},
            {"code": "obsidian", "theme_type": "board", "name": "Dark Obsidian", "description": "A sleek, dark obsidian board.", "price_xp": 10000, "css_class": "board-obsidian"},
            {"code": "marble", "theme_type": "board", "name": "Roman Marble", "description": "An elegant marble finish.", "price_xp": 25000, "css_class": "board-marble"},
        ]

        for theme_data in themes:
            res = await db.execute(select(Theme).where(Theme.code == theme_data["code"]))
            if not res.scalars().first():
                db.add(Theme(**theme_data))

        await db.commit()
        print("Seeded gamification content successfully.")

if __name__ == "__main__":
    asyncio.run(seed_gamification())
