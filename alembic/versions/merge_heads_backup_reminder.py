"""
Merge heads: a18fbda5d2de and backup_reminder_add_20260314
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'merge_heads_20260314'
down_revision = ('a18fbda5d2de', 'backup_reminder_add_20260314')
branch_labels = None
depends_on = None

def upgrade():
    pass

def downgrade():
    pass
