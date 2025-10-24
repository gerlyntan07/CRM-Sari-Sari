"""add created_at column in territory table

Revision ID: 3038ca532498
Revises: 9601d0d1fea1
Create Date: 2025-10-21 11:18:31.625883

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3038ca532498'
down_revision: Union[str, Sequence[str], None] = '9601d0d1fea1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    op.add_column('territories', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()))
    op.add_column('territories', sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()))


def downgrade():
    op.drop_column('territories', 'updated_at')
    op.drop_column('territories', 'created_at')
