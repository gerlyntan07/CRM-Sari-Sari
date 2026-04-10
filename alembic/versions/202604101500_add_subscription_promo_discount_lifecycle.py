"""add subscription promo discount lifecycle fields

Revision ID: 202604101500
Revises: 202604101330
Create Date: 2026-04-10 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "202604101500"
down_revision: Union[str, Sequence[str], None] = "202604101330"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "subscriptions",
        sa.Column("promo_discount_is_active", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column("subscriptions", sa.Column("promo_discount_type", sa.String(length=20), nullable=True))
    op.add_column("subscriptions", sa.Column("promo_discount_value", sa.Float(), nullable=True))
    op.add_column("subscriptions", sa.Column("promo_discount_code", sa.String(length=8), nullable=True))
    op.add_column("subscriptions", sa.Column("promo_discount_applied_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("subscriptions", sa.Column("promo_discount_ends_at", sa.DateTime(timezone=True), nullable=True))

    op.alter_column("subscriptions", "promo_discount_is_active", server_default=None)


def downgrade() -> None:
    op.drop_column("subscriptions", "promo_discount_ends_at")
    op.drop_column("subscriptions", "promo_discount_applied_at")
    op.drop_column("subscriptions", "promo_discount_code")
    op.drop_column("subscriptions", "promo_discount_value")
    op.drop_column("subscriptions", "promo_discount_type")
    op.drop_column("subscriptions", "promo_discount_is_active")
