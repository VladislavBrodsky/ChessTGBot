"""add durable Stripe webhook and invoice idempotency

Revision ID: a4e9d8c7b6f5
Revises: f1a4b7c9d2e8
Create Date: 2026-07-21
"""

from alembic import op
import sqlalchemy as sa


revision = "a4e9d8c7b6f5"
down_revision = "f1a4b7c9d2e8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "stripe_webhook_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.String(length=255), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("object_id", sa.String(length=255), nullable=True),
        sa.Column("received_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id"),
    )
    op.create_index("ix_stripe_webhook_events_object_id", "stripe_webhook_events", ["object_id"])
    op.create_index("ix_stripe_webhook_events_event_id", "stripe_webhook_events", ["event_id"])
    op.create_index(
        "uq_transactions_stripe_subscription_invoice",
        "transactions",
        ["reference_id"],
        unique=True,
        postgresql_where=sa.text("type = 'stripe_subscription_payment' AND reference_id IS NOT NULL"),
        sqlite_where=sa.text("type = 'stripe_subscription_payment' AND reference_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_transactions_stripe_subscription_invoice", table_name="transactions")
    op.drop_index("ix_stripe_webhook_events_event_id", table_name="stripe_webhook_events")
    op.drop_index("ix_stripe_webhook_events_object_id", table_name="stripe_webhook_events")
    op.drop_table("stripe_webhook_events")
