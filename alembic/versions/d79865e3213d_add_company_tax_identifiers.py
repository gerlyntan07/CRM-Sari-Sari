"""add_company_tax_identifiers

Revision ID: d79865e3213d
Revises: bda51aa1c962
Create Date: 2026-02-28 12:16:32.104934

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd79865e3213d'
down_revision: Union[str, Sequence[str], None] = 'bda51aa1c962'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('companies', sa.Column('vat_registration_number', sa.String(), nullable=True))
    op.add_column('companies', sa.Column('tax_id_number', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('companies', 'tax_id_number')
    op.drop_column('companies', 'vat_registration_number')
