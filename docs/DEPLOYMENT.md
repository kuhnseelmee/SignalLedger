# Deployment

SignalLedger is designed for local or private-VPS deployment using Docker Compose.

Deployment boundaries:

- PostgreSQL persists structured data
- NATS JetStream persists event subjects
- MinIO stores evidence files
- API and worker remain internal application services
- Web is built into a static Caddy image
- Caddy terminates TLS, serves the web bundle, and reverse-proxies API traffic

Do not place these services directly on the public internet without additional network controls.

## Public hostname

For the current deployment target:

- Hostname: `signalledger.frankai.online`
- IP: `76.13.180.125`

DNS should point `signalledger.frankai.online` at `76.13.180.125`, and the runtime environment should set:

- `WEB_ORIGIN=https://signalledger.frankai.online`
- `API_ORIGIN=https://signalledger.frankai.online`
- `SIGNALLEDGER_SITE_ADDR=signalledger.frankai.online`
- `CADDY_EMAIL=admin@signalledger.frankai.online`
- `VITE_API_URL=/api`

On this VPS, the host-level Caddy service already owns public `80` and `443`.

SignalLedger runs its web container on alternate local ports, then host Caddy reverse-proxies the public hostname to `127.0.0.1:18080`.

For the reverse-proxy deployment, the app containers run with `NODE_ENV=production` so auth cookies are marked `Secure` over HTTPS.

If you deploy SignalLedger on a standalone VPS without an existing host-level proxy, you can switch `SIGNALLEDGER_SITE_ADDR` back to the public hostname and publish `80` and `443` directly from Compose instead.

## Production bootstrap

Use [`.env.production.example`](../.env.production.example) as the starting point for the VPS environment file. Fill in real secrets before first launch.

Deploy from the repository root with:

```bash
bash scripts/deploy.sh
```

The deploy script validates the compose configuration, then runs `docker compose up -d --build --remove-orphans` with the production environment file.

The host Caddy site block lives in [infra/caddy/signalledger-host.caddy](../infra/caddy/signalledger-host.caddy) and should be added to the machine-level `/etc/caddy/Caddyfile` if you are using host termination for HTTPS.

## TLS notes

- Host Caddy terminates TLS for the public hostname on this VPS.
- HSTS and baseline browser hardening headers are enabled in the public proxy.
- If the browser still reports a TLS alert, confirm that DNS points `signalledger.frankai.online` at `76.13.180.125`, that ports `80` and `443` are open, and that no other process is already bound to those ports.
- If another reverse proxy already owns `443`, do not stack SignalLedger Caddy behind it until the TLS path is intentionally designed and tested.
- If you use a firewall, allow inbound TCP `80` and `443` directly to the VPS for certificate issuance and browser access.
