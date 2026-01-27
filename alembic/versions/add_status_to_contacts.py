"""add status to contacts

Revision ID: add_status_to_contacts
Revises: add_period_fields
Create Date: 2026-01-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_status_to_contacts'
down_revision: Union[str, Sequence[str], None] = 'add_period_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add status column to contacts table with default value 'Active'
    op.add_column('contacts', sa.Column('status', sa.String(), server_default='Active', nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove status column from contacts table
    op.drop_column('contacts', 'status')
