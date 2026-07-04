import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { config } from "@signalledger/config";
import { registerRoutes } from "./routes.js";
import { closePool } from "./db.js";

async function main(): Promise<void> {
  const app = Fastify({
    logger: true,
    bodyLimit: 1_000_000,
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: [config.WEB_ORIGIN],
    credentials: true,
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ error }, "request failed");
    if (reply.sent) return;
    reply.status(500).send({ error: "internal_error" });
  });

  await registerRoutes(app);

  const port = config.API_PORT;
  const host = "0.0.0.0";
  await app.listen({ port, host });

  const shutdown = async () => {
    await app.close();
    await closePool();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
