#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${SIGNALLEDGER_ENV_FILE:-$ROOT_DIR/.env.production}"
DEFAULT_ENV_FILE="$ROOT_DIR/.env.production.example"

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$DEFAULT_ENV_FILE" ]]; then
    echo "Missing production env file: $ENV_FILE" >&2
    echo "Start from $DEFAULT_ENV_FILE and populate production secrets before deploying." >&2
  else
    echo "Missing production env file: $ENV_FILE" >&2
  fi
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${SIGNALLEDGER_SITE_ADDR:-}" ]]; then
  echo "SIGNALLEDGER_SITE_ADDR is required in $ENV_FILE" >&2
  exit 1
fi

if [[ -z "${CADDY_EMAIL:-}" ]]; then
  echo "CADDY_EMAIL is required in $ENV_FILE for public TLS issuance" >&2
  exit 1
fi

if command -v ss >/dev/null 2>&1; then
  if ss -ltn '( sport = :80 or sport = :443 )' 2>/dev/null | tail -n +2 | grep -q .; then
    echo "Port 80 or 443 is already in use on the host." >&2
    echo "Stop the existing service before deploying SignalLedger, or move the public ports in $ENV_FILE." >&2
    ss -ltn '( sport = :80 or sport = :443 )' 2>/dev/null | tail -n +2 >&2 || true
    exit 1
  fi
fi

if [[ -n "${PUBLIC_IP:-}" && "${SIGNALLEDGER_SITE_ADDR}" != :* ]]; then
  resolved_ip="$(getent ahostsv4 "${PUBLIC_HOST:-$SIGNALLEDGER_SITE_ADDR}" | awk 'NR==1 { print $1 }' || true)"
  if [[ -n "$resolved_ip" && "$resolved_ip" != "$PUBLIC_IP" ]]; then
    echo "Warning: ${PUBLIC_HOST:-$SIGNALLEDGER_SITE_ADDR} resolves to $resolved_ip, expected $PUBLIC_IP" >&2
  fi
fi

cd "$ROOT_DIR"

docker compose --env-file "$ENV_FILE" config >/dev/null
docker compose --env-file "$ENV_FILE" up -d --build --remove-orphans
