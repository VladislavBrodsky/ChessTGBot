"""Add CHECK constraint to prevent negative balance

Revision ID: b2c3d4e5f6a1
Revises: 1085dc47335d
Create Date: 2026-06-24 02:40:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a1'
down_revision: Union[str, None] = '1085dc47335d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First, fix any existing negative balances (set to 0) to avoid constraint violation
    op.execute("UPDATE users SET balance = 0 WHERE balance < 0")
    
    # Add CHECK constraint to enforce balance >= 0 at the database level
    # Use batch_alter_table to support SQLite constraints alteration
    with op.batch_alter_table('users') as batch_op:
        batch_op.create_check_constraint(
            'ck_users_balance_non_negative',
            'balance >= 0'
        )


def downgrade() -> None:
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_constraint('ck_users_balance_non_negative', type_='check')
