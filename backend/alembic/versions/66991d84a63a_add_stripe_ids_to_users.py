"""Add stripe IDs to users

Revision ID: 66991d84a63a
Revises: a7f2e9c31b04
Create Date: 2026-07-12 00:26:27.755529

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '66991d84a63a'
down_revision: Union[str, Sequence[str], None] = 'a7f2e9c31b04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use batch_alter_table for SQLite compatibility when possible, though add_column is generally safe
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('stripe_customer_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('stripe_subscription_id', sa.String(), nullable=True))
        batch_op.create_index(batch_op.f('ix_users_stripe_customer_id'), ['stripe_customer_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_users_stripe_subscription_id'), ['stripe_subscription_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_stripe_subscription_id'))
        batch_op.drop_index(batch_op.f('ix_users_stripe_customer_id'))
        batch_op.drop_column('stripe_subscription_id')
        batch_op.drop_column('stripe_customer_id')
