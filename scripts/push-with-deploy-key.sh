#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEY_PATH="${SIGNALLEDGER_GITHUB_KEY:-$HOME/.ssh/signalledger_github_deploy_key}"
BRANCH="${1:-$(git -C "$ROOT_DIR" branch --show-current)}"

if [[ -z "$BRANCH" ]]; then
  echo "Unable to determine the current branch. Pass the branch name as the first argument." >&2
  exit 1
fi

if [[ ! -f "$KEY_PATH" ]]; then
  cat >&2 <<EOF
Missing GitHub deploy key: $KEY_PATH

Store the private deploy key there or set SIGNALLEDGER_GITHUB_KEY to a different path.
EOF
  exit 1
fi

cd "$ROOT_DIR"

GIT_SSH_COMMAND="ssh -i $KEY_PATH -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" \
  git push -u origin "$BRANCH"
