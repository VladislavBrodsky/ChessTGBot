"""add manual withdrawal review audit columns

Revision ID: f1a4b7c9d2e8
Revises: e4a7b9c2d3f6
Create Date: 2026-07-21
"""

from alembic import op
import sqlalchemy as sa


revision = "f1a4b7c9d2e8"
down_revision = "e4a7b9c2d3f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("transactions", sa.Column("approved_by_admin_id", sa.BigInteger(), nullable=True))
    op.add_column("transactions", sa.Column("approved_at", sa.DateTime(), nullable=True))
    op.add_column("transactions", sa.Column("rejected_by_admin_id", sa.BigInteger(), nullable=True))
    op.add_column("transactions", sa.Column("rejected_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("transactions", "rejected_at")
    op.drop_column("transactions", "rejected_by_admin_id")
    op.drop_column("transactions", "approved_at")
    op.drop_column("transactions", "approved_by_admin_id")
