"""Seed academy content, achievements, and themes

The academy went DB-driven (5b106fd5041a / 859df7f35d7b) but nothing populated
production: backend/scripts/seed_content.py and seed_gamification.py are
standalone scripts nobody runs on deploy, so the Mastery Tracks list, the
achievements page, and the theme shop all rendered empty. Seed the same data
here so it ships with `alembic upgrade head`.

Idempotent by natural key (lessons.slug, puzzles.fen, achievements.code,
themes.code): existing rows are left untouched — no DELETE, since
user_achievements/user_inventory hold foreign keys into these tables.

Revision ID: c7d20b3f9e14
Revises: 5b106fd5041a
Create Date: 2026-07-15 15:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

# revision identifiers, used by Alembic.
revision: str = 'c7d20b3f9e14'
down_revision: Union[str, Sequence[str], None] = '5b106fd5041a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


lessons_t = table(
    'lessons',
    column('id', sa.Integer),
    column('slug', sa.String),
    column('title', sa.String),
    column('description', sa.Text),
    column('difficulty', sa.String),
    column('order_index', sa.Integer),
    column('xp_reward', sa.Integer),
)

lesson_steps_t = table(
    'lesson_steps',
    column('id', sa.Integer),
    column('lesson_id', sa.Integer),
    column('order_index', sa.Integer),
    column('content', sa.Text),
    column('fen', sa.String),
)

puzzles_t = table(
    'puzzles',
    column('id', sa.Integer),
    column('fen', sa.String),
    column('solution', sa.String),
    column('theme', sa.String),
    column('difficulty', sa.String),
    column('rating', sa.Integer),
    column('xp_reward', sa.Integer),
)

achievements_t = table(
    'achievements',
    column('id', sa.Integer),
    column('code', sa.String),
    column('title', sa.String),
    column('description', sa.String),
    column('icon', sa.String),
    column('xp_reward', sa.Integer),
    column('requirement_type', sa.String),
    column('requirement_value', sa.Integer),
)

themes_t = table(
    'themes',
    column('id', sa.Integer),
    column('code', sa.String),
    # 'BOARD'/'PIECES' are the labels of the themetype enum created in 859df7f35d7b.
    column('theme_type', sa.Enum('BOARD', 'PIECES', name='themetype')),
    column('name', sa.String),
    column('description', sa.String),
    column('price_xp', sa.Integer),
    column('css_class', sa.String),
)

LESSONS = [
    {
        "slug": "piece-values",
        "title": "Piece Values",
        "description": "Learn the relative values of each chess piece to make better trades.",
        "difficulty": "Beginner",
        "order_index": 1,
        "xp_reward": 50,
        "steps": [
            {"order_index": 1, "content": "A pawn is worth 1 point. Knights and Bishops are worth 3 points.", "fen": None},
            {"order_index": 2, "content": "A rook is worth 5 points, and a queen is worth 9. The king's value is infinite!", "fen": None},
        ],
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
            {"order_index": 2, "content": "Knights are especially famous for their forks, often attacking a king and a queen.", "fen": None},
        ],
    },
]

PUZZLES = [
    {"fen": "8/8/8/8/3Q4/8/6K1/2k5 w - - 0 1", "solution": "d4c5", "theme": "Checkmate", "difficulty": "Beginner", "rating": 800, "xp_reward": 10},
    {"fen": "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1", "solution": "e1g1,e8g8", "theme": "Opening", "difficulty": "Intermediate", "rating": 1200, "xp_reward": 20},
]

ACHIEVEMENTS = [
    {"code": "first_win", "title": "First Blood", "description": "Win your first game.", "icon": "fa-trophy", "xp_reward": 50, "requirement_type": "wins", "requirement_value": 1},
    {"code": "wins_10", "title": "Rising Star", "description": "Win 10 games.", "icon": "fa-star", "xp_reward": 200, "requirement_type": "wins", "requirement_value": 10},
    {"code": "games_played_50", "title": "Veteran", "description": "Play 50 games total.", "icon": "fa-shield-alt", "xp_reward": 500, "requirement_type": "games_played", "requirement_value": 50},
    {"code": "study_streak_3", "title": "Dedicated Scholar", "description": "Maintain a 3-day study streak.", "icon": "fa-book", "xp_reward": 100, "requirement_type": "study_streak", "requirement_value": 3},
    {"code": "study_streak_7", "title": "Grandmaster Apprentice", "description": "Maintain a 7-day study streak.", "icon": "fa-fire", "xp_reward": 500, "requirement_type": "study_streak", "requirement_value": 7},
    {"code": "xp_5000", "title": "XP Hoarder", "description": "Accumulate 5,000 XP.", "icon": "fa-coins", "xp_reward": 0, "requirement_type": "xp", "requirement_value": 5000},
]

THEMES = [
    {"code": "default", "theme_type": "BOARD", "name": "Classic Wood", "description": "The default classic wood board.", "price_xp": 0, "css_class": "board-classic"},
    {"code": "neon", "theme_type": "BOARD", "name": "Cyberpunk Neon", "description": "A futuristic neon glowing board.", "price_xp": 1000, "css_class": "board-neon"},
    {"code": "obsidian", "theme_type": "BOARD", "name": "Dark Obsidian", "description": "A sleek, dark obsidian board.", "price_xp": 2000, "css_class": "board-obsidian"},
    {"code": "marble", "theme_type": "BOARD", "name": "Roman Marble", "description": "An elegant marble finish.", "price_xp": 5000, "css_class": "board-marble"},
]


def upgrade() -> None:
    conn = op.get_bind()

    for lesson in LESSONS:
        exists = conn.execute(
            sa.select(lessons_t.c.id).where(lessons_t.c.slug == lesson["slug"])
        ).first()
        if exists:
            continue
        fields = {k: v for k, v in lesson.items() if k != "steps"}
        conn.execute(sa.insert(lessons_t).values(**fields))
        lesson_id = conn.execute(
            sa.select(lessons_t.c.id).where(lessons_t.c.slug == lesson["slug"])
        ).scalar_one()
        for step in lesson["steps"]:
            conn.execute(sa.insert(lesson_steps_t).values(lesson_id=lesson_id, **step))

    for puzzle in PUZZLES:
        exists = conn.execute(
            sa.select(puzzles_t.c.id).where(puzzles_t.c.fen == puzzle["fen"])
        ).first()
        if not exists:
            conn.execute(sa.insert(puzzles_t).values(**puzzle))

    for achievement in ACHIEVEMENTS:
        exists = conn.execute(
            sa.select(achievements_t.c.id).where(achievements_t.c.code == achievement["code"])
        ).first()
        if not exists:
            conn.execute(sa.insert(achievements_t).values(**achievement))

    for theme in THEMES:
        exists = conn.execute(
            sa.select(themes_t.c.id).where(themes_t.c.code == theme["code"])
        ).first()
        if not exists:
            conn.execute(sa.insert(themes_t).values(**theme))


def downgrade() -> None:
    conn = op.get_bind()

    lesson_ids = [
        row[0]
        for row in conn.execute(
            sa.select(lessons_t.c.id).where(
                lessons_t.c.slug.in_([lesson["slug"] for lesson in LESSONS])
            )
        )
    ]
    if lesson_ids:
        conn.execute(sa.delete(lesson_steps_t).where(lesson_steps_t.c.lesson_id.in_(lesson_ids)))
        conn.execute(sa.delete(lessons_t).where(lessons_t.c.id.in_(lesson_ids)))

    conn.execute(sa.delete(puzzles_t).where(puzzles_t.c.fen.in_([p["fen"] for p in PUZZLES])))
    conn.execute(sa.delete(achievements_t).where(achievements_t.c.code.in_([a["code"] for a in ACHIEVEMENTS])))
    conn.execute(sa.delete(themes_t).where(themes_t.c.code.in_([t["code"] for t in THEMES])))
