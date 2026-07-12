"""add_premium_billing_period

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-12

"""
from typing import Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, None] = None
depends_on: Union[str, None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('premium_billing_period', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'premium_billing_period')
