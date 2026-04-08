"""add target role to announcements

Revision ID: 202604081530
Revises: 202604081255
Create Date: 2026-04-08 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '202604081530'
down_revision: Union[str, Sequence[str], None] = '202604081255'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('announcements', sa.Column('target_role', sa.String(length=50), nullable=False, server_default='ALL'))
    op.create_index(op.f('ix_announcements_target_role'), 'announcements', ['target_role'], unique=False)
    op.alter_column('announcements', 'target_role', server_default=None)


def downgrade() -> None:
    op.drop_index(op.f('ix_announcements_target_role'), table_name='announcements')
    op.drop_column('announcements', 'target_role')
