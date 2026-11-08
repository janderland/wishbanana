#!/usr/bin/env bash
# Deploy the latest main to the exe.dev VM. Run from your machine:
#   deploy/deploy.sh [vm-name]
# Restarting ends any games in progress.
set -euo pipefail
VM="${1:-wishbanana}"

ssh "$VM.exe.xyz" bash -s <<'REMOTE'
set -euo pipefail
cd ~/wishbanana
git pull --ff-only
sudo docker build -t wishbanana:latest server/
sudo cp deploy/wishbanana.service /etc/systemd/system/wishbanana.service
sudo systemctl daemon-reload
sudo systemctl restart wishbanana.service
sudo docker image prune -f
sleep 3
systemctl is-active wishbanana.service
REMOTE
