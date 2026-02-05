"""add inactive status to meetingstatus enum

Revision ID: e8f5a7b2c1d3
Revises: d7e1f9c2a3b4
Create Date: 2026-02-05 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e8f5a7b2c1d3'
down_revision: Union[str, Sequence[str], None] = 'd7e1f9c2a3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add INACTIVE to the meetingstatus enum
    op.execute("ALTER TYPE meetingstatus ADD VALUE 'INACTIVE'")


def downgrade() -> None:
    """Downgrade schema."""
    # PostgreSQL doesn't support removing enum values directly
    # This is a limitation of PostgreSQL - enum values can't be removed
    pass
