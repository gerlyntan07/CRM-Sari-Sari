"""re_add_inactive_status_to_taskstatus_enum

Revision ID: fed803f85047
Revises: 1de2ad0a96f1
Create Date: 2026-02-21 11:55:12.899543

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fed803f85047'
down_revision: Union[str, Sequence[str], None] = '1de2ad0a96f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add INACTIVE to the statuscategory enum
    op.execute("ALTER TYPE statuscategory ADD VALUE IF NOT EXISTS 'Inactive'")


def downgrade() -> None:
    """Downgrade schema."""
    # PostgreSQL doesn't support removing enum values directly
    # This is a limitation of PostgreSQL - enum values can't be removed
    pass
