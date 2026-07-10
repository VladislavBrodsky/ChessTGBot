"""add_unique_constraint_to_puzzles

Revision ID: 903a4dc84f03
Revises: 51640ed295db
Create Date: 2026-07-10 17:01:36.818839

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '903a4dc84f03'
down_revision: Union[str, Sequence[str], None] = '51640ed295db'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('solved_puzzles', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_solved_puzzles_user_puzzle', ['user_id', 'puzzle_id'])

    with op.batch_alter_table('unlocked_puzzles', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_unlocked_puzzles_user_puzzle', ['user_id', 'puzzle_id'])


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('solved_puzzles', schema=None) as batch_op:
        batch_op.drop_constraint('uq_solved_puzzles_user_puzzle', type_='unique')

    with op.batch_alter_table('unlocked_puzzles', schema=None) as batch_op:
        batch_op.drop_constraint('uq_unlocked_puzzles_user_puzzle', type_='unique')
