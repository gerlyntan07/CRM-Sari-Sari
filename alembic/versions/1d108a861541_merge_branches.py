"""merge_branches

Revision ID: 1d108a861541
Revises: a10121e72835, c4e6cf3bb669
Create Date: 2026-02-23 08:30:38.134551

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1d108a861541'
down_revision: Union[str, Sequence[str], None] = ('a10121e72835', 'c4e6cf3bb669')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
