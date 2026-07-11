"""add sybil signup tracking columns to users

Adds users.signup_ip_hash (hashed IP the account was created from) and
users.created_at. Both nullable — accounts predating this migration have
neither. Used to refuse same-device referral attribution and to alert on
one IP minting many accounts.

Revision ID: a7f2e9c31b04
Revises: 1cf73f5ba3a0
Create Date: 2026-07-11

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7f2e9c31b04'
down_revision: Union[str, Sequence[str], None] = '1cf73f5ba3a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = {c["name"] for c in inspector.get_columns("users")}

    if "signup_ip_hash" not in columns:
        op.add_column("users", sa.Column("signup_ip_hash", sa.String(), nullable=True))
        op.create_index("ix_users_signup_ip_hash", "users", ["signup_ip_hash"])
    if "created_at" not in columns:
        op.add_column("users", sa.Column("created_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = {c["name"] for c in inspector.get_columns("users")}

    if "signup_ip_hash" in columns:
        op.drop_index("ix_users_signup_ip_hash", table_name="users")
        op.drop_column("users", "signup_ip_hash")
    if "created_at" in columns:
        op.drop_column("users", "created_at")
