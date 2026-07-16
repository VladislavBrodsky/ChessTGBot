"""add database guard for on-chain deposit idempotency

Revision ID: 6c4a1e8d9f20
Revises: 552b0682cbbd
Create Date: 2026-07-15
"""

from alembic import op
import sqlalchemy as sa


revision = "6c4a1e8d9f20"
down_revision = "552b0682cbbd"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "uq_transactions_deposit_user_reference",
        "transactions",
        ["user_id", "reference_id"],
        unique=True,
        postgresql_where=sa.text("type = 'deposit' AND reference_id IS NOT NULL"),
        sqlite_where=sa.text("type = 'deposit' AND reference_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_transactions_deposit_user_reference", table_name="transactions")
