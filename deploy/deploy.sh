#!/usr/bin/env bash
# Deploy the latest main to the exe.dev VM. Run from your machine:
#   deploy/deploy.sh [vm-name]
# Restarting ends any games in progress.
set -e
VM="${1:-janderland}"

ssh "$VM.exe.xyz" bash -s <<'REMOTE'
set -e
cd ~/wishbanana
git pull --ff-only
sudo docker build -t wishbanana:latest -f deploy/Dockerfile .
sudo cp deploy/wishbanana.service /etc/systemd/system/wishbanana.service
sudo systemctl daemon-reload
sudo systemctl enable wishbanana.service
sudo systemctl restart wishbanana.service
sudo docker image prune -f
sleep 3
systemctl is-active wishbanana.service
REMOTE
