"""add_unlocked_puzzles_table

Revision ID: 0b0dd267bb86
Revises: 403cb04d077c
Create Date: 2026-06-18 15:28:59.094130

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0b0dd267bb86'
down_revision: Union[str, Sequence[str], None] = '403cb04d077c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'unlocked_puzzles' not in tables:
        op.create_table(
            'unlocked_puzzles',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('puzzle_id', sa.Integer(), nullable=False),
            sa.Column('unlocked_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'])
        )
        op.create_index(op.f('ix_unlocked_puzzles_id'), 'unlocked_puzzles', ['id'], unique=False)
        op.create_index(op.f('ix_unlocked_puzzles_user_id'), 'unlocked_puzzles', ['user_id'], unique=False)
        op.create_index(op.f('ix_unlocked_puzzles_puzzle_id'), 'unlocked_puzzles', ['puzzle_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_unlocked_puzzles_puzzle_id'), table_name='unlocked_puzzles')
    op.drop_index(op.f('ix_unlocked_puzzles_user_id'), table_name='unlocked_puzzles')
    op.drop_index(op.f('ix_unlocked_puzzles_id'), table_name='unlocked_puzzles')
    op.drop_table('unlocked_puzzles')

