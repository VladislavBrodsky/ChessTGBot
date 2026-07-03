"""add_difficulty_to_game_history

Revision ID: 51640ed295db
Revises: 54ef1913c988
Create Date: 2026-07-03 17:48:20.529809

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '51640ed295db'
down_revision: Union[str, Sequence[str], None] = '54ef1913c988'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('game_history', sa.Column('difficulty', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('game_history', 'difficulty')
