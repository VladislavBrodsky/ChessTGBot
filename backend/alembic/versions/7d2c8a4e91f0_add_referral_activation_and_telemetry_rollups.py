"""add referral activation and telemetry rollups

Revision ID: 7d2c8a4e91f0
Revises: 3247f5036e66
Create Date: 2026-07-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7d2c8a4e91f0"
down_revision: Union[str, Sequence[str], None] = "3247f5036e66"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("referrals", sa.Column("activated_at", sa.DateTime(), nullable=True))
    op.create_index(op.f("ix_referrals_activated_at"), "referrals", ["activated_at"], unique=False)

    op.create_table(
        "telemetry_daily_rollups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("rollup_date", sa.Date(), nullable=False),
        sa.Column("event_type", sa.String(), nullable=False),
        sa.Column("event_count", sa.Integer(), nullable=False),
        sa.Column("unique_users", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("rollup_date", "event_type", name="uq_telemetry_rollup_date_event"),
    )
    op.create_index(op.f("ix_telemetry_daily_rollups_event_type"), "telemetry_daily_rollups", ["event_type"], unique=False)
    op.create_index(op.f("ix_telemetry_daily_rollups_id"), "telemetry_daily_rollups", ["id"], unique=False)
    op.create_index(op.f("ix_telemetry_daily_rollups_rollup_date"), "telemetry_daily_rollups", ["rollup_date"], unique=False)

    if op.get_bind().dialect.name == "postgresql":
        op.execute(sa.text("""
            UPDATE referrals AS referral
            SET activated_at = reward.created_at
            FROM users AS referrer, users AS referred, transactions AS reward
            WHERE referral.referrer_id = referrer.id
              AND referral.referred_user_id = referred.id
              AND reward.user_id = referrer.telegram_id
              AND reward.type = 'referral_commission'
              AND reward.status = 'completed'
              AND reward.reference_id = 'ref_signup_bonus_' || referred.telegram_id::text
              AND referral.activated_at IS NULL
        """))


def downgrade() -> None:
    op.drop_index(op.f("ix_telemetry_daily_rollups_rollup_date"), table_name="telemetry_daily_rollups")
    op.drop_index(op.f("ix_telemetry_daily_rollups_id"), table_name="telemetry_daily_rollups")
    op.drop_index(op.f("ix_telemetry_daily_rollups_event_type"), table_name="telemetry_daily_rollups")
    op.drop_table("telemetry_daily_rollups")
    op.drop_index(op.f("ix_referrals_activated_at"), table_name="referrals")
    op.drop_column("referrals", "activated_at")
