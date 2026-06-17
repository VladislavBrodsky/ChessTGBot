"""add missing user columns

Revision ID: b7a1c4d5e6f8
Revises: f103b3a5e790
Create Date: 2026-01-26 04:56:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'b7a1c4d5e6f8'
down_revision: Union[str, None] = 'f103b3a5e790'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('users')]

    # Add subscription columns
    if 'is_premium' not in columns:
        op.add_column('users', sa.Column('is_premium', sa.Boolean(), nullable=True, server_default='false'))
    if 'premium_tier' not in columns:
        op.add_column('users', sa.Column('premium_tier', sa.String(), nullable=True))
    if 'premium_expires_at' not in columns:
        op.add_column('users', sa.Column('premium_expires_at', sa.DateTime(), nullable=True))
    
    # Add balance and wallet columns
    if 'balance' not in columns:
        op.add_column('users', sa.Column('balance', sa.Integer(), nullable=True, server_default='0'))
    if 'wallet_address' not in columns:
        op.add_column('users', sa.Column('wallet_address', sa.String(), nullable=True))
    
    # Update server defaults if needed using batch_alter_table for SQLite compatibility
    with op.batch_alter_table('users') as batch_op:
        if 'is_premium' in columns:
            batch_op.alter_column('is_premium', server_default=None)
        if 'balance' in columns:
            batch_op.alter_column('balance', server_default=None)

def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('wallet_address')
        batch_op.drop_column('balance')
        batch_op.drop_column('premium_expires_at')
        batch_op.drop_column('premium_tier')
        batch_op.drop_column('is_premium')
