"""
Add backup_reminder field to companies table
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'backup_reminder_add_20260314'
down_revision = '202602231530'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('companies', sa.Column('backup_reminder', sa.String(), nullable=True))

def downgrade():
    op.drop_column('companies', 'backup_reminder')
