"""merge heads

Revision ID: 3247f5036e66
Revises: a1f7c39b52d0, b2c3d4e5f6a7
Create Date: 2026-07-12 15:04:15.320435

"""
from typing import Sequence, Union



# revision identifiers, used by Alembic.
revision: str = '3247f5036e66'
down_revision: Union[str, Sequence[str], None] = ('a1f7c39b52d0', 'b2c3d4e5f6a7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
