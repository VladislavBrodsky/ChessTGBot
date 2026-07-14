"""add cross-chain deposit orders

Revision ID: c4d9a5e7b2f1
Revises: 7d2c8a4e91f0
Create Date: 2026-07-13
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4d9a5e7b2f1"
down_revision: Union[str, Sequence[str], None] = "7d2c8a4e91f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "cross_chain_deposits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("provider_order_id", sa.String(length=128), nullable=False),
        sa.Column("rate_id", sa.String(length=256), nullable=False),
        sa.Column("source_currency", sa.String(length=32), nullable=False),
        sa.Column("source_amount", sa.String(length=80), nullable=False),
        sa.Column("expected_usdt", sa.String(length=80), nullable=False),
        sa.Column("network_fee_usdt", sa.String(length=80), nullable=False),
        sa.Column("payin_address", sa.String(length=512), nullable=False),
        sa.Column("payin_extra_id", sa.String(length=256), nullable=True),
        sa.Column("refund_address", sa.String(length=512), nullable=False),
        sa.Column("status", sa.String(length=64), nullable=False),
        sa.Column("payout_hash", sa.String(length=256), nullable=True),
        sa.Column("pay_till", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.telegram_id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider", "provider_order_id", name="uq_cross_chain_provider_order"),
    )
    op.create_index(op.f("ix_cross_chain_deposits_id"), "cross_chain_deposits", ["id"], unique=False)
    op.create_index(op.f("ix_cross_chain_deposits_user_id"), "cross_chain_deposits", ["user_id"], unique=False)
    op.create_index(op.f("ix_cross_chain_deposits_provider_order_id"), "cross_chain_deposits", ["provider_order_id"], unique=False)
    op.create_index(op.f("ix_cross_chain_deposits_status"), "cross_chain_deposits", ["status"], unique=False)
    op.create_index(op.f("ix_cross_chain_deposits_payout_hash"), "cross_chain_deposits", ["payout_hash"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_cross_chain_deposits_payout_hash"), table_name="cross_chain_deposits")
    op.drop_index(op.f("ix_cross_chain_deposits_status"), table_name="cross_chain_deposits")
    op.drop_index(op.f("ix_cross_chain_deposits_provider_order_id"), table_name="cross_chain_deposits")
    op.drop_index(op.f("ix_cross_chain_deposits_user_id"), table_name="cross_chain_deposits")
    op.drop_index(op.f("ix_cross_chain_deposits_id"), table_name="cross_chain_deposits")
    op.drop_table("cross_chain_deposits")
