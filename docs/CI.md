# CI

SignalLedger uses repository-level CI gates to protect the validation steps that were previously run manually before merge.

## What CI checks

The main workflow runs on pull requests to `main` and pushes to `main`:

- installs dependencies with `pnpm install --frozen-lockfile`
- checks formatting with `pnpm format` and fails if the formatter changes tracked files
- runs `pnpm lint`
- runs `pnpm typecheck`
- runs `pnpm test`
- runs `pnpm build`
- validates `docker compose config`

A separate smoke workflow checks lightweight repository hygiene and deployment configuration:

- `.env.example` exists
- `.env.production.example` exists
- no plain `.env` file is committed
- no obvious private key files are committed
- the rendered Compose file keeps the web front door on `127.0.0.1:18080`
- PostgreSQL, NATS, and MinIO are only published on `127.0.0.1`

## Why these gates exist

SignalLedger handles tenant-scoped evidence, audit logs, verification state, and public deployment boundaries. A change that breaks formatting, types, tests, build output, or Compose validity can silently weaken operational trust if it reaches `main`.

These gates make the repository harder to break accidentally and easier to review with confidence.

## Run locally

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
docker compose config
```

If you want the same smoke checks used in CI, run:

```bash
test -f .env.example
test -f .env.production.example
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo ".env is committed"
  exit 1
fi
matches="$(git ls-files | rg '(^|/)(id_rsa|id_dsa|id_ecdsa|id_ed25519|.*\.pem|.*\.key)$' || true)"
if [ -n "$matches" ]; then
  printf '%s\n' "$matches"
  echo "private key material is committed"
  exit 1
fi
docker compose config >/tmp/docker-compose.rendered.yml
rg -n '127\.0\.0\.1:18080:80' /tmp/docker-compose.rendered.yml
rg -n '127\.0\.0\.1:5435:5432' /tmp/docker-compose.rendered.yml
rg -n '127\.0\.0\.1:4222:4222' /tmp/docker-compose.rendered.yml
rg -n '127\.0\.0\.1:8222:8222' /tmp/docker-compose.rendered.yml
rg -n '127\.0\.0\.1:9000:9000' /tmp/docker-compose.rendered.yml
rg -n '127\.0\.0\.1:9001:9001' /tmp/docker-compose.rendered.yml
```

## When a gate fails

- Read the workflow log and identify the first failing command.
- Re-run the same command locally from the repository root.
- Fix the underlying issue, not the gate.
- If formatting changes, re-run the formatter and commit the resulting diff.
- If Compose changes, re-run `docker compose config` and the smoke checks before merging.

## Merge discipline

- Do not merge a pull request until the CI workflow is green.
- Treat any formatting, type, test, build, or Compose failure as a release-quality signal, not a nuisance.
- Keep changes small enough that CI failures can be traced to a single commit or narrow review set.
