"""add_profile_columns_force

Revision ID: c5e4d3a2b1f0
Revises: b7a1c4d5e6f8
Create Date: 2026-01-26 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c5e4d3a2b1f0'
down_revision: Union[str, None] = 'b7a1c4d5e6f8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('users')]

    if 'last_name' not in columns:
        op.add_column('users', sa.Column('last_name', sa.String(), nullable=True))
    
    if 'username' not in columns:
        op.add_column('users', sa.Column('username', sa.String(), nullable=True))
        
    if 'photo_url' not in columns:
        op.add_column('users', sa.Column('photo_url', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('users', 'photo_url')
    op.drop_column('users', 'username')
    op.drop_column('users', 'last_name')
