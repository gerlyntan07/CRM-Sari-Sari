"""modify foreign keys

Revision ID: c2da84b824ec
Revises: e4e35f105eac
Create Date: 2025-10-14 16:29:37.526651

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c2da84b824ec'
down_revision: Union[str, Sequence[str], None] = 'e4e35f105eac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Drop wrong foreign key
    op.drop_constraint('subscriptions_company_id_fkey', 'subscriptions', type_='foreignkey')

    # Add correct foreign key pointing to companies.id
    op.create_foreign_key(
        'subscriptions_company_id_fkey',
        'subscriptions', 'companies',
        ['company_id'], ['id'],
        ondelete='CASCADE'
    )

def downgrade():
    # Reverse: drop FK pointing to companies
    op.drop_constraint('subscriptions_company_id_fkey', 'subscriptions', type_='foreignkey')
