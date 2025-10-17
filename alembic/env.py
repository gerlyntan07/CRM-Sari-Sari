import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Add backend folder to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend"))

# Load your database & models
from backend.database import Base, DATABASE_URL
# import your models here (add more as you create them)
import backend.models.auth
import backend.models.company
import backend.models.auditlog
import backend.models.territory
import backend.models.subscription

# Alembic Config object
config = context.config

# Instead of hardcoding DB URL, load from our app
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# Interpret config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add your metadata here for 'autogenerate'
target_metadata = Base.metadata

def run_migrations_offline():
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
