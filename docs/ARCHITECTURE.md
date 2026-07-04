# Architecture

SignalLedger is a TypeScript monorepo with a thin web frontend, a Fastify API, and a background worker.

Core principles:

- Append-only signal events
- Tenant-scoped data access
- Hash-chained events per tenant
- Outbox publication to NATS JetStream
- Local evidence storage in MinIO/S3-compatible object storage

## Data flow

1. A user authenticates against the API.
2. The API validates signal input and computes the next tenant hash.
3. The event and outbox record are inserted in the same transaction.
4. The worker publishes outbox rows to NATS JetStream.
5. The worker also consumes event subjects and creates workflow tasks.
6. The web app reads timelines and tasks through the API.
