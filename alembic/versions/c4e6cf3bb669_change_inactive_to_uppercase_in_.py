"""change_inactive_to_uppercase_in_taskstatus_enum

Revision ID: c4e6cf3bb669
Revises: fed803f85047
Create Date: 2026-02-21 12:46:26.782773

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4e6cf3bb669'
down_revision: Union[str, Sequence[str], None] = 'fed803f85047'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE statuscategory RENAME VALUE 'Inactive' TO 'INACTIVE'")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TYPE statuscategory RENAME VALUE 'INACTIVE' TO 'Inactive'")
