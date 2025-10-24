"""add contact table

Revision ID: 85fed003c1b8
Revises: e9583699c458
Create Date: 2025-10-24 09:22:17.980546

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '85fed003c1b8'
down_revision: Union[str, Sequence[str], None] = 'e9583699c458'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
