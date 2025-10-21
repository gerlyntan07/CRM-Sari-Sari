"""update tables

Revision ID: cd64b1ca9a7f
Revises: 441547b61ab5
Create Date: 2025-10-21 12:01:51.487234

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'cd64b1ca9a7f'
down_revision: Union[str, Sequence[str], None] = '441547b61ab5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass