"""create_solved_puzzles_and_other_tables

Revision ID: 403cb04d077c
Revises: a1b2c3d4e5f6
Create Date: 2026-06-18 15:23:53.496402

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '403cb04d077c'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'solved_puzzles' not in tables:
        op.create_table(
            'solved_puzzles',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('puzzle_id', sa.Integer(), nullable=False),
            sa.Column('solved_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'])
        )
        op.create_index(op.f('ix_solved_puzzles_id'), 'solved_puzzles', ['id'], unique=False)
        op.create_index(op.f('ix_solved_puzzles_user_id'), 'solved_puzzles', ['user_id'], unique=False)
        op.create_index(op.f('ix_solved_puzzles_puzzle_id'), 'solved_puzzles', ['puzzle_id'], unique=False)

    if 'unlocked_lessons' not in tables:
        op.create_table(
            'unlocked_lessons',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('lesson_id', sa.String(), nullable=False),
            sa.Column('unlocked_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'])
        )
        op.create_index(op.f('ix_unlocked_lessons_id'), 'unlocked_lessons', ['id'], unique=False)
        op.create_index(op.f('ix_unlocked_lessons_user_id'), 'unlocked_lessons', ['user_id'], unique=False)
        op.create_index(op.f('ix_unlocked_lessons_lesson_id'), 'unlocked_lessons', ['lesson_id'], unique=False)

    if 'xp_transactions' not in tables:
        op.create_table(
            'xp_transactions',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.BigInteger(), nullable=False),
            sa.Column('amount', sa.Integer(), nullable=False),
            sa.Column('reason', sa.String(), nullable=False),
            sa.Column('reference_id', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id'),
            sa.ForeignKeyConstraint(['user_id'], ['users.telegram_id'])
        )
        op.create_index(op.f('ix_xp_transactions_id'), 'xp_transactions', ['id'], unique=False)
        op.create_index(op.f('ix_xp_transactions_user_id'), 'xp_transactions', ['user_id'], unique=False)
        op.create_index(op.f('ix_xp_transactions_created_at'), 'xp_transactions', ['created_at'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_xp_transactions_created_at'), table_name='xp_transactions')
    op.drop_index(op.f('ix_xp_transactions_user_id'), table_name='xp_transactions')
    op.drop_index(op.f('ix_xp_transactions_id'), table_name='xp_transactions')
    op.drop_table('xp_transactions')

    op.drop_index(op.f('ix_unlocked_lessons_lesson_id'), table_name='unlocked_lessons')
    op.drop_index(op.f('ix_unlocked_lessons_user_id'), table_name='unlocked_lessons')
    op.drop_index(op.f('ix_unlocked_lessons_id'), table_name='unlocked_lessons')
    op.drop_table('unlocked_lessons')

    op.drop_index(op.f('ix_solved_puzzles_puzzle_id'), table_name='solved_puzzles')
    op.drop_index(op.f('ix_solved_puzzles_user_id'), table_name='solved_puzzles')
    op.drop_index(op.f('ix_solved_puzzles_id'), table_name='solved_puzzles')
    op.drop_table('solved_puzzles')

