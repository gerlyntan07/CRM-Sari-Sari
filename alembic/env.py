import sys
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Add backend folder to sys.path so Alembic can find database.py and models
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "backend"))

# Import Base and DATABASE_URL from your app
from database import Base, DATABASE_URL
# Import your models so Alembic sees them
import models.account
import models.auditlog
import models.auth
import models.call
import models.company
import models.contact
import models.deal
import models.lead
import models.meeting
import models.quote
import models.subscription
import models.target
import models.task
import models.territory
import models.comment

# Alembic config
config = context.config
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata for autogenerate
target_metadata = Base.metadata

def run_migrations_offline():
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"}
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,              # Detect column type changes
            compare_server_default=True     # Detect default value changes
        )

        # ✅ Keep the transaction inside the connection context
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()