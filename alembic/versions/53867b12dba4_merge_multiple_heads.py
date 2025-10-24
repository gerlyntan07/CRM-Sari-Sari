"""merge multiple heads

Revision ID: 53867b12dba4
Revises: 85c2cfdea774, d13cc054d065
Create Date: 2025-10-24 11:13:25.588466

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '53867b12dba4'
down_revision: Union[str, Sequence[str], None] = ('85c2cfdea774', 'd13cc054d065')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
