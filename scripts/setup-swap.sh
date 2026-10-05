#!/usr/bin/env bash
set -e

echo "🔧 Checking SWAP configuration on host..."
CURRENT_SWAP=$(swapon --show | wc -l)

if [ "$CURRENT_SWAP" -le 1 ]; then
  echo "📦 No active swap found. Creating 4GB swapfile on SSD..."
  sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  
  if ! grep -q "/swapfile" /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  fi
  
  sudo sysctl vm.swappiness=10
  if ! grep -q "vm.swappiness" /etc/sysctl.conf; then
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
  fi

  echo "✅ 4GB SWAP enabled successfully! Your 1GB t3.micro now has 5GB total virtual memory."
else
  echo "ℹ️ SWAP is already configured and active."
fi

free -h
