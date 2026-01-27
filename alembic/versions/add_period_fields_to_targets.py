"""add period fields to targets

Revision ID: add_period_fields
Revises: c4149b220f9f
Create Date: 2026-01-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_period_fields'
down_revision: Union[str, None] = 'fb2c504fe7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns for period tracking
    op.add_column('targets', sa.Column('period_type', sa.String(20), nullable=False, server_default='CUSTOM'))
    op.add_column('targets', sa.Column('period_year', sa.Integer(), nullable=True))
    op.add_column('targets', sa.Column('period_number', sa.Integer(), nullable=True))
    
    # Add indexes for better query performance
    op.create_index('ix_targets_period_type', 'targets', ['period_type'])
    op.create_index('ix_targets_period_year', 'targets', ['period_year'])


def downgrade() -> None:
    op.drop_index('ix_targets_period_year', table_name='targets')
    op.drop_index('ix_targets_period_type', table_name='targets')
    op.drop_column('targets', 'period_number')
    op.drop_column('targets', 'period_year')
    op.drop_column('targets', 'period_type')
