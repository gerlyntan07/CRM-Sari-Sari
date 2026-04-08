"""add announcements table

Revision ID: 202604081230
Revises: merge_heads_20260314
Create Date: 2026-04-08 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '202604081230'
down_revision: Union[str, Sequence[str], None] = 'merge_heads_20260314'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'announcements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('message', sa.String(length=300), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('updated_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index(op.f('ix_announcements_id'), 'announcements', ['id'], unique=False)
    op.create_index(op.f('ix_announcements_is_active'), 'announcements', ['is_active'], unique=False)
    op.create_index(op.f('ix_announcements_starts_at'), 'announcements', ['starts_at'], unique=False)
    op.create_index(op.f('ix_announcements_ends_at'), 'announcements', ['ends_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_announcements_ends_at'), table_name='announcements')
    op.drop_index(op.f('ix_announcements_starts_at'), table_name='announcements')
    op.drop_index(op.f('ix_announcements_is_active'), table_name='announcements')
    op.drop_index(op.f('ix_announcements_id'), table_name='announcements')
    op.drop_table('announcements')
