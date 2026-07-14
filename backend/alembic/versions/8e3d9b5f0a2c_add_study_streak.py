"""add study streak

Revision ID: 8e3d9b5f0a2c
Revises: 7d2c8a4e91f0
Create Date: 2026-07-14 19:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8e3d9b5f0a2c'
down_revision: Union[str, None] = '7d2c8a4e91f0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use batch_alter_table for SQLite compatibility if ever needed locally
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('study_streak', sa.Integer(), server_default='0', nullable=False))
        batch_op.add_column(sa.Column('last_study_date', sa.DateTime(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('last_study_date')
        batch_op.drop_column('study_streak')
