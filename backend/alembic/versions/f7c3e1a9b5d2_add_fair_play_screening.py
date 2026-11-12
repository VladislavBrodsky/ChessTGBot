"""Fair-play screening: per-game engine analyses and player reviews."""
from alembic import op
import sqlalchemy as sa

revision = "f7c3e1a9b5d2"
down_revision = "e2b9c651a403"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("fair_play_analyses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("game_id", sa.String(), nullable=False),
        sa.Column("player_id", sa.BigInteger(), nullable=False),
        sa.Column("color", sa.String(1), nullable=False),
        sa.Column("moves_analyzed", sa.Integer(), nullable=False),
        sa.Column("engine_matches", sa.Integer(), nullable=False),
        sa.Column("avg_centipawn_loss", sa.Float(), nullable=True),
        sa.Column("flagged", sa.Boolean(), nullable=False),
        sa.Column("engine_depth", sa.Integer(), nullable=False),
        sa.Column("analyzed_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("game_id", "player_id", name="uq_fair_play_game_player"))
    op.create_index("ix_fair_play_analyses_game_id", "fair_play_analyses", ["game_id"])
    op.create_index("ix_fair_play_analyses_player_id", "fair_play_analyses", ["player_id"])
    op.create_table("fair_play_reviews",
        sa.Column("player_id", sa.BigInteger(), primary_key=True),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("first_game_id", sa.String(), nullable=False),
        sa.Column("flagged_games", sa.Integer(), nullable=False),
        sa.Column("opened_at", sa.DateTime(), nullable=False),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
        sa.Column("resolved_by", sa.BigInteger(), nullable=True))


def downgrade():
    op.drop_table("fair_play_reviews")
    op.drop_index("ix_fair_play_analyses_player_id", table_name="fair_play_analyses")
    op.drop_index("ix_fair_play_analyses_game_id", table_name="fair_play_analyses")
    op.drop_table("fair_play_analyses")
