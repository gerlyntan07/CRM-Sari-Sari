import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# --- ADDED: This allows Alembic to find your local files ---
sys.path.append(os.getcwd())

# --- CHANGE THIS: Import your specific Base object ---
# If your file is named models.py, change 'database' to 'models'
from database import Base 

# this is the Alembic Config object
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- UPDATED: Link your models to Alembic ---
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    # Get the URL from the config file
    url = config.get_main_option("sqlalchemy.url")
    
    # Handle the hyphen issue for your database name
    if url and "%2D" in url:
        url = url.replace("%2D", "-")

    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        url=url, # Use the fixed URL here
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