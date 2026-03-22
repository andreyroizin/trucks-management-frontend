#!/bin/bash
set -e

REPO_DIR="/var/www/frontend"
LOCK_FILE="/tmp/deploy-frontend.lock"
LOG_FILE="/var/log/auto-deploy-frontend.log"

# Prevent concurrent deployments
if [ -f "$LOCK_FILE" ]; then
    echo "$(date): Deployment already in progress, skipping" >> "$LOG_FILE"
    exit 0
fi

touch "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

cd "$REPO_DIR"

# Fetch latest from GitHub
git fetch origin main --quiet

# Check if we're behind
LOCAL=$(git rev-parse main)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
    echo "$(date): New commits detected, triggering deployment" >> "$LOG_FILE"
    /usr/local/bin/deploy-frontend >> "$LOG_FILE" 2>&1
    echo "$(date): Deployment completed" >> "$LOG_FILE"
else
    echo "$(date): No new commits" >> "$LOG_FILE"
fi
