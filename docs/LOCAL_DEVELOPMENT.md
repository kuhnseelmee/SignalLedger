# Local Development

Prerequisites:

- Docker
- Docker Compose
- pnpm

Setup:

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
docker compose up --build
```

Developer login:

- Email: `demo.admin@signalledger.local`
- Password: `DemoPassword123!`
