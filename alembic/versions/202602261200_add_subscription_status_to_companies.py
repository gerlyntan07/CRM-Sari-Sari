"""add subscription active status to companies

Revision ID: 202602261200_add_subscription_status_to_companies
Revises: 202602231530_add_company_slug
Create Date: 2026-02-26 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '202602261200'
down_revision = '202602231530'
branch_labels = None
depends_on = None

def upgrade():
    # Add is_subscription_active column to companies table
    op.add_column('companies', sa.Column('is_subscription_active', sa.Boolean(), nullable=False, server_default='true'))

def downgrade():
    # Remove is_subscription_active column from companies table
    op.drop_column('companies', 'is_subscription_active')