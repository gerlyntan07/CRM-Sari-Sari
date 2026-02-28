"""add_statement_of_account

Revision ID: f8e122184a29
Revises: d79865e3213d
Create Date: 2026-02-28 12:22:38.265800

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f8e122184a29'
down_revision: Union[str, Sequence[str], None] = 'd79865e3213d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "statements_of_account",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("soa_id", sa.String(length=24), nullable=True),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("purchase_order_number", sa.String(length=100), nullable=True),
        sa.Column("quote_number", sa.String(length=50), nullable=True),
        sa.Column("soa_date", sa.Date(), nullable=True),
        sa.Column("terms_of_payment", sa.String(length=100), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("full_payment", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'Draft'")),
        sa.Column("presented_date", sa.Date(), nullable=True),
        sa.Column("paid_date", sa.Date(), nullable=True),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=True, server_default=sa.text("0")),
        sa.Column("tax_rate", sa.Numeric(5, 2), nullable=True, server_default=sa.text("0")),
        sa.Column("tax_amount", sa.Numeric(12, 2), nullable=True, server_default=sa.text("0")),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default=sa.text("'PHP'")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("prepared_by", sa.String(length=100), nullable=True),
        sa.Column("approved_by", sa.String(length=100), nullable=True),
        sa.Column("received_by", sa.String(length=100), nullable=True),
        sa.Column("assigned_to", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("soa_id", name="uq_statements_of_account_soa_id"),
    )

    op.create_index(
        "ix_statements_of_account_soa_id",
        "statements_of_account",
        ["soa_id"],
        unique=False,
    )

    op.create_table(
        "soa_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "soa_id",
            sa.Integer(),
            sa.ForeignKey("statements_of_account.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("item_type", sa.String(length=20), nullable=False, server_default=sa.text("'Product'")),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sku", sa.String(length=50), nullable=True),
        sa.Column("variant", sa.String(length=100), nullable=True),
        sa.Column("unit", sa.String(length=50), nullable=True),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False, server_default=sa.text("1")),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("discount_percent", sa.Numeric(5, 2), nullable=True, server_default=sa.text("0")),
        sa.Column("discount_amount", sa.Numeric(12, 2), nullable=True, server_default=sa.text("0")),
        sa.Column("line_total", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("sort_order", sa.Integer(), nullable=True, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_index("ix_soa_items_soa_id", "soa_items", ["soa_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_soa_items_soa_id", table_name="soa_items")
    op.drop_table("soa_items")

    op.drop_index("ix_statements_of_account_soa_id", table_name="statements_of_account")
    op.drop_table("statements_of_account")
