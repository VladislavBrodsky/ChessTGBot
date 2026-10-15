"""Persistent friend requests and launch recovery across bot/menu entry."""
from alembic import op
import sqlalchemy as sa

revision = "e2b9c651a403"
down_revision = "d9a421e6b507"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("friend_invites",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("host_id", sa.BigInteger(), nullable=False),
        sa.Column("guest_id", sa.BigInteger(), nullable=False),
        sa.Column("pending_pair", sa.String(48), nullable=True, unique=True),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("game_id", sa.String(32), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False))
    for name in ("host_id", "guest_id", "expires_at", "created_at"):
        op.create_index(f"ix_friend_invites_{name}", "friend_invites", [name])
    op.create_table("player_launch_intents",
        sa.Column("user_id", sa.BigInteger(), primary_key=True),
        sa.Column("parameter", sa.String(64), nullable=False),
        sa.Column("version", sa.BigInteger(), nullable=False),
        sa.Column("dismissed", sa.String(1), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False))


def downgrade():
    op.drop_table("player_launch_intents")
    op.drop_table("friend_invites")
