"""
Revision ID: b2c3d4e5f7a8
Revises: add_work_email_field_contacts
Create Date: 2026-04-06
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f7a8'
down_revision = 'add_work_email_field_contacts'
branch_labels = None
depends_on = None

import random
import string

def generate_random_tenant_number():
    return ''.join(random.choices(string.digits, k=12))

def upgrade():
    # 1. Add as nullable first
    op.add_column('companies', sa.Column('tenant_number', sa.String(length=12), nullable=True))

    # 2. Fill all existing rows with random 12-digit numbers
    conn = op.get_bind()
    companies = conn.execute(sa.text('SELECT id FROM companies')).fetchall()
    used_numbers = set()
    for row in companies:
        tenant_number = generate_random_tenant_number()
        # Ensure uniqueness
        while tenant_number in used_numbers or conn.execute(sa.text('SELECT 1 FROM companies WHERE tenant_number = :tn'), {'tn': tenant_number}).fetchone():
            tenant_number = generate_random_tenant_number()
        used_numbers.add(tenant_number)
        conn.execute(sa.text('UPDATE companies SET tenant_number = :tn WHERE id = :id'), {'tn': tenant_number, 'id': row[0]})

    # 3. Alter column to NOT NULL and unique
    op.alter_column('companies', 'tenant_number', nullable=False)
    op.create_unique_constraint('uq_companies_tenant_number', 'companies', ['tenant_number'])

def downgrade():
    op.drop_constraint('uq_companies_tenant_number', 'companies', type_='unique')
    op.drop_column('companies', 'tenant_number')
