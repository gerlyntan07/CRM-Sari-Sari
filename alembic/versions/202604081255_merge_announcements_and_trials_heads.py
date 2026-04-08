"""merge announcements and trials heads

Revision ID: 202604081255
Revises: 202604081230, 5106360dd473
Create Date: 2026-04-08 12:55:00.000000

"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = '202604081255'
down_revision: Union[str, Sequence[str], None] = ('202604081230', '5106360dd473')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
