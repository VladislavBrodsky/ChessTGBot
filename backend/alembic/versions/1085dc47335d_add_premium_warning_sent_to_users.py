"""add_premium_warning_sent_to_users

Revision ID: 1085dc47335d
Revises: 0b0dd267bb86
Create Date: 2026-06-18 21:23:12.788768

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1085dc47335d'
down_revision: Union[str, Sequence[str], None] = '0b0dd267bb86'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    try:
        op.add_column('users', sa.Column('premium_warning_sent', sa.Integer(), server_default='0', nullable=True))
    except Exception as e:
        # Ignore if column already exists
        if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
            pass
        else:
            raise


def downgrade() -> None:
    """Downgrade schema."""
    try:
        op.drop_column('users', 'premium_warning_sent')
    except Exception:
        pass
