#!/usr/bin/env bash
set -e

echo "=============================================="
echo "🚀 PerfectPic Instant EC2 Deployer (GHCR)"
echo "=============================================="

# 1. Fetch latest compose and configuration files
echo "📥 1/4: Fetching latest configurations from origin/main..."
git fetch origin main
git reset --hard origin/main

# 2. Pull pre-built images from GitHub Container Registry (takes ~15 seconds)
echo "🐳 2/4: Pulling optimized pre-built containers from GHCR..."
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

# 3. Start services without rebuilding
echo "⚡ 3/4: Starting services..."
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans

# 4. Clean up dangling image layers to save disk space
echo "🧹 4/4: Pruning old image layers..."
sudo docker image prune -f

echo "=============================================="
echo "✅ Deployment successful! Service status:"
echo "=============================================="
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
