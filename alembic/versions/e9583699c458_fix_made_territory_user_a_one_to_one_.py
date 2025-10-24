"""fix made territory-user a one-to-one relationship

Revision ID: e9583699c458
Revises: cd64b1ca9a7f
Create Date: 2025-10-21 15:17:20.820948

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e9583699c458'
down_revision: Union[str, Sequence[str], None] = 'cd64b1ca9a7f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
