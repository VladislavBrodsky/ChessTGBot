"""Add accepted-play activity, launch attribution and durable delivery/scoring receipts."""
from alembic import op
import sqlalchemy as sa

revision = "d9a421e6b507"
down_revision = "c84f21b7a903"
branch_labels = None
depends_on = None


def upgrade():
    op.create_index("ix_game_history_type_ended_at", "game_history", ["game_type", "ended_at"])
    op.create_table("player_activity",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("day", sa.Date(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("day", "user_id", name="uq_player_activity_day_user"))
    op.create_index("ix_player_activity_day", "player_activity", ["day"])
    op.create_index("ix_player_activity_user_id", "player_activity", ["user_id"])
    op.create_table("launch_tokens",
        sa.Column("token", sa.String(48), primary_key=True),
        sa.Column("destination", sa.String(16), nullable=False),
        sa.Column("game_id", sa.String(128), nullable=True),
        sa.Column("campaign", sa.String(64), nullable=False),
        sa.Column("inviter_id", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False))
    op.create_index("ix_launch_tokens_game_id", "launch_tokens", ["game_id"])
    op.create_index("ix_launch_tokens_expires_at", "launch_tokens", ["expires_at"])
    op.create_table("player_acquisition",
        sa.Column("user_id", sa.BigInteger(), primary_key=True),
        sa.Column("campaign", sa.String(64), nullable=False),
        sa.Column("inviter_id", sa.BigInteger(), nullable=True),
        sa.Column("token", sa.String(48), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_player_acquisition_campaign", "player_acquisition", ["campaign"])
    op.create_table("arena_game_results",
        sa.Column("game_id", sa.String(128), primary_key=True),
        sa.Column("arena_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_arena_game_results_arena_id", "arena_game_results", ["arena_id"])
    op.create_table("campaign_deliveries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("campaign", sa.String(96), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.UniqueConstraint("campaign", "user_id", name="uq_campaign_delivery_user"))


def downgrade():
    op.drop_index("ix_game_history_type_ended_at", table_name="game_history")
    for table in ("campaign_deliveries", "arena_game_results", "player_acquisition", "launch_tokens", "player_activity"):
        op.drop_table(table)
