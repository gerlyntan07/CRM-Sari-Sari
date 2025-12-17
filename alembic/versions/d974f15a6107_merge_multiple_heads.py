"""merge multiple heads

Revision ID: d974f15a6107
Revises: 488cc28f0ba9, 96328a139b4b
Create Date: 2025-12-17 10:27:59.334144

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd974f15a6107'
down_revision: Union[str, Sequence[str], None] = ('488cc28f0ba9', '96328a139b4b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
