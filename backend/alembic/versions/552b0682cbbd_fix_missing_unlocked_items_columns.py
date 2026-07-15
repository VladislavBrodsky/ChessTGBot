"""Fix missing unlocked_items columns

Revision ID: 552b0682cbbd
Revises: ac3cb7668dda
Create Date: 2026-07-15 11:13:49.406097

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '552b0682cbbd'
down_revision: Union[str, Sequence[str], None] = 'ac3cb7668dda'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use raw SQL to add columns IF NOT EXISTS to prevent errors if they are already present
    # This handles both SQLite (local dev) and PostgreSQL (production) gracefully for simple additions
    
    # SQLite doesn't natively support IF NOT EXISTS in ADD COLUMN in older versions,
    # but we can wrap it in try/except using Alembic's batch_alter_table.
    # However, since this is to fix the PostgreSQL Railway deployment, we will use op.execute
    # and handle the PostgreSQL dialect specifically, or just use try-except for the batch op.
    
    import sqlalchemy as sa
    from sqlalchemy.exc import ProgrammingError, OperationalError
    
    bind = op.get_bind()
    dialect = bind.dialect.name
    
    if dialect == 'postgresql':
        op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS unlocked_items VARCHAR DEFAULT '[]'")
        op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_multiplier DOUBLE PRECISION DEFAULT 1.0 NOT NULL")
        op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS multiplier_expires_at TIMESTAMP WITHOUT TIME ZONE")
    else:
        # SQLite or other DBs (local testing)
        # Try to add columns, ignore duplicate column errors
        try:
            with op.batch_alter_table('users', schema=None) as batch_op:
                batch_op.add_column(sa.Column('unlocked_items', sa.String(), nullable=True, server_default='[]'))
        except (OperationalError, ProgrammingError):
            pass
            
        try:
            with op.batch_alter_table('users', schema=None) as batch_op:
                batch_op.add_column(sa.Column('xp_multiplier', sa.Float(), nullable=False, server_default='1.0'))
        except (OperationalError, ProgrammingError):
            pass
            
        try:
            with op.batch_alter_table('users', schema=None) as batch_op:
                batch_op.add_column(sa.Column('multiplier_expires_at', sa.DateTime(), nullable=True))
        except (OperationalError, ProgrammingError):
            pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
