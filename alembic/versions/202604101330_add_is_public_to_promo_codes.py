"""add is_public to promo codes

Revision ID: 202604101330
Revises: 202604101100
Create Date: 2026-04-10 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "202604101330"
down_revision: Union[str, Sequence[str], None] = "202604101100"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "promo_codes",
        sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.alter_column("promo_codes", "is_public", server_default=None)


def downgrade() -> None:
    op.drop_column("promo_codes", "is_public")
