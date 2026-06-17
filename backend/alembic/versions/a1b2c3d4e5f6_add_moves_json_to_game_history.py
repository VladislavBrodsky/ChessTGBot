"""add moves_json to game_history

Revision ID: a1b2c3d4e5f6
Revises: 9a8b7c6d5e4f
Create Date: 2026-06-17 19:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '9a8b7c6d5e4f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add moves_json column to game_history if it does not already exist."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('game_history')]

    if 'moves_json' not in columns:
        op.add_column(
            'game_history',
            sa.Column('moves_json', sa.String(), nullable=True)
        )


def downgrade() -> None:
    """Remove moves_json column from game_history."""
    with op.batch_alter_table('game_history') as batch_op:
        batch_op.drop_column('moves_json')
