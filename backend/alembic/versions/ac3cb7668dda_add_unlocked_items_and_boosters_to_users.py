"""add_unlocked_items_and_boosters_to_users

Revision ID: ac3cb7668dda
Revises: c7d20b3f9e14
Create Date: 2026-07-15 10:23:14.562399

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac3cb7668dda'
down_revision: Union[str, Sequence[str], None] = 'c7d20b3f9e14'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('unlocked_items', sa.String(), nullable=True, server_default='[]'))
        batch_op.add_column(sa.Column('xp_multiplier', sa.Float(), nullable=False, server_default='1.0'))
        batch_op.add_column(sa.Column('multiplier_expires_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('multiplier_expires_at')
        batch_op.drop_column('xp_multiplier')
        batch_op.drop_column('unlocked_items')
