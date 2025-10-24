"""fix territory-user relationship

Revision ID: 441547b61ab5
Revises: 3038ca532498
Create Date: 2025-10-21 11:40:41.418693

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '441547b61ab5'
down_revision: Union[str, Sequence[str], None] = '3038ca532498'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
