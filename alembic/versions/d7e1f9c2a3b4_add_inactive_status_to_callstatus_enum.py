"""add inactive status to callstatus enum

Revision ID: d7e1f9c2a3b4
Revises: c289ada03dee
Create Date: 2026-02-05 09:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd7e1f9c2a3b4'
down_revision: Union[str, Sequence[str], None] = 'c289ada03dee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add INACTIVE to the callstatus enum
    op.execute("ALTER TYPE callstatus ADD VALUE 'INACTIVE'")


def downgrade() -> None:
    """Downgrade schema."""
    # PostgreSQL doesn't support removing enum values directly
    # This is a limitation of PostgreSQL - enum values can't be removed
    pass
