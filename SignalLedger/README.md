# SignalLedger

SignalLedger is a sovereign, append-only NDIS reporting and signalling platform.

It records service delivery events as tamper-evident, tenant-scoped evidence records, then publishes them reliably through an internal outbox and NATS JetStream. The goal is durable local governance infrastructure, not a notification app.

## What this repo contains

- `apps/api`: Fastify API for auth, signal writes, timelines, evidence, and admin endpoints
- `apps/web`: React + Vite frontend
- `apps/worker`: outbox publisher and workflow consumer
- `packages/config`: validated runtime configuration
- `packages/db`: SQL migrations, seed data, and database helpers
- `packages/signal-schema`: signal envelopes and validation
- `packages/shared`: shared hash-chain and JSON canonicalization utilities
- `packages/auth`: role and permission helpers
- `packages/evidence`: local S3/MinIO evidence helpers

## First milestone

The first working milestone is:

1. `docker compose up`
2. Demo user logs in
3. User creates a signal
4. Event is hash-chained and stored append-only
5. Outbox row is created in the same transaction
6. Worker publishes the outbox row
7. Timeline shows the event
8. Evidence pack stub can be generated

## Local development

Install dependencies:

```bash
pnpm install
```

Start services:

```bash
docker compose up --build
```

Run migrations and seed:

```bash
pnpm db:migrate
pnpm db:seed
```

Start the apps without Docker:

```bash
pnpm dev
```

## Demo credentials

Development only:

- Email: `demo.admin@signalledger.local`
- Password: `DemoPassword123!`

## Environment variables

See [`.env.example`](./.env.example).

For the public deployment target, use [`.env.production.example`](./.env.production.example) as the VPS template.

`signalledger.frankai.online` should resolve to `76.13.180.125`.

Public access is served through Caddy on `http://signalledger.frankai.online` and `https://signalledger.frankai.online`.

On this VPS, the host-level Caddy service terminates TLS and reverse-proxies `signalledger.frankai.online` to the SignalLedger web container on `127.0.0.1:18080`.

The production web image builds the React app at image build time and serves the static bundle through Caddy, while `/api` is reverse-proxied to the API service.

Deploy to the VPS with:

```bash
bash scripts/deploy.sh
```

If TLS still fails in the browser, verify that no other process on the VPS already owns ports `80` and `443`, and that the firewall allows inbound TCP on both ports.

To push future changes with the GitHub deploy key, store the private key at `~/.ssh/signalledger_github_deploy_key` and run:

```bash
bash scripts/push-with-deploy-key.sh
```

## Notes

- Signal events are append-only.
- Corrections are modeled as new events.
- Tenant isolation is enforced at the query layer.
- Evidence binaries are stored outside signal records.
- NATS subjects do not contain personal data.

## Known limitations

- Early web UI is intentionally minimal.
- PDF evidence pack generation is stubbed in the first milestone.
- External regulatory submission is not automated.
