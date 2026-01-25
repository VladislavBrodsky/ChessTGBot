"""add_game_history_table

Revision ID: d4e4e2af71e3
Revises: 
Create Date: 2026-01-25 17:36:47.953704

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e4e2af71e3'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'game_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('game_id', sa.String(), nullable=False),
        sa.Column('white_player_id', sa.BigInteger(), nullable=False),
        sa.Column('black_player_id', sa.BigInteger(), nullable=False),
        sa.Column('winner', sa.String(), nullable=True),
        sa.Column('result_type', sa.String(), nullable=True),
        sa.Column('white_elo_before', sa.Integer(), nullable=False),
        sa.Column('white_elo_after', sa.Integer(), nullable=False),
        sa.Column('black_elo_before', sa.Integer(), nullable=False),
        sa.Column('black_elo_after', sa.Integer(), nullable=False),
        sa.Column('total_moves', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('final_fen', sa.String(), nullable=True),
        sa.Column('game_type', sa.String(), nullable=False, server_default='online'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('ended_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_game_history_game_id'), 'game_history', ['game_id'], unique=True)
    op.create_index(op.f('ix_game_history_id'), 'game_history', ['id'], unique=False)
    op.create_index(op.f('ix_game_history_white_player_id'), 'game_history', ['white_player_id'], unique=False)
    op.create_index(op.f('ix_game_history_black_player_id'), 'game_history', ['black_player_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_game_history_black_player_id'), table_name='game_history')
    op.drop_index(op.f('ix_game_history_white_player_id'), table_name='game_history')
    op.drop_index(op.f('ix_game_history_id'), table_name='game_history')
    op.drop_index(op.f('ix_game_history_game_id'), table_name='game_history')
    op.drop_table('game_history')
