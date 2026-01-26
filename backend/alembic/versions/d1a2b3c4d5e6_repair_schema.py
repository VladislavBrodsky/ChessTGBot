"""repair schema

Revision ID: d1a2b3c4d5e6
Revises: c5e4d3a2b1f0
Create Date: 2026-01-26 12:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = 'd1a2b3c4d5e6'
down_revision: Union[str, None] = 'c5e4d3a2b1f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('users')]

    # Check and add profile columns
    if 'last_name' not in columns:
        op.add_column('users', sa.Column('last_name', sa.String(), nullable=True))
    
    if 'username' not in columns:
        op.add_column('users', sa.Column('username', sa.String(), nullable=True))
        
    if 'photo_url' not in columns:
        op.add_column('users', sa.Column('photo_url', sa.String(), nullable=True))

    # Check and add subscription columns (safeguard)
    if 'is_premium' not in columns:
        op.add_column('users', sa.Column('is_premium', sa.Boolean(), nullable=True, server_default='false'))
    if 'premium_tier' not in columns:
        op.add_column('users', sa.Column('premium_tier', sa.String(), nullable=True))
    if 'premium_expires_at' not in columns:
        op.add_column('users', sa.Column('premium_expires_at', sa.DateTime(), nullable=True))
    
    # Check and add balance/wallet (safeguard)
    if 'balance' not in columns:
        op.add_column('users', sa.Column('balance', sa.Integer(), nullable=True, server_default='0'))
    if 'wallet_address' not in columns:
        op.add_column('users', sa.Column('wallet_address', sa.String(), nullable=True))
    
    # Update server defaults if needed (cleanup)
    # We check if columns exist now (either they existed before or we just added them)
    # Re-fetch columns is not strictly necessary as we know what we added, but for safety in logic:
    
    # If we added 'is_premium' with default, remove the default now (postgres behavior)
    # Note: Alembic operations inside if blocks are tricky if not careful, but add_column followed by alter_column is fine.
    # However, to be safe and avoid "relation does not exist" type race conditions in some DBs (though Postgres is DDL transactional),
    # we'll just apply the alter if we added it, or if it exists.
    
    # Using a simpler approach: Just try to drop the default if the column exists.
    # But `inspector.get_columns` data is from start of transaction.
    # So we rely on the fact that if we added it, it's there.
    
    # We only want to remove default if we added it or if it had it. 
    # Let's simple create them. The previous migration handled the default drop.
    # If we just created it with default 'false', we should drop that default to match model.
    if 'is_premium' not in columns: 
        # We just added it with default 'false'
        op.alter_column('users', 'is_premium', server_default=None)
        
    if 'balance' not in columns:
        # We just added it with default '0'
        op.alter_column('users', 'balance', server_default=None)

def downgrade() -> None:
    # Downgrade is dangerous for a repair script as it might remove columns 
    # that existed before if logic was different. 
    # We will skip dropping columns here to prevent accidental data loss.
    pass
