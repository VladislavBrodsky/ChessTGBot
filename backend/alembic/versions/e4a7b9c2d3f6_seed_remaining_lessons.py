"""Seed all remaining lessons that were not inserted by c7d20b3f9e14.

The initial migration was applied when LESSONS only had 2 entries (piece-values,
forks). This migration re-runs the same idempotent logic over the now-full
LESSONS list so all 70+ lessons reach production.

Revision ID: e4a7b9c2d3f6
Revises: d9f3a2c8b1e5
Create Date: 2026-07-18
"""
import importlib.util
import os

from alembic import op
import sqlalchemy as sa

revision = 'e4a7b9c2d3f6'
down_revision = 'd9f3a2c8b1e5'
branch_labels = None
depends_on = None


def _load_seed_module():
    """Dynamically load LESSONS from the original seed migration."""
    here = os.path.dirname(__file__)
    path = os.path.join(here, 'c7d20b3f9e14_seed_academy_content_and_gamification.py')
    spec = importlib.util.spec_from_file_location('seed_c7d20b3f9e14', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[attr-defined]
    return mod


lessons_t = sa.table(
    'lessons',
    sa.column('id', sa.Integer),
    sa.column('slug', sa.String),
    sa.column('title', sa.String),
    sa.column('description', sa.String),
    sa.column('difficulty', sa.String),
    sa.column('order_index', sa.Integer),
    sa.column('xp_reward', sa.Integer),
)

lesson_steps_t = sa.table(
    'lesson_steps',
    sa.column('id', sa.Integer),
    sa.column('lesson_id', sa.Integer),
    sa.column('order_index', sa.Integer),
    sa.column('content', sa.String),
    sa.column('step_type', sa.String),
    sa.column('fen', sa.String),
)


def upgrade() -> None:
    mod = _load_seed_module()
    LESSONS = mod.LESSONS

    conn = op.get_bind()

    for lesson in LESSONS:
        exists = conn.execute(
            sa.select(lessons_t.c.id).where(lessons_t.c.slug == lesson['slug'])
        ).first()
        if exists:
            continue

        fields = {k: v for k, v in lesson.items() if k != 'steps'}
        conn.execute(sa.insert(lessons_t).values(**fields))

        lesson_id = conn.execute(
            sa.select(lessons_t.c.id).where(lessons_t.c.slug == lesson['slug'])
        ).scalar_one()

        for step in lesson['steps']:
            conn.execute(sa.insert(lesson_steps_t).values(lesson_id=lesson_id, **step))


def downgrade() -> None:
    # Safe no-op: the original migration's downgrade handles cleanup
    pass
