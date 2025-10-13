#!/bin/bash

echo "Post-deploy hook running..."

cd /var/app/current || cd /var/app/staging || {
  echo "Failed to change directory to /var/app/current or /var/app/staging"
  exit 1
}

source /var/app/venv/*/bin/activate || {
  echo "Failed to activate virtual environment"
  exit 1
}

# Run any post-deployment commands here (e.g. migrations, setup tasks)
cd backend

# Example: Run Alembic migrations (optional)
# alembic upgrade head

echo "Post-deploy hook finished successfully!"
