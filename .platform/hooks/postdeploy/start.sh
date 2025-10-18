#!/bin/bash

echo "=== Post-deploy hook running ==="

# Move to the app directory (Elastic Beanstalk uses /var/app/current for the deployed code)
cd /var/app/current || {
  echo "❌ Failed to change directory to /var/app/current"
  exit 1
}

# Activate virtual environment
if source /var/app/venv/*/bin/activate; then
  echo "✅ Virtual environment activated"
else
  echo "❌ Failed to activate virtual environment"
  exit 1
fi

# Run database migrations safely
echo "🚀 Running Alembic migrations..."
cd /var/app/current

# Check current Alembic revision (for logging)
python -m alembic current

# Apply the latest Alembic migrations
python -m alembic upgrade head || {
  echo "❌ Alembic migration failed"
  exit 1
}

# Optionally collect static files for Django if applicable
# echo "Collecting Django static files..."
# python backend/manage.py collectstatic --noinput

# Restart the application server (Gunicorn should be managed by EB, so just log info)
echo "✅ Alembic migrations complete!"
echo "=== Post-deploy hook finished successfully ==="
