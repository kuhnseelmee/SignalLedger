# Security

Baseline security controls:

- JWT cookie auth
- Argon-compatible password hashing through bcryptjs in this first pass
- CORS restricted to the configured web origin
- auth rate limiting
- request size limits
- tenant membership checks before data access
- append-only signal events
- audit logging for important actions

Production notes:

- Change all default secrets before any non-local deployment.
- Do not expose NATS publicly.
- Treat MinIO credentials as change-required.
- The public proxy sends HSTS and browser hardening headers for HTTPS traffic.
- Keep `signalledger.frankai.online` pointed at `76.13.180.125` while the VPS is serving production traffic.
