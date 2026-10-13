"""Add native GRAM reward credits, notification outbox and balance-sharing consent.

Revision ID: c84f21b7a903
Revises: b7e2f4a8c1d9
"""
from alembic import op
import sqlalchemy as sa

revision = "c84f21b7a903"
down_revision = "b7e2f4a8c1d9"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("gram_leaderboard_visible", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.create_table(
        "gram_rewards",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("source_key", sa.String(255), nullable=False, unique=True),
        sa.Column("source_kind", sa.String(32), nullable=False),
        sa.Column("amount_nano", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("notification_text", sa.Text(), nullable=False),
        sa.Column("notification_status", sa.String(24), nullable=False, server_default="pending"),
        sa.Column("notification_attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("notification_lease_until", sa.DateTime(), nullable=True),
        sa.Column("notification_message_id", sa.BigInteger(), nullable=True),
        sa.CheckConstraint("amount_nano >= 100000000 AND amount_nano <= 1000000000", name="ck_gram_reward_amount"),
    )
    op.create_index("ix_gram_rewards_user_id", "gram_rewards", ["user_id"])
    op.create_index("ix_gram_rewards_notification_status", "gram_rewards", ["notification_status"])


def downgrade():
    op.drop_table("gram_rewards")
    op.drop_column("users", "gram_leaderboard_visible")
