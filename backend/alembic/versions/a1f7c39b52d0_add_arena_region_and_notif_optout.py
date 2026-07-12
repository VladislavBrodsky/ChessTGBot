"""add arena region and notification opt-out to users

Revision ID: a1f7c39b52d0
Revises: e7f8a9b0c1d2
Create Date: 2026-07-12

Adds per-user daily-arena notification targeting:
  - region: coarse self-declared timezone bucket (nullable until asked)
  - arena_notifications: opt-out flag (default on)
"""
from typing import Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1f7c39b52d0'
down_revision: Union[str, None] = 'e7f8a9b0c1d2'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('region', sa.String(), nullable=True))
    op.add_column(
        'users',
        sa.Column('arena_notifications', sa.Boolean(), nullable=False,
                  server_default=sa.text('true')),
    )


def downgrade() -> None:
    op.drop_column('users', 'arena_notifications')
    op.drop_column('users', 'region')
