"""add inactive status to taskstatus enum

Revision ID: a1b2c3d4e5f6
Revises: 9ae0849457b5
Create Date: 2026-02-06 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9ae0849457b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add INACTIVE to the statuscategory enum
    op.execute("ALTER TYPE statuscategory ADD VALUE 'Inactive'")


def downgrade() -> None:
    """Downgrade schema."""
    # PostgreSQL doesn't support removing enum values directly
    # This is a limitation of PostgreSQL - enum values can't be removed
    pass
