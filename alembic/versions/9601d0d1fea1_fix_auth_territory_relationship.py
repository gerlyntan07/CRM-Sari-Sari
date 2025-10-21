"""fix auth-territory relationship

Revision ID: 9601d0d1fea1
Revises: e32d85236f1c
Create Date: 2025-10-21 10:55:14.280600

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9601d0d1fea1'
down_revision: Union[str, Sequence[str], None] = 'e32d85236f1c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade():
    # Add unique constraint to user_id
    op.create_unique_constraint(
        constraint_name="uq_territories_user_id",
        table_name="territories",
        columns=["user_id"]
    )

def downgrade():
    # Remove it if you downgrade
    op.drop_constraint(
        constraint_name="uq_territories_user_id",
        table_name="territories",
        type_="unique"
    )

