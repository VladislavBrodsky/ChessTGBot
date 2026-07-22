"""add durable money-operation idempotency claims

Revision ID: b7e2f4a8c1d9
Revises: a4e9d8c7b6f5
Create Date: 2026-07-22
"""

from alembic import op
import sqlalchemy as sa


revision = "b7e2f4a8c1d9"
down_revision = "a4e9d8c7b6f5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "money_operation_claims",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("operation_type", sa.String(length=100), nullable=False),
        sa.Column("reference_id", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "operation_type",
            "reference_id",
            name="uq_money_operation_claim_type_reference",
        ),
    )


def downgrade() -> None:
    op.drop_table("money_operation_claims")
