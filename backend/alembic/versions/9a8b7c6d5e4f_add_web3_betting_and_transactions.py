"""add web3 betting and transactions

Revision ID: 9a8b7c6d5e4f
Revises: d1a2b3c4d5e6
Create Date: 2026-05-19 00:03:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '9a8b7c6d5e4f'
down_revision: Union[str, None] = 'd1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create transactions table
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('fee', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.String(), nullable=False, server_default='completed'),
        sa.Column('reference_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.telegram_id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_id'), 'transactions', ['id'], unique=False)
    op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'], unique=False)

    # 2. Add wager columns to game_history
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('game_history')]

    if 'bid_amount' not in columns:
        op.add_column('game_history', sa.Column('bid_amount', sa.Integer(), nullable=True, server_default='0'))
    if 'platform_rake' not in columns:
        op.add_column('game_history', sa.Column('platform_rake', sa.Integer(), nullable=True, server_default='0'))
    if 'payout_amount' not in columns:
        op.add_column('game_history', sa.Column('payout_amount', sa.Integer(), nullable=True, server_default='0'))

    # Clean up server defaults on postgres
    op.alter_column('game_history', 'bid_amount', server_default=None)
    op.alter_column('game_history', 'platform_rake', server_default=None)
    op.alter_column('game_history', 'payout_amount', server_default=None)

def downgrade() -> None:
    # 1. Drop columns from game_history
    op.drop_column('game_history', 'payout_amount')
    op.drop_column('game_history', 'platform_rake')
    op.drop_column('game_history', 'bid_amount')

    # 2. Drop transactions table
    op.drop_index(op.f('ix_transactions_user_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_id'), table_name='transactions')
    op.drop_table('transactions')
