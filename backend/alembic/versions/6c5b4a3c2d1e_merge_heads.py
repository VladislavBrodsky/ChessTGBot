"""merge heads

Revision ID: 6c5b4a3c2d1e
Revises: 6c4a1e8d9f20, d7e30c4f8d22
Create Date: 2026-07-16 20:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c5b4a3c2d1e'
down_revision: Union[str, Sequence[str], None] = ('6c4a1e8d9f20', 'd7e30c4f8d22')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
