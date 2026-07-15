"""add study streak fields

Revision ID: 068a2009f2ca
Revises: 8e3d9b5f0a2c
Create Date: 2026-07-14 13:00:01.352629

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

revision: str = '068a2009f2ca'
down_revision: Union[str, Sequence[str], None] = '8e3d9b5f0a2c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('study_streak', sa.Integer(), server_default='0', nullable=False))
        batch_op.add_column(sa.Column('last_study_date', sa.Date(), nullable=True))

def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('last_study_date')
        batch_op.drop_column('study_streak')
