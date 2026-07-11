"""add PLAY_HUMAN task type enum value

Revision ID: b8c2f1a90d47
Revises: 903a4dc84f03
Create Date: 2026-07-10 23:05:00.000000

The daily "play a match against a human" task needs a new TaskType enum
value. The task row itself is seeded idempotently at app startup
(app/core/database.py); this migration only extends the Postgres enum so
that insert can succeed.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8c2f1a90d47'
down_revision: Union[str, Sequence[str], None] = '903a4dc84f03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        # ADD VALUE must run outside the migration transaction on Postgres
        with op.get_context().autocommit_block():
            op.execute("ALTER TYPE tasktype ADD VALUE IF NOT EXISTS 'PLAY_HUMAN'")
    # SQLite stores enums as plain strings — nothing to do.


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres cannot remove an enum value; the extra value is harmless.
    pass
