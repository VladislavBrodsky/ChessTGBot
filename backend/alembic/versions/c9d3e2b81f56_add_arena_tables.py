"""add daily arena tables

Revision ID: c9d3e2b81f56
Revises: b8c2f1a90d47
Create Date: 2026-07-11 08:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9d3e2b81f56'
down_revision: Union[str, Sequence[str], None] = 'b8c2f1a90d47'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'arenas',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('starts_at', sa.DateTime(), nullable=False, index=True),
        sa.Column('ends_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='scheduled'),
        sa.Column('time_control_seconds', sa.Integer(), nullable=False, server_default='300'),
        sa.Column('notified_at', sa.DateTime(), nullable=True),
        sa.Column('finished_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('starts_at', name='uq_arenas_starts_at'),
    )
    op.create_table(
        'arena_players',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('arena_id', sa.Integer(), sa.ForeignKey('arenas.id'), nullable=False, index=True),
        sa.Column('user_id', sa.BigInteger(), nullable=False, index=True),
        sa.Column('score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('wins', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('draws', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('losses', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('games_played', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('arena_id', 'user_id', name='uq_arena_players_arena_user'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('arena_players')
    op.drop_table('arenas')
