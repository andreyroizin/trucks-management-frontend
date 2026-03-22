#!/bin/bash
set -e

echo "🔄 Frontend deployment triggered at $(date)"

cd /var/www/frontend

# Fix git permissions first
echo "🔧 Fixing permissions..."
sudo chown -R ubuntu:ubuntu .

# Pull latest changes from main
echo "📦 Pulling latest code from GitHub..."
git fetch origin

# Stash any local changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "💾 Stashing local changes..."
  git stash
fi

git checkout main
git pull origin main

# Install dependencies
echo "📥 Installing dependencies..."
npm ci --production=false

# Build the application
echo "🔨 Building Next.js app..."
NEXT_PUBLIC_API_BASE_URL="https://api.vervoermanager.nl" npm run build

# Zero-downtime reload with PM2
echo "🚀 Reloading with PM2 (zero downtime)..."
pm2 reload trucks-frontend || pm2 start npm --name "trucks-frontend" -- start

# Wait for app to start
echo "⏳ Waiting for frontend to be ready..."
sleep 10

# Health check
for i in {1..10}; do
  if timeout 3 curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is responding"
    if pm2 list | grep -q "trucks-frontend.*online"; then
      echo "✅ PM2 status: online"
      echo "✅ Deployment successful at $(date)!"
      exit 0
    fi
  fi
  echo "⏳ Waiting... attempt $i/10"
  sleep 3
done

echo "❌ Health check failed"
echo "📋 PM2 logs:"
pm2 logs trucks-frontend --lines 30 --nostream
exit 1
