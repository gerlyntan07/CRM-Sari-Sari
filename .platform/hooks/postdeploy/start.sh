#!/bin/bash
set -e

echo "=== 🚀 Post-deploy hook running for FastAPI ==="

APP_DIR="/var/app/current"
VENV_DIR="/var/app/venv"

# Step 1: Navigate to app directory
cd "$APP_DIR" || {
  echo "❌ Failed to change directory to $APP_DIR"
  exit 1
}

# Step 2: Activate virtual environment
if source $VENV_DIR/*/bin/activate; then
  echo "✅ Virtual environment activated"
else
  echo "❌ Failed to activate virtual environment"
  exit 1
fi

# ✅ Step 2.5: Safely load Elastic Beanstalk environment variables
echo "🌿 Loading Elastic Beanstalk environment variables..."
/opt/elasticbeanstalk/bin/get-config environment > /tmp/env.json

python3 <<'PYCODE' > /tmp/export_envs.sh
import json
with open('/tmp/env.json') as f:
    data = json.load(f)
for k, v in data.items():
    safe_v = str(v).replace('"', '\\"')
    print(f'export {k}="{safe_v}"')
PYCODE

source /tmp/export_envs.sh
echo "✅ Environment variables loaded successfully."

# Step 3: Wait for database to be reachable
echo "⏳ Checking database connectivity..."
python - <<'EOF'
import os, time
from sqlalchemy import create_engine

url = os.getenv("DATABASE_URL")
if not url:
    print("❌ DATABASE_URL not found in environment variables.")
    exit(1)

for i in range(10):
    try:
        engine = create_engine(url)
        with engine.connect() as conn:
            print("✅ Database connection successful!")
            break
    except Exception as e:
        print(f"⚠️ Database not ready yet ({i+1}/10): {e}")
        time.sleep(3)
else:
    print("❌ Database connection failed after 10 attempts.")
    exit(1)
EOF

# Step 4: Smart Alembic Migration Check
echo "🔍 Checking Alembic migration status..."

CURRENT_REV=$(python -m alembic current --verbose 2>/dev/null | grep "Current revision" | awk '{print $3}' || true)
HEAD_REV=$(python -m alembic heads --verbose 2>/dev/null | grep "Rev:" | awk '{print $2}' || true)

if [[ -z "$HEAD_REV" ]]; then
  echo "⚠️ No Alembic heads found. Skipping migrations."
elif [[ "$CURRENT_REV" == "$HEAD_REV" ]]; then
  echo "✅ Database already up-to-date (revision $CURRENT_REV). Skipping Alembic migration."
else
  echo "🚀 New migrations detected! Upgrading from $CURRENT_REV to $HEAD_REV..."
  if python -m alembic upgrade head; then
    echo "✅ Alembic migrations applied successfully!"
  else
    echo "❌ Alembic migration failed"
    exit 1
  fi
fi

# Step 5: Finish
echo "=== ✅ Post-deploy hook finished successfully ==="
