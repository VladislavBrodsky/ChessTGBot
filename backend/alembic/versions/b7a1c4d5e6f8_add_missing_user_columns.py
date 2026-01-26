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
    
    # Update server defaults if needed
    if 'is_premium' in columns:
        op.alter_column('users', 'is_premium', server_default=None)
    if 'balance' in columns:
        op.alter_column('users', 'balance', server_default=None)

def downgrade() -> None:
    op.drop_column('users', 'wallet_address')
    op.drop_column('users', 'balance')
    op.drop_column('users', 'premium_expires_at')
    op.drop_column('users', 'premium_tier')
    op.drop_column('users', 'is_premium')
