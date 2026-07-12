"""add_is_blocked_to_users

Revision ID: a1b2c3d4e5f6
Revises: f103b3a5e790
Create Date: 2026-07-12

"""
from typing import Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'f103b3a5e790'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_blocked', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('users', sa.Column('blocked_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'blocked_at')
    op.drop_column('users', 'is_blocked')
