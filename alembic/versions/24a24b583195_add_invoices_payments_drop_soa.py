"""add_invoices_payments_drop_soa

Revision ID: 24a24b583195
Revises: f8e122184a29
Create Date: 2026-02-28 13:15:34.862776

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '24a24b583195'
down_revision: Union[str, Sequence[str], None] = 'f8e122184a29'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop old SOA tables (SOA is now a generated report)
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    table_names = set(inspector.get_table_names())

    if "soa_items" in table_names:
        existing_indexes = {ix["name"] for ix in inspector.get_indexes("soa_items")}
        if "ix_soa_items_soa_id" in existing_indexes:
            op.drop_index("ix_soa_items_soa_id", table_name="soa_items")
        op.drop_table("soa_items")

    if "statements_of_account" in table_names:
        existing_indexes = {ix["name"] for ix in inspector.get_indexes("statements_of_account")}
        if "ix_statements_of_account_soa_id" in existing_indexes:
            op.drop_index("ix_statements_of_account_soa_id", table_name="statements_of_account")
        op.drop_table("statements_of_account")

    # Create invoices
    op.create_table(
        "invoices",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("invoice_id", sa.String(length=30), nullable=True),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quote_id", sa.Integer(), sa.ForeignKey("quotes.id", ondelete="SET NULL"), nullable=True),
        sa.Column("purchase_order_number", sa.String(length=100), nullable=True),
        sa.Column("invoice_date", sa.Date(), nullable=False, server_default=sa.func.current_date()),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("terms_of_payment", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'Draft'")),
        sa.Column("subtotal", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("tax_rate", sa.Numeric(5, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("tax_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default=sa.text("'PHP'")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("assigned_to", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("invoice_id", name="uq_invoices_invoice_id"),
    )
    op.create_index("ix_invoices_invoice_id", "invoices", ["invoice_id"], unique=False)
    op.create_index("ix_invoices_account_id", "invoices", ["account_id"], unique=False)

    op.create_table(
        "invoice_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("invoice_id", sa.Integer(), sa.ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False),
        sa.Column("item_type", sa.String(length=20), nullable=False, server_default=sa.text("'Product'")),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sku", sa.String(length=50), nullable=True),
        sa.Column("variant", sa.String(length=100), nullable=True),
        sa.Column("unit", sa.String(length=50), nullable=True),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False, server_default=sa.text("1")),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("discount_percent", sa.Numeric(5, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("discount_amount", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("line_total", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_invoice_items_invoice_id", "invoice_items", ["invoice_id"], unique=False)

    # Create payments
    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("account_id", sa.Integer(), sa.ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("invoice_id", sa.Integer(), sa.ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True),
        sa.Column("payment_date", sa.Date(), nullable=False, server_default=sa.func.current_date()),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default=sa.text("'PHP'")),
        sa.Column("reference_number", sa.String(length=100), nullable=True),
        sa.Column("method", sa.String(length=50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_payments_account_id", "payments", ["account_id"], unique=False)
    op.create_index("ix_payments_invoice_id", "payments", ["invoice_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop new tables
    op.drop_index("ix_payments_invoice_id", table_name="payments")
    op.drop_index("ix_payments_account_id", table_name="payments")
    op.drop_table("payments")

    op.drop_index("ix_invoice_items_invoice_id", table_name="invoice_items")
    op.drop_table("invoice_items")

    op.drop_index("ix_invoices_account_id", table_name="invoices")
    op.drop_index("ix_invoices_invoice_id", table_name="invoices")
    op.drop_table("invoices")

    # Recreate old SOA tables
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
