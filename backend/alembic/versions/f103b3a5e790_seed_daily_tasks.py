"""Seed daily tasks

Revision ID: f103b3a5e790
Revises: e1595d876e73
Create Date: 2026-01-25 22:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from app.models.gamification import TaskType

# revision identifiers, used by Alembic.
revision: str = 'f103b3a5e790'
down_revision: Union[str, None] = 'e1595d876e73'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Define table structure for insertion
    tasks_table = table(
        'tasks',
        column('id', sa.Integer),
        column('title_key', sa.String),
        column('description_key', sa.String),
        column('xp_reward', sa.Integer),
        column('required_level', sa.Integer),
        column('task_type', sa.Enum('WIN', 'PLAY', 'REFER', 'LOGIN', name='tasktype')),
        column('target_count', sa.Integer),
        column('is_daily', sa.Boolean),
        column('icon', sa.String)
    )

    # Insert Data
    op.bulk_insert(
        tasks_table,
        [
            {
                'title_key': 'daily_login',
                'description_key': 'daily_login_desc',
                'xp_reward': 10,
                'required_level': 1,
                'task_type': 'LOGIN', # Enum mapped as string usually works in bulk_insert if type matches
                'target_count': 1,
                'is_daily': True,
                'icon': 'FaBolt'
            },
            {
                'title_key': 'daily_play',
                'description_key': 'daily_play_desc',
                'xp_reward': 30,
                'required_level': 1,
                'task_type': 'PLAY',
                'target_count': 3,
                'is_daily': True,
                'icon': 'FaChess'
            },
            {
                'title_key': 'daily_win',
                'description_key': 'daily_win_desc',
                'xp_reward': 50,
                'required_level': 1,
                'task_type': 'WIN',
                'target_count': 1,
                'is_daily': True,
                'icon': 'FaTrophy'
            }
        ]
    )


def downgrade() -> None:
    # Remove inserted data
    op.execute("DELETE FROM tasks WHERE title_key IN ('daily_login', 'daily_play', 'daily_win')")
