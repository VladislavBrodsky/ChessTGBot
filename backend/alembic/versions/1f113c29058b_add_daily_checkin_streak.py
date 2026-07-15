"""add daily checkin streak

Revision ID: 1f113c29058b
Revises: 068a2009f2ca
Create Date: 2026-07-15 00:15:55.878387

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision: str = '1f113c29058b'
down_revision: Union[str, Sequence[str], None] = '068a2009f2ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('checkin_streak', sa.Integer(), server_default="0", nullable=False))
    op.add_column('users', sa.Column('last_checkin_date', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'last_checkin_date')
    op.drop_column('users', 'checkin_streak')
