"""
Revision ID: add_work_email_field_contacts
Revises: merge_heads_20260314
Create Date: 2026-03-14

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_work_email_field_contacts'
down_revision = 'merge_heads_20260314'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('contacts', sa.Column('work_email', sa.String(length=255), nullable=True))

def downgrade():
    op.drop_column('contacts', 'work_email')
