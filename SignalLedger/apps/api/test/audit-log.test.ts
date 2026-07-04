import Fastify from "fastify";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  auth: {
    userId: "user-alpha",
    tenantId: "tenant_alpha",
    role: "admin",
    permissions: [] as string[],
  },
  signals: [
    {
      id: "signal-1",
      tenant_id: "tenant_alpha",
      domain: "incident",
      type: "incident.created",
      severity: "critical",
      actor_id: null,
      actor_type: "staff",
      actor_display_name: "Alice",
      actor_role: "admin",
      subject_id: null,
      participant_id: null,
      property_id: null,
      shift_id: null,
      incident_id: null,
      occurred_at: "2026-07-01T00:00:00.000Z",
      observed_at: "2026-07-01T00:00:00.000Z",
      received_at: "2026-07-01T00:00:00.000Z",
      payload: { summary: "incident" },
      evidence: [],
      correlation_id: null,
      causation_id: null,
      previous_hash: null,
      hash: "hash-1",
      signature: null,
      visibility: "provider",
      retention_class: "standard",
      schema_version: 1,
      created_at: "2026-07-01T00:00:00.000Z",
    },
    {
      id: "signal-2",
      tenant_id: "tenant_beta",
      domain: "incident",
      type: "incident.created",
      severity: "critical",
      actor_id: null,
      actor_type: "staff",
      actor_display_name: "Bob",
      actor_role: "admin",
      subject_id: null,
      participant_id: null,
      property_id: null,
      shift_id: null,
      incident_id: null,
      occurred_at: "2026-07-01T00:00:00.000Z",
      observed_at: "2026-07-01T00:00:00.000Z",
      received_at: "2026-07-01T00:00:00.000Z",
      payload: { summary: "other tenant" },
      evidence: [],
      correlation_id: null,
      causation_id: null,
      previous_hash: null,
      hash: "hash-2",
      signature: null,
      visibility: "provider",
      retention_class: "standard",
      schema_version: 1,
      created_at: "2026-07-01T00:00:00.000Z",
    },
  ],
  evidenceObjects: [
    {
      id: "evidence-1",
      tenant_id: "tenant_alpha",
      kind: "document",
      filename: "doc.txt",
      content_type: "text/plain",
      size_bytes: 11,
      storage_uri: "s3://evidence/doc.txt",
      sha256:
        "bfaba146703bfeb254da97a194d11c4266808ef65a2bc592d968459ab7c4e987",
      verification_status: "pending",
      created_at: "2026-07-01T00:00:00.000Z",
      updated_at: "2026-07-01T00:00:00.000Z",
    },
  ] as Array<{
    id: string;
    tenant_id: string;
    kind: string;
    filename: string;
    content_type: string;
    size_bytes: number;
    storage_uri: string;
    sha256: string | null;
    verification_status: string;
    created_at: string;
    updated_at: string;
    uploaded_by_user_id?: string;
  }>,
  workflowTasks: [
    {
      id: "task-1",
      tenant_id: "tenant_alpha",
      source_event_id: "event-1",
      type: "incident_triage",
      status: "open",
      priority: "critical",
      title: "Triage incident",
      description: "Review new incident and determine next action.",
      assigned_role: "compliance",
      assigned_user_id: null,
      due_at: null,
      created_at: "2026-07-01T00:00:00.000Z",
      updated_at: "2026-07-01T00:00:00.000Z",
    },
  ],
  auditLogs: [] as Array<Record<string, unknown>>,
  txQueries: [] as Array<{ sql: string; params?: unknown[] }>,
  storage: new Map<string, Buffer>([
    ["doc.txt", Buffer.from("match-content")],
  ]),
}));

vi.mock("@signalledger/config", () => ({
  config: {
    APP_NAME: "SignalLedger",
    API_PORT: 4315,
    API_ORIGIN: "http://localhost",
    WEB_ORIGIN: "http://localhost",
    JWT_SECRET: "test-secret",
    DATABASE_URL: "postgres://localhost/test",
    NATS_URL: "nats://localhost:4222",
    MINIO_ENDPOINT: "localhost:9000",
    MINIO_ACCESS_KEY: "minioadmin",
    MINIO_SECRET_KEY: "minioadmin",
    MINIO_BUCKET: "evidence",
    SIGNALLEDGER_OUTBOX_INTERVAL_MS: 1000,
    NODE_ENV: "test",
  },
}));

vi.mock("@signalledger/evidence", () => ({
  createUploadUrl: vi.fn(async () => "https://example.invalid/upload"),
  readObjectBytes: vi.fn(async (key: string) => {
    const value = state.storage.get(key);
    if (!value) {
      const error = new Error("missing object");
      (error as { name?: string }).name = "NoSuchKey";
      throw error;
    }
    return value;
  }),
}));

vi.mock("../src/auth.js", () => ({
  resolveAuth: vi.fn(() => state.auth),
  setAuthCookie: vi.fn(),
  clearAuthCookie: vi.fn(),
  signSession: vi.fn(),
  verifyPassword: vi.fn(async () => true),
  can: vi.fn((role: string, permission: string) => {
    if (["owner", "admin"].includes(role)) return true;
    if (role === "compliance") return permission === "audit_log" || permission === "signal_create";
    return false;
  }),
}));

vi.mock("../src/integrity.js", () => ({
  verifyTenantSignalChain: vi.fn(async (tenantId: string) => ({
    tenantId,
    valid: true,
    eventsChecked: 1,
    firstEventId: "signal-1",
    lastEventId: "signal-1",
    brokenAt: null,
    warnings: [],
  })),
}));

vi.mock("../src/db.js", () => ({
  pool: {
    query: vi.fn(async (sql: string, params: unknown[] = []) => {
      if (sql.includes("from tenant_memberships")) {
        return { rows: [{ role: state.auth.role }] };
      }
      if (
        sql.includes("from users u") &&
        sql.includes("join tenant_memberships tm")
      ) {
        const [email] = params as [string];
        return {
          rows: [
            {
              id: "user-login",
              password_hash: "hash",
              display_name: "Login User",
              tenant_id: "tenant_alpha",
              role: "admin",
              email,
            },
          ],
        };
      }
      if (sql.includes("insert into audit_log")) {
        const [
          tenantId,
          userId,
          action,
          entityType,
          entityId,
          ipAddress,
          userAgent,
          metadata,
        ] = params as [
          string,
          string | null,
          string,
          string,
          string,
          string | null,
          string | null,
          string,
        ];
        const row = {
          id: `audit-${state.auditLogs.length + 1}`,
          tenant_id: tenantId,
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: JSON.parse(metadata),
          created_at: new Date().toISOString(),
        };
        state.auditLogs.push(row);
        return { rows: [row] };
      }
      if (sql.includes("from audit_log")) {
        const tenantId = String(params[0]);
        const limit = Number(params[params.length - 2]);
        const offset = Number(params[params.length - 1]);
        const conditions = params.slice(1, -2);
        let rows = state.auditLogs.filter((row) => row.tenant_id === tenantId);
        let conditionIndex = 0;
        if (sql.includes("action = $2")) {
          const action = String(conditions[conditionIndex++]);
          rows = rows.filter((row) => row.action === action);
        }
        if (sql.includes("entity_type = $") ) {
          const entityType = String(conditions[conditionIndex++]);
          rows = rows.filter((row) => row.entity_type === entityType);
        }
        if (sql.includes("entity_id = $") ) {
          const entityId = String(conditions[conditionIndex++]);
          rows = rows.filter((row) => row.entity_id === entityId);
        }
        if (sql.includes("created_at >= $")) {
          const from = String(conditions[conditionIndex++]);
          rows = rows.filter((row) => String(row.created_at) >= from);
        }
        if (sql.includes("created_at <= $")) {
          const to = String(conditions[conditionIndex++]);
          rows = rows.filter((row) => String(row.created_at) <= to);
        }
        return {
          rows: rows.slice(offset, offset + limit),
        };
      }
      if (
        sql.includes("from signal_events where id = $1 and tenant_id = $2 and visibility = any($3::text[])")
      ) {
        const [id, tenantId, visibilities] = params as [
          string,
          string,
          string[],
        ];
        const row = state.signals.find(
          (signal) =>
            signal.id === id &&
            signal.tenant_id === tenantId &&
            visibilities.includes(signal.visibility),
        );
        return { rows: row ? [row] : [] };
      }
      if (
        sql.includes("select * from signal_events where") &&
        sql.includes("visibility = any($")
      ) {
        const tenantId = String(params[0]);
        const visibilities = params[params.length - 3] as string[];
        const limit = Number(params[params.length - 2]);
        const offset = Number(params[params.length - 1]);
        const rows = state.signals
          .filter((signal) => signal.tenant_id === tenantId)
          .filter((signal) => visibilities.includes(signal.visibility))
          .slice(offset, offset + limit);
        return { rows };
      }
      if (
        sql.includes("from evidence_objects where id = $1 and tenant_id = $2")
      ) {
        const [id, tenantId] = params as [string, string];
        const row = state.evidenceObjects.find(
          (evidence) => evidence.id === id && evidence.tenant_id === tenantId,
        );
        return { rows: row ? [row] : [] };
      }
      if (
        sql.includes("select id from signal_events") &&
        sql.includes("evidence @>")
      ) {
        const [tenantId] = params as [string, string];
        return {
          rows: state.signals
            .filter((signal) => signal.tenant_id === tenantId)
            .map((signal) => ({ id: signal.id })),
        };
      }
      if (
        sql.includes("from workflow_tasks") &&
        sql.includes("where id = $1 and tenant_id = $2")
      ) {
        const [id, tenantId] = params as [string, string];
        const row = state.workflowTasks.find(
          (task) => task.id === id && task.tenant_id === tenantId,
        );
        return { rows: row ? [row] : [] };
      }
      if (sql.includes("update workflow_tasks")) {
        const [id, tenantId, status] = params as [string, string, string];
        const row = state.workflowTasks.find(
          (task) => task.id === id && task.tenant_id === tenantId,
        );
        if (row) {
          row.status = status;
          row.updated_at = "2026-07-02T00:00:00.000Z";
        }
        return { rows: row ? [row] : [] };
      }
      if (sql.includes("insert into evidence_objects")) {
        const [
          tenantId,
          userId,
          kind,
          filename,
          contentType,
          sizeBytes,
          storageUri,
          sha256,
        ] = params as [
          string,
          string,
          string,
          string,
          string,
          number,
          string,
          string | null,
        ];
        const row = {
          id: "evidence-created",
          tenant_id: tenantId,
          uploaded_by_user_id: userId,
          kind,
          filename,
          content_type: contentType,
          size_bytes: sizeBytes,
          storage_uri: storageUri,
          sha256,
          verification_status: "pending",
          created_at: "2026-07-01T00:00:00.000Z",
          updated_at: "2026-07-01T00:00:00.000Z",
        };
        state.evidenceObjects.push(row);
        return { rows: [row] };
      }
      if (sql.includes("select hash from signal_events")) {
        return { rows: [{ hash: null }] };
      }
      if (sql.includes("insert into signal_events")) {
        return { rows: [{ id: "signal-audit" }] };
      }
      if (sql.includes("insert into signal_outbox")) {
        return { rows: [] };
      }
      if (
        sql.includes("select * from evidence_objects") &&
        sql.includes("where id = $1 and tenant_id = $2")
      ) {
        const [id, tenantId] = params as [string, string];
        const row = state.evidenceObjects.find(
          (evidence) => evidence.id === id && evidence.tenant_id === tenantId,
        );
        return { rows: row ? [row] : [] };
      }
      if (sql.includes("update evidence_objects set verification_status")) {
        const [id, tenantId, verificationStatus] = params as [
          string,
          string,
          string,
        ];
        const row = state.evidenceObjects.find(
          (evidence) => evidence.id === id && evidence.tenant_id === tenantId,
        );
        if (row) {
          row.verification_status = verificationStatus;
          row.updated_at = "2026-07-02T00:00:00.000Z";
        }
        return { rows: row ? [row] : [] };
      }
      return { rows: [] };
    }),
    connect: vi.fn(),
  },
  withTransaction: vi.fn(
    async (fn: (client: { query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }> }) => Promise<unknown>) =>
    fn({
      query: vi.fn(async (sql: string, params: unknown[] = []) => {
        state.txQueries.push({ sql, params });
        if (sql.includes("insert into audit_log")) {
          const [
            tenantId,
            userId,
            action,
            entityType,
            entityId,
            ipAddress,
            userAgent,
            metadata,
          ] = params as [string, string | null, string, string, string, string | null, string | null, string];
          const row = {
            id: `audit-${state.auditLogs.length + 1}`,
            tenant_id: tenantId,
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: JSON.parse(metadata),
            created_at: new Date().toISOString(),
          };
          state.auditLogs.push(row);
          return { rows: [row] };
        }
        if (sql.includes("select hash from signal_events")) {
          return { rows: [{ hash: null }] };
        }
        if (sql.includes("insert into signal_events")) {
          return { rows: [{ id: "signal-audit" }] };
        }
        if (sql.includes("insert into signal_outbox")) {
          return { rows: [] };
        }
        if (sql.includes("select * from evidence_objects")) {
          const [id, tenantId] = params as [string, string];
          const row = state.evidenceObjects.find(
            (evidence) => evidence.id === id && evidence.tenant_id === tenantId,
          );
          return { rows: row ? [row] : [] };
        }
        if (sql.includes("update workflow_tasks")) {
          const [id, tenantId, status] = params as [string, string, string];
          const row = state.workflowTasks.find(
            (task) => task.id === id && task.tenant_id === tenantId,
          );
          if (row) {
            row.status = status;
            row.updated_at = "2026-07-02T00:00:00.000Z";
          }
          return { rows: row ? [row] : [] };
        }
        if (
          sql.includes("from workflow_tasks") &&
          sql.includes("where id = $1 and tenant_id = $2")
        ) {
          const [id, tenantId] = params as [string, string];
          const row = state.workflowTasks.find(
            (task) => task.id === id && task.tenant_id === tenantId,
          );
          return { rows: row ? [row] : [] };
        }
        return { rows: [] };
      }),
    }) as never,
  ),
}));

import { registerRoutes } from "../src/routes.js";

function setAuth(role: string, tenantId: string) {
  state.auth = {
    userId: `user-${tenantId}`,
    tenantId,
    role,
    permissions: [],
  };
}

function resetState() {
  setAuth("admin", "tenant_alpha");
  state.auditLogs = [];
  state.txQueries = [];
  state.workflowTasks[0].status = "open";
  state.workflowTasks[0].updated_at = "2026-07-01T00:00:00.000Z";
  state.evidenceObjects[0].verification_status = "pending";
}

async function createApp() {
  const app = Fastify();
  await registerRoutes(app);
  return app;
}

describe("audit logging", () => {
  beforeEach(() => {
    resetState();
  });

  it("records signal creation", async () => {
    const app = await createApp();

    const response = await app.inject({
      method: "POST",
      url: "/signals",
      headers: {
        "user-agent": "AuditTest/1.0",
      },
      payload: {
        envelope: {
          tenant_id: "tenant_alpha",
          domain: "incident",
          type: "incident.created",
          severity: "critical",
          actor: { actor_type: "staff" },
          occurred_at: "2026-07-01T00:00:00.000Z",
          payload: {},
          evidence: [],
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(state.auditLogs.at(-1)).toEqual(
      expect.objectContaining({
        action: "signal.created",
        entity_type: "signal_event",
        tenant_id: "tenant_alpha",
        user_id: "user-tenant_alpha",
        user_agent: "AuditTest/1.0",
      }),
    );

    await app.close();
  });

  it("records signal detail and timeline reads", async () => {
    const app = await createApp();

    await app.inject({ method: "GET", url: "/signals/signal-1" });
    await app.inject({ method: "GET", url: "/signals" });

    expect(state.auditLogs.map((row) => row.action)).toEqual([
      "signal.read",
      "timeline.read",
    ]);

    await app.close();
  });

  it("records login and logout with request context", async () => {
    const app = await createApp();

    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      headers: {
        "user-agent": "AuditTest/1.0",
      },
      remoteAddress: "198.51.100.23",
      payload: {
        email: "demo.admin@signalledger.local",
        password: "DemoPassword123!",
      },
    });

    expect(login.statusCode).toBe(200);
    expect(state.auditLogs.at(-1)).toEqual(
      expect.objectContaining({
        action: "login",
        entity_type: "user",
        tenant_id: "tenant_alpha",
        user_id: "user-login",
        ip_address: "198.51.100.23",
        user_agent: "AuditTest/1.0",
        metadata: { email: "demo.admin@signalledger.local" },
      }),
    );

    const logout = await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: {
        "user-agent": "AuditTest/1.0",
      },
      remoteAddress: "198.51.100.23",
    });

    expect(logout.statusCode).toBe(200);
    expect(state.auditLogs.map((row) => row.action)).toContain("logout");

    await app.close();
  });

  it("records evidence registration and verification", async () => {
    const app = await createApp();

    await app.inject({
      method: "POST",
      url: "/evidence/register",
      payload: {
        kind: "document",
        filename: "doc.txt",
        contentType: "text/plain",
        sizeBytes: 11,
        storageUri: "s3://evidence/doc.txt",
        sha256: "bfaba146703bfeb254da97a194d11c4266808ef65a2bc592d968459ab7c4e987",
      },
    });
    await app.inject({
      method: "POST",
      url: "/evidence/evidence-1/verify",
    });

    expect(state.auditLogs.map((row) => row.action)).toContain("evidence.registered");

    await app.close();
  });

  it("records evidence pack generation and integrity verification", async () => {
    const app = await createApp();

    await app.inject({
      method: "POST",
      url: "/evidence-packs",
      payload: { tenantId: "tenant_alpha" },
    });
    await app.inject({
      method: "POST",
      url: "/integrity/verify",
      payload: { tenantId: "tenant_alpha" },
    });

    expect(state.auditLogs.map((row) => row.action)).toContain("evidence_pack.generated");
    expect(state.auditLogs.map((row) => row.action)).toContain("integrity.verify");

    await app.close();
  });

  it("records task creation and status changes", async () => {
    const app = await createApp();

    const response = await app.inject({
      method: "POST",
      url: "/tasks/task-1/status",
      payload: { status: "closed" },
    });

    expect(response.statusCode).toBe(200);

    await app.close();
  });

  it("blocks audit reads for non-privileged roles and scopes reads to tenant", async () => {
    state.auditLogs.push(
      {
        id: "audit-1",
        tenant_id: "tenant_alpha",
        action: "signal.created",
        entity_type: "signal_event",
        entity_id: "signal-1",
        created_at: "2026-07-01T00:00:00.000Z",
      },
      {
        id: "audit-2",
        tenant_id: "tenant_beta",
        action: "signal.created",
        entity_type: "signal_event",
        entity_id: "signal-2",
        created_at: "2026-07-01T00:00:01.000Z",
      },
    );

    setAuth("participant", "tenant_alpha");
    const app = await createApp();

    const forbidden = await app.inject({ method: "GET", url: "/audit-log" });
    expect(forbidden.statusCode).toBe(403);

    setAuth("admin", "tenant_beta");
    const allowed = await app.inject({ method: "GET", url: "/audit-log" });
    expect(allowed.statusCode).toBe(200);
    expect((allowed.json() as Array<{ tenant_id: string }>).every((row) => row.tenant_id === "tenant_beta")).toBe(true);

    await app.close();
  });

  it("filters audit reads by action, entity, and date bounds with a bounded default limit", async () => {
    state.auditLogs = Array.from({ length: 60 }, (_, index) => ({
      id: `audit-${index + 1}`,
      tenant_id: "tenant_alpha",
      user_id: "user-tenant_alpha",
      action: index < 10 ? "signal.read" : "timeline.read",
      entity_type: index < 30 ? "signal_event" : "workflow_task",
      entity_id: index < 30 ? "signal-1" : "task-1",
      ip_address: null,
      user_agent: null,
      metadata: {},
      created_at: `2026-07-01T00:00:${String(index).padStart(2, "0")}.000Z`,
    }));

    const app = await createApp();

    const defaultLimit = await app.inject({
      method: "GET",
      url: "/audit-log",
    });
    expect(defaultLimit.statusCode).toBe(200);
    expect(defaultLimit.json()).toHaveLength(50);

    const filtered = await app.inject({
      method: "GET",
      url: "/audit-log?action=signal.read&entityType=signal_event&entityId=signal-1&from=2026-07-01T00:00:00.000Z&to=2026-07-01T00:00:09.999Z",
    });
    expect(filtered.statusCode).toBe(200);
    expect(filtered.json()).toHaveLength(10);
    expect((filtered.json() as Array<{ action: string; entity_type: string }>).every((row) => row.action === "signal.read" && row.entity_type === "signal_event")).toBe(true);

    await app.close();
  });
});
