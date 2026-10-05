#!/usr/bin/env bash
set -e

echo "=============================================="
echo "🚀 PerfectPic Instant EC2 Deployer (GHCR)"
echo "=============================================="

# Optional: Accept GitHub PAT token as first argument
if [ -n "$1" ]; then
  echo "🔑 Authenticating Docker with GHCR using provided token..."
  echo "$1" | sudo docker login ghcr.io -u "Praveenkurupati" --password-stdin
fi

# Also check for GHCR_PAT or CR_PAT in environment or .env file
if [ -z "$1" ] && [ -f .env ]; then
  TOKEN=$(grep -E '^(GHCR_PAT|CR_PAT|GITHUB_TOKEN)=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
  if [ -n "$TOKEN" ]; then
    echo "🔑 Authenticating Docker with GHCR using token from .env..."
    echo "$TOKEN" | sudo docker login ghcr.io -u "Praveenkurupati" --password-stdin
  fi
fi

# 1. Fetch latest compose and configuration files
echo "📥 1/4: Fetching latest configurations from origin/main..."
git fetch origin main
git reset --hard origin/main

# 2. Pull pre-built images from GitHub Container Registry (takes ~15 seconds)
echo "🐳 2/4: Pulling optimized pre-built containers from GHCR..."
set +e
PULL_OUTPUT=$(sudo docker compose -f docker-compose.yml -f docker-compose.prod.yml pull 2>&1)
PULL_EXIT_CODE=$?
echo "$PULL_OUTPUT"
set -e

if [ $PULL_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Error: Docker pull failed with exit code $PULL_EXIT_CODE."
  echo "=========================================================================="
  echo "💡 WHY DID THIS HAPPEN & HOW TO FIX IT:"
  echo "=========================================================================="
  echo "GHCR returned 'denied'. This occurs for two common reasons:"
  echo ""
  echo "OPTION 1 (FASTEST - Make packages Public, 30 seconds):"
  echo "1. Go to: https://github.com/Praveenkurupati?tab=packages"
  echo "2. Click on each package: 'perfectpic-backend', 'perfectpic-admin', 'perfectpic-client'"
  echo "3. Click 'Package settings' (bottom-right of page) -> scroll to 'Danger Zone'"
  echo "4. Click 'Change package visibility' -> Select 'Public' -> Type the package name to confirm"
  echo "5. Re-run: ./scripts/deploy-ec2.sh"
  echo ""
  echo "OPTION 2 (Authenticate Docker on EC2 with a GitHub Personal Access Token):"
  echo "1. Generate a token on GitHub: https://github.com/settings/tokens (classic) with 'read:packages' permission"
  echo "2. Run this command on EC2:"
  echo "   echo '<YOUR_GITHUB_PAT>' | sudo docker login ghcr.io -u Praveenkurupati --password-stdin"
  echo "3. Re-run: ./scripts/deploy-ec2.sh"
  echo ""
  echo "OPTION 3 (Check GitHub Actions build status):"
  echo "Ensure the GitHub Actions build completed successfully:"
  echo "https://github.com/Praveenkurupati/perfectpic/actions"
  echo "=========================================================================="
  exit $PULL_EXIT_CODE
fi

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
