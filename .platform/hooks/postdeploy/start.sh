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

cd backend

# Start FastAPI (use your actual main app entry)
echo "Starting FastAPI with Uvicorn..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
echo "Post-deploy hook finished!"
