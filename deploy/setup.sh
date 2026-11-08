#!/usr/bin/env bash
# One-time setup, run ON the exe.dev VM from the cloned repo:
#   git clone https://github.com/janderland/wishbanana.git ~/wishbanana
#   ~/wishbanana/deploy/setup.sh
set -euo pipefail
cd "$HOME/wishbanana"

if [ "$(command -v docker)" != "/usr/bin/docker" ]; then
  echo "expected docker at /usr/bin/docker (found: $(command -v docker || echo none))" >&2
  echo "update ExecStart paths in deploy/wishbanana.service" >&2
  exit 1
fi

sudo docker build -t wishbanana:latest server/

sudo cp deploy/wishbanana.service /etc/systemd/system/wishbanana.service
sudo systemctl daemon-reload
sudo systemctl enable --now wishbanana.service
sudo systemctl status wishbanana.service --no-pager
