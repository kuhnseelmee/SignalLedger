import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_NAME: z.string().min(1).default("SignalLedger"),
  API_PORT: z.coerce.number().int().positive().default(4315),
  WEB_PORT: z.coerce.number().int().positive().default(4316),
  DATABASE_URL: z
    .string()
    .url()
    .or(z.string().startsWith("postgres://"))
    .or(z.string().startsWith("postgresql://")),
  NATS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().min(1).default("evidence"),
  SIGNALLEDGER_OUTBOX_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(2000),
  WEB_ORIGIN: z.string().min(1).default("http://localhost:4316"),
  API_ORIGIN: z.string().min(1).default("http://localhost:4315"),
  POSTGRES_DB: z.string().min(1).default("signalledger"),
  POSTGRES_USER: z.string().min(1).default("signalledger"),
  POSTGRES_PASSWORD: z.string().min(1).default("signalledger"),
});

export type SignalLedgerEnv = z.infer<typeof envSchema>;

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
): SignalLedgerEnv {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}

export const config = loadConfig();
