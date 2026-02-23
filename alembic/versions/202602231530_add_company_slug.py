"""add company slug

Revision ID: 202602231530
Revises: 1d108a861541
Create Date: 2026-02-23 15:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
import re


# revision identifiers, used by Alembic.
revision: str = "202602231530"
down_revision: Union[str, Sequence[str], None] = "1d108a861541"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _slugify(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value[:48]


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("companies", sa.Column("slug", sa.String(), nullable=True))

    # Backfill slug for existing companies (DB-agnostic)
    conn = op.get_bind()
    rows = conn.execute(text("SELECT id, company_name FROM companies"))
    updates = []
    for row in rows:
        company_id = row[0]
        company_name = row[1]
        slug = _slugify(company_name)
        if slug:
            updates.append({"id": company_id, "slug": slug})

    if updates:
        conn.execute(
            text("UPDATE companies SET slug = :slug WHERE id = :id AND (slug IS NULL OR slug = '')"),
            updates,
        )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("companies", "slug")
