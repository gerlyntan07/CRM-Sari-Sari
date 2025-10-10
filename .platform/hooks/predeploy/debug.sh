#!/bin/bash

echo "========== Predeploy Hook Starting =========="
echo "Current user: $(whoami)"
echo "PATH: $PATH"

# Print Python version
python3 --version || { echo "Python3 not found"; exit 1; }

cd backend || { echo "Cannot cd into backend"; exit 1; }

echo "Listing backend directory:"
ls -la

echo "========== Predeploy Hook Finished =========="
