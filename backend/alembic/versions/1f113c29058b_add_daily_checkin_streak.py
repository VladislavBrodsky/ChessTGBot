"""add daily checkin streak

Revision ID: 1f113c29058b
Revises: 8e3d9b5f0a2c
Create Date: 2026-07-15 00:15:55.878387

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '1f113c29058b'
down_revision: Union[str, Sequence[str], None] = '8e3d9b5f0a2c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Idempotent: this migration sat unapplied in production for hours behind a
    # broken (since-deleted) duplicate revision, so the columns may already
    # exist via manual repair. Converge instead of crash-looping the deploy.
    conn = op.get_bind()
    columns = {c["name"] for c in sa.inspect(conn).get_columns("users")}
    if "checkin_streak" not in columns:
        op.add_column('users', sa.Column('checkin_streak', sa.Integer(), server_default="0", nullable=False))
    if "last_checkin_date" not in columns:
        op.add_column('users', sa.Column('last_checkin_date', sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'last_checkin_date')
    op.drop_column('users', 'checkin_streak')
