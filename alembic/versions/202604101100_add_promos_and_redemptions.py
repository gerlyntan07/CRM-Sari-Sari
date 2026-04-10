"""add promos and redemptions tables

Revision ID: 202604101100
Revises: 202604081530
Create Date: 2026-04-10 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "202604101100"
down_revision: Union[str, Sequence[str], None] = "202604081530"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "promo_codes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=8), nullable=False),
        sa.Column("manual_code", sa.String(length=8), nullable=False),
        sa.Column("code_length", sa.Integer(), nullable=False, server_default="8"),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("purpose", sa.String(length=50), nullable=False, server_default="CUSTOM"),
        sa.Column("target_scope", sa.String(length=20), nullable=False, server_default="company"),
        sa.Column("extend_days", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("discount_percent", sa.Float(), nullable=True),
        sa.Column("discount_amount", sa.Float(), nullable=True),
        sa.Column("max_total_redemptions", sa.Integer(), nullable=True),
        sa.Column("max_redemptions_per_company", sa.Integer(), nullable=True, server_default="1"),
        sa.Column("max_redemptions_per_user", sa.Integer(), nullable=True, server_default="1"),
        sa.Column("total_redemptions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("qr_code_url", sa.String(), nullable=True),
        sa.Column("extra_data", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_promo_codes_code"), "promo_codes", ["code"], unique=True)
    op.create_index(op.f("ix_promo_codes_id"), "promo_codes", ["id"], unique=False)

    op.create_table(
        "promo_redemptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("promo_id", sa.Integer(), nullable=False),
        sa.Column("promo_code_snapshot", sa.String(length=8), nullable=False),
        sa.Column("redeemed_by_user_id", sa.Integer(), nullable=True),
        sa.Column("redeemed_for_company_id", sa.Integer(), nullable=True),
        sa.Column("redemption_channel", sa.String(length=30), nullable=False, server_default="account"),
        sa.Column("applied_effect", sa.String(length=255), nullable=True),
        sa.Column("discount_applied", sa.Float(), nullable=True),
        sa.Column("days_extended", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["promo_id"], ["promo_codes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["redeemed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["redeemed_for_company_id"], ["companies.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_promo_redemptions_id"), "promo_redemptions", ["id"], unique=False)
    op.create_index(op.f("ix_promo_redemptions_promo_id"), "promo_redemptions", ["promo_id"], unique=False)
    op.create_index(op.f("ix_promo_redemptions_redeemed_by_user_id"), "promo_redemptions", ["redeemed_by_user_id"], unique=False)
    op.create_index(op.f("ix_promo_redemptions_redeemed_for_company_id"), "promo_redemptions", ["redeemed_for_company_id"], unique=False)

    op.alter_column("promo_codes", "code_length", server_default=None)
    op.alter_column("promo_codes", "purpose", server_default=None)
    op.alter_column("promo_codes", "target_scope", server_default=None)
    op.alter_column("promo_codes", "extend_days", server_default=None)
    op.alter_column("promo_codes", "max_redemptions_per_company", server_default=None)
    op.alter_column("promo_codes", "max_redemptions_per_user", server_default=None)
    op.alter_column("promo_codes", "total_redemptions", server_default=None)
    op.alter_column("promo_codes", "is_active", server_default=None)
    op.alter_column("promo_redemptions", "redemption_channel", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_promo_redemptions_redeemed_for_company_id"), table_name="promo_redemptions")
    op.drop_index(op.f("ix_promo_redemptions_redeemed_by_user_id"), table_name="promo_redemptions")
    op.drop_index(op.f("ix_promo_redemptions_promo_id"), table_name="promo_redemptions")
    op.drop_index(op.f("ix_promo_redemptions_id"), table_name="promo_redemptions")
    op.drop_table("promo_redemptions")

    op.drop_index(op.f("ix_promo_codes_id"), table_name="promo_codes")
    op.drop_index(op.f("ix_promo_codes_code"), table_name="promo_codes")
    op.drop_table("promo_codes")
