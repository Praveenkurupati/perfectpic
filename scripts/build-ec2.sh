#!/usr/bin/env bash
set -e

echo "=============================================="
echo "🏗️ PerfectPic EC2 Optimized Local Builder"
echo "=============================================="

# 1. Verify swap is configured (needed for 1GB RAM instances)
SWAP_TOTAL=$(free -m | awk '/Swap:/ {print $2}' || echo "0")
if [ -n "$SWAP_TOTAL" ] && [ "$SWAP_TOTAL" -lt 2000 ]; then
  echo "⚠️ Swap memory is less than 2000 MB ($SWAP_TOTAL MB)."
  echo "Running setup-swap.sh to allocate 4GB swap..."
  sudo ./scripts/setup-swap.sh
fi

# 2. Ensure environment files exist and sanitize any malformed quotes
for ENV_FILE in .env apps/backend/.env; do
  if [ -f "$ENV_FILE" ]; then
    node -e "
      const fs = require('fs');
      const file = '$ENV_FILE';
      let c = fs.readFileSync(file, 'utf8');
      c = c.replace(/SMTP_FROM=\"([^\"]+)\"\s*<([^>]+)>/g, 'SMTP_FROM=\"\$1 <\$2>\"');
      fs.writeFileSync(file, c);
    " 2>/dev/null || true
  fi
done

if [ ! -f .env ]; then
  if [ -f apps/backend/.env ]; then
    echo "📋 Copying apps/backend/.env to root .env for Docker Compose..."
    cp apps/backend/.env .env
  else
    touch .env
  fi
fi

# 3. Build services sequentially to avoid CPU/memory contention on t3.micro
echo "🔨 1/3: Building Backend (TypeScript API & Worker)..."
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ec2.yml build backend worker

echo "🔨 2/3: Building Admin (Next.js Dashboard)..."
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ec2.yml build admin

echo "🔨 3/3: Building Client (Next.js Storefront)..."
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ec2.yml build client

# 4. Start all services together
echo "⚡ Starting all services in background..."
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ec2.yml up -d

# 5. Prune old layers to keep EBS disk clean
echo "🧹 Pruning unused images to conserve disk space..."
sudo docker image prune -f

echo "=============================================="
echo "✅ Local EC2 build complete! Service status:"
echo "=============================================="
sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.ec2.yml ps
