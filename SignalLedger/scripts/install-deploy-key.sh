#!/usr/bin/env bash
set -euo pipefail

SOURCE_KEY="${1:-}"
TARGET_KEY="${SIGNALLEDGER_GITHUB_KEY:-$HOME/.ssh/signalledger_github_deploy_key}"

if [[ -z "$SOURCE_KEY" ]]; then
  cat >&2 <<EOF
Usage: bash scripts/install-deploy-key.sh /path/to/private_key

Copies an existing GitHub deploy key to the stable local path used by
scripts/push-with-deploy-key.sh.
EOF
  exit 1
fi

if [[ ! -f "$SOURCE_KEY" ]]; then
  echo "Source key not found: $SOURCE_KEY" >&2
  exit 1
fi

mkdir -p "$(dirname "$TARGET_KEY")"
install -m 600 "$SOURCE_KEY" "$TARGET_KEY"

echo "Installed deploy key to $TARGET_KEY"
