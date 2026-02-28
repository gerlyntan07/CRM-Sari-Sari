"""merge_multiple_heads

Revision ID: bda51aa1c962
Revises: 202602261200, 202602280800
Create Date: 2026-02-28 11:56:40.225835

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bda51aa1c962'
down_revision: Union[str, Sequence[str], None] = ('202602261200', '202602280800')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
