import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "node:crypto";
import { config } from "@signalledger/config";
import {
  SignalCreateInputSchema,
  SignalEnvelopeSchema,
  SignalDomainSchema,
  SignalSeveritySchema,
} from "@signalledger/signal-schema";
import { calculateSignalHash, verifyTenantChain } from "@signalledger/shared";
import { createUploadUrl } from "@signalledger/evidence";
import {
  can,
  clearAuthCookie,
  resolveAuth,
  setAuthCookie,
  signSession,
  verifyPassword,
} from "./auth.js";
import { pool, withTransaction } from "./db.js";
import {
  permissionsForRole,
  visibleSignalVisibilities,
} from "@signalledger/auth";

type AuthedRequest = FastifyRequest & {
  auth: NonNullable<ReturnType<typeof resolveAuth>>;
};

async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<AuthedRequest | undefined> {
  const auth = resolveAuth(request);
  if (!auth) {
    reply.code(401).send({ error: "unauthorized" });
    return;
  }
  (request as AuthedRequest).auth = auth;
  return request as AuthedRequest;
}

async function resolveMembership(userId: string, tenantId: string) {
  const result = await pool.query<{ role: string }>(
    `select role from tenant_memberships where user_id = $1 and tenant_id = $2`,
    [userId, tenantId],
  );
  return result.rows[0] ?? null;
}

async function loadAuthContext(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<AuthedRequest | undefined> {
  const authed = await requireAuth(request, reply);
  if (!authed) return;
  const membership = await resolveMembership(
    authed.auth.userId,
    authed.auth.tenantId,
  );
  if (!membership) {
    reply.code(403).send({ error: "tenant_membership_required" });
    return;
  }
  authed.auth.permissions = permissionsForRole(membership.role as any);
  return authed;
}

function topicForEvent(tenantId: string, domain: string, type: string): string {
  return `acc.${tenantId}.${domain}.${type}`;
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({ ok: true, name: config.APP_NAME }));
  app.get("/ready", async () => {
    await pool.query("select 1");
    return { ok: true };
  });

  app.post(
    "/auth/login",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const body = request.body as {
        email?: string;
        password?: string;
        tenantSlug?: string;
      };
      if (!body?.email || !body?.password) {
        return reply.code(400).send({ error: "email_and_password_required" });
      }
      const userResult = await pool.query(
        `select u.id, u.password_hash, u.display_name, tm.tenant_id, tm.role
       from users u
       join tenant_memberships tm on tm.user_id = u.id
       join tenants t on t.id = tm.tenant_id
       where u.email = $1 and u.status = 'active' and t.status = 'active'
       ${body.tenantSlug ? "and t.slug = $2" : ""}`,
        body.tenantSlug ? [body.email, body.tenantSlug] : [body.email],
      );
      const user = userResult.rows[0];
      if (!user || !(await verifyPassword(body.password, user.password_hash))) {
        return reply.code(401).send({ error: "invalid_credentials" });
      }
      const token = signSession({
        sub: user.id,
        tenantId: user.tenant_id,
        role: user.role,
        displayName: user.display_name,
      });
      setAuthCookie(reply, token);
      await pool.query(
        `insert into audit_log (tenant_id, user_id, action, entity_type, entity_id, metadata)
       values ($1, $2, 'login', 'user', $3, $4::jsonb)`,
        [user.tenant_id, user.id, user.id, JSON.stringify({ email: body.email })],
      );
      return { ok: true, tenantId: user.tenant_id, role: user.role };
    },
  );

  app.post("/auth/logout", async (request, reply) => {
    const auth = resolveAuth(request);
    clearAuthCookie(reply);
    if (auth) {
      await pool.query(
        `insert into audit_log (tenant_id, user_id, action, entity_type, entity_id, metadata)
         values ($1, $2, 'logout', 'user', $3, '{}'::jsonb)`,
        [auth.tenantId, auth.userId, auth.userId],
      );
    }
    return { ok: true };
  });

  app.get("/auth/me", async (request, reply) => {
    const authed = await loadAuthContext(request, reply);
    if (!authed) return;
    const user = await pool.query(
      `select u.id, u.email, u.display_name, tm.role, tm.tenant_id, t.name as tenant_name, t.slug as tenant_slug
       from users u
       join tenant_memberships tm on tm.user_id = u.id
       join tenants t on t.id = tm.tenant_id
       where u.id = $1 and tm.tenant_id = $2`,
      [authed.auth.userId, authed.auth.tenantId],
    );
    const row = user.rows[0];
    if (!row) return reply.code(404).send({ error: "not_found" });
    return {
      userId: row.id,
      email: row.email,
      displayName: row.display_name,
      tenantId: row.tenant_id,
      tenantName: row.tenant_name,
      tenantSlug: row.tenant_slug,
      role: row.role,
    };
  });

  app.post("/signals", async (request, reply) => {
    const authed = await loadAuthContext(request, reply);
    if (!authed) return;
    if (!can(authed.auth.role as any, "signal_create")) {
      return reply.code(403).send({ error: "insufficient_permission" });
    }
    const input = SignalCreateInputSchema.safeParse(request.body);
    if (!input.success) {
      return reply
        .code(400)
        .send({ error: "validation_error", issues: input.error.issues });
    }
    const envelope = input.data.envelope;
    if (envelope.tenant_id !== authed.auth.tenantId) {
      return reply.code(403).send({ error: "cross_tenant_write_blocked" });
    }
    const actor = envelope.actor;
    const receivedAt = new Date().toISOString();
    const eventWithoutHash = {
      tenant_id: envelope.tenant_id,
      domain: envelope.domain,
      type: envelope.type,
      severity: envelope.severity,
      actor,
      subject_id: envelope.subject_id ?? null,
      participant_id: envelope.participant_id ?? null,
      property_id: envelope.property_id ?? null,
      shift_id: envelope.shift_id ?? null,
      incident_id: envelope.incident_id ?? null,
      occurred_at: envelope.occurred_at,
      observed_at: envelope.observed_at ?? null,
      received_at: receivedAt,
      payload: envelope.payload,
      evidence: envelope.evidence,
      correlation_id: envelope.correlation_id ?? null,
      causation_id: envelope.causation_id ?? null,
      visibility: envelope.visibility,
      retention_class: envelope.retention_class,
      schema_version: envelope.schema_version,
    };
    const eventId = randomUUID();
    const topic = topicForEvent(
      authed.auth.tenantId,
      envelope.domain,
      envelope.type,
    );
    let previousHash: string | null = null;
    let hash = "";
    await withTransaction(async (client) => {
      await client.query(`select pg_advisory_xact_lock(hashtext($1))`, [
        authed.auth.tenantId,
      ]);
      const tenantRows = await client.query<{ hash: string }>(
        `select hash from signal_events where tenant_id = $1 order by occurred_at desc, created_at desc limit 1`,
        [authed.auth.tenantId],
      );
      previousHash = tenantRows.rows[0]?.hash ?? null;
      hash = calculateSignalHash(eventWithoutHash, previousHash);
      await client.query(
        `insert into signal_events (
          id, tenant_id, domain, type, severity, actor_id, actor_type, actor_display_name, actor_role,
          subject_id, participant_id, property_id, shift_id, incident_id,
          occurred_at, observed_at, received_at, payload, evidence, correlation_id, causation_id,
          previous_hash, hash, signature, visibility, retention_class, schema_version
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14,
          $15, $16, $17, $18::jsonb, $19::jsonb, $20, $21,
          $22, $23, null, $24, $25, $26
        )`,
        [
          eventId,
          authed.auth.tenantId,
          envelope.domain,
          envelope.type,
          envelope.severity,
          actor.actor_id ?? null,
          actor.actor_type,
          actor.actor_display_name ?? null,
          actor.actor_role ?? authed.auth.role,
          envelope.subject_id ?? null,
          envelope.participant_id ?? null,
          envelope.property_id ?? null,
          envelope.shift_id ?? null,
          envelope.incident_id ?? null,
          envelope.occurred_at,
          envelope.observed_at ?? null,
          receivedAt,
          JSON.stringify(envelope.payload),
          JSON.stringify(envelope.evidence),
          envelope.correlation_id ?? null,
          envelope.causation_id ?? null,
          previousHash,
          hash,
          envelope.visibility,
          envelope.retention_class,
          envelope.schema_version,
        ],
      );
      await client.query(
        `insert into signal_outbox (event_id, tenant_id, topic, payload)
         values ($1, $2, $3, $4::jsonb)`,
        [
          eventId,
          authed.auth.tenantId,
          topic,
          JSON.stringify({
            eventId,
            tenantId: authed.auth.tenantId,
            topic,
            envelope,
            previousHash,
            hash,
            receivedAt,
          }),
        ],
      );
      await client.query(
        `insert into audit_log (tenant_id, user_id, action, entity_type, entity_id, metadata)
         values ($1, $2, 'signal.created', 'signal_event', $3, $4::jsonb)`,
        [
          authed.auth.tenantId,
          authed.auth.userId,
          eventId,
          JSON.stringify({
            domain: envelope.domain,
            type: envelope.type,
            hash,
          }),
        ],
      );
    });
    return { eventId, topic, hash, previousHash };
  });

  app.get("/signals/:id", async (request, reply) => {
    const authed = await loadAuthContext(request, reply);
    if (!authed) return;
    const params = request.params as { id: string };
    const result = await pool.query(
      `select * from signal_events where id = $1 and tenant_id = $2 and visibility = any($3::text[])`,
      [
        params.id,
        authed.auth.tenantId,
        visibleSignalVisibilities(authed.auth.role),
      ],
    );
    const row = result.rows[0];
    if (!row) return reply.code(404).send({ error: "not_found" });
    await pool.query(
      `insert into audit_log (tenant_id, user_id, action, entity_type, entity_id, metadata)
       values ($1, $2, 'signal.read', 'signal_event', $3, '{}'::jsonb)`,
      [authed.auth.tenantId, authed.auth.userId, params.id],
    );
    return row;
  });

  async function listSignals(
    request: FastifyRequest,
    reply: FastifyReply,
    filter: Record<string, unknown> = {},
  ) {
    const authed = await loadAuthContext(request, reply);
    if (!authed) return;
    const q = request.query as { limit?: string; offset?: string };
    const limit = Math.min(Math.max(Number(q.limit ?? 25), 1), 100);
    const offset = Math.max(Number(q.offset ?? 0), 0);
    const where = ["tenant_id = $1"];
    const values: unknown[] = [authed.auth.tenantId];
    let index = 2;
    for (const [key, value] of Object.entries(filter)) {
      where.push(`${key} = $${index++}`);
      values.push(value);
    }
    const result = await pool.query(
      `select * from signal_events where ${where.join(" and ")} and visibility = any($${index}::text[]) order by occurred_at desc, created_at desc limit $${index + 1} offset $${index + 2}`,
      [...values, visibleSignalVisibilities(authed.auth.role), limit, offset],
    );
    await pool.query(
      `insert into audit_log (tenant_id, user_id, action, entity_type, entity_id, metadata)
       values ($1, $2, 'timeline.read', 'signal_event', $3, $4::jsonb)`,
      [
        authed.auth.tenantId,
        authed.auth.userId,
        "timeline",
        JSON.stringify(filter),
      ],
    );
    return result.rows;
  }

  app.get("/signals", async (request, reply) => listSignals(request, reply));
  app.get("/participants/:participantId/signals", async (request, reply) => {
    const params = request.params as { participantId: string };
    return listSignals(request, reply, {
      participant_id: params.participantId,
    });
  });
  app.get("/properties/:propertyId/signals", async (request, reply) => {
    const params = request.params as { propertyId: string };
    return listSignals(request, reply, { property_id: params.propertyId });
  });
  app.get("/shifts/:shiftId/signals", async (request, reply) => {
    const params = request.params as { shiftId: string };
    return listSignals(request, reply, { shift_id: params.shiftId });
  });
  app.get("/incidents/:incidentId/signals", async (request, reply) => {
    const params = request.params as { incidentId: string };
    return listSignals(request, reply, { incident_id: params.incidentId });
  });

  app.post("/evidence/upload-url", async (request, reply) => {
    const authed = await loadAuthContext(request, reply);
    if (!authed) return;
    const body = request.body as { key?: string; contentType?: string };
    if (!body?.key || !body?.contentType) {
      return reply.code(400).send({ error: "key_and_contentType_required" });
    }
    const uploadUrl = await createUploadUrl(body.key, body.contentType);
    return { uploadUrl };
  });

  app.post("/evidence/register", async (request, reply) => {
    const authed = await loadAuthContext(request, reply);
    if (!authed) return;
    const body = request.body as {
      kind?: string;
      filename?: string;
      contentType?: string;
      sizeBytes?: number;
      storageUri?: string;
      sha256?: string;
    };
    if (
      !body?.kind ||
      !body?.filename ||
      !body?.contentType ||
      !body?.sizeBytes ||
      !body?.storageUri
    ) {
      return reply.code(400).send({ error: "missing_fields" });
    }
    const result = await pool.query(
      `insert into evidence_objects (
        tenant_id, uploaded_by_user_id, kind, filename, content_type, size_bytes, storage_uri, sha256, verification_status
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
      returning *`,
      [
        authed.auth.tenantId,
        authed.auth.userId,
        body.kind,
        body.filename,
        body.contentType,
        body.sizeBytes,
        body.storageUri,
        body.sha256 ?? null,
      ],
    );
    return result.rows[0];
  });

  app.get("/evidence/:id", async (request, reply) => {
    const authed = await loadAuthContext(request, reply);
    if (!authed) return;
    const params = request.params as { id: string };
    const result = await pool.query(
      `select * from evidence_objects where id = $1 and tenant_id = $2`,
      [params.id, authed.auth.tenantId],
    );
    const row = result.rows[0];
    if (!row) return reply.code(404).send({ error: "not_found" });
    return row;
  });

  app.post("/evidence/:id/verify", async (request, reply) => {
    const authed = await loadAuthContext(request, reply);
    if (!authed) return;
    const params = request.params as { id: string };
    const body = request.body as { verificationStatus?: string };
    const status = body?.verificationStatus ?? "verified";
    const result = await pool.query(
      `update evidence_objects set verification_status = $3, updated_at = now() where id = $1 and tenant_id = $2 returning *`,
      [params.id, authed.auth.tenantId, status],
    );
    const row = result.rows[0];
    if (!row) return reply.code(404).send({ error: "not_found" });
    await pool.query(
      `insert into audit_log (tenant_id, user_id, action, entity_type, entity_id, metadata)
       values ($1, $2, 'evidence.verified', 'evidence_object', $3, $4::jsonb)`,
      [
        authed.auth.tenantId,
        authed.auth.userId,
        params.id,
        JSON.stringify({ status }),
      ],
    );
    return row;
  });

  app.post("/evidence-packs", async (request, reply) => {
    const authed = await loadAuthContext(request, reply);
    if (!authed) return;
    if (
      !can(authed.auth.role as any, "evidence_pack") &&
      !["owner", "admin", "compliance"].includes(authed.auth.role)
    ) {
      return reply.code(403).send({ error: "insufficient_permission" });
    }
    const body = request.body as {
      tenantId?: string;
      participantId?: string;
      propertyId?: string;
      shiftId?: string;
      incidentId?: string;
      from?: string;
      to?: string;
    };
    if (body.tenantId && body.tenantId !== authed.auth.tenantId) {
      return reply.code(403).send({ error: "cross_tenant_write_blocked" });
    }
    const result = await pool.query(
      `select * from signal_events where tenant_id = $1
       and ($2::text is null or participant_id = $2)
       and ($3::text is null or property_id = $3)
       and ($4::text is null or shift_id = $4)
       and ($5::text is null or incident_id = $5)
       and ($6::timestamptz is null or occurred_at >= $6)
       and ($7::timestamptz is null or occurred_at <= $7)
       order by occurred_at asc, created_at asc`,
      [
        authed.auth.tenantId,
        body.participantId ?? null,
        body.propertyId ?? null,
        body.shiftId ?? null,
        body.incidentId ?? null,
        body.from ?? null,
        body.to ?? null,
      ],
    );
    const verification = verifyTenantChain(result.rows);
    const exportTime = new Date().toISOString();
    const timelineJson = {
      exportedAt: exportTime,
      exportedBy: authed.auth.userId,
      tenantId: authed.auth.tenantId,
      filters: body,
      events: result.rows,
    };
    const manifestJson = {
      exportedAt: exportTime,
      verification,
      entries: result.rows.map((row) => ({
        id: row.id,
        hash: row.hash,
        previousHash: row.previous_hash,
        domain: row.domain,
        type: row.type,
        occurredAt: row.occurred_at,
        evidenceCount: Array.isArray(row.evidence) ? row.evidence.length : 0,
      })),
    };
    const hashVerificationText = verification.ok
      ? "ok"
      : verification.errors.join("\n");
    const packPayload = { timelineJson, manifestJson, hashVerificationText };
    const eventWithoutHash = {
      tenant_id: authed.auth.tenantId,
      domain: "compliance",
      type: "compliance.evidence_pack_generated",
      severity: "notice",
      actor: {
        actor_id: authed.auth.userId,
        actor_type: "system",
        actor_display_name: "SignalLedger",
        actor_role: "system",
      },
      subject_id: null,
      participant_id: body.participantId ?? null,
      property_id: body.propertyId ?? null,
      shift_id: body.shiftId ?? null,
      incident_id: body.incidentId ?? null,
      occurred_at: exportTime,
      observed_at: exportTime,
      received_at: exportTime,
      payload: packPayload,
      evidence: [],
      correlation_id: null,
      causation_id: null,
      visibility: "provider",
      retention_class: "legal_hold",
      schema_version: 1,
    };
    const eventId = randomUUID();
    const topic = topicForEvent(
      authed.auth.tenantId,
      "compliance",
      "compliance.evidence_pack_generated",
    );
    let previousHash: string | null = null;
    let eventHash = "";
    await withTransaction(async (client) => {
      await client.query(`select pg_advisory_xact_lock(hashtext($1))`, [
        authed.auth.tenantId,
      ]);
      const previousHashResult = await client.query<{ hash: string }>(
        `select hash from signal_events where tenant_id = $1 order by occurred_at desc, created_at desc limit 1`,
        [authed.auth.tenantId],
      );
      previousHash = previousHashResult.rows[0]?.hash ?? null;
      eventHash = calculateSignalHash(eventWithoutHash, previousHash);
      await client.query(
        `insert into signal_events (
          id, tenant_id, domain, type, severity, actor_id, actor_type, actor_display_name, actor_role,
          subject_id, participant_id, property_id, shift_id, incident_id,
          occurred_at, observed_at, received_at, payload, evidence, correlation_id, causation_id,
          previous_hash, hash, signature, visibility, retention_class, schema_version
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14,
          $15, $16, $17, $18::jsonb, $19::jsonb, $20, $21,
          $22, $23, null, $24, $25, $26
        )`,
        [
          eventId,
          authed.auth.tenantId,
          "compliance",
          "compliance.evidence_pack_generated",
          "notice",
          authed.auth.userId,
          "system",
          "SignalLedger",
          "system",
          null,
          body.participantId ?? null,
          body.propertyId ?? null,
          body.shiftId ?? null,
          body.incidentId ?? null,
          exportTime,
          exportTime,
          exportTime,
          JSON.stringify(packPayload),
          "[]",
          null,
          null,
          previousHash,
          eventHash,
          "provider",
          "legal_hold",
          1,
        ],
      );
      await client.query(
        `insert into signal_outbox (event_id, tenant_id, topic, payload)
         values ($1, $2, $3, $4::jsonb)`,
        [
          eventId,
          authed.auth.tenantId,
          topic,
          JSON.stringify({
            eventId,
            tenantId: authed.auth.tenantId,
            topic,
            envelope: eventWithoutHash,
            previousHash,
            hash: eventHash,
            receivedAt: exportTime,
          }),
        ],
      );
      await client.query(
        `insert into audit_log (tenant_id, user_id, action, entity_type, entity_id, metadata)
         values ($1, $2, 'evidence_pack.generated', 'evidence_pack', $3, $4::jsonb)`,
        [
          authed.auth.tenantId,
          authed.auth.userId,
          eventId,
          JSON.stringify({ filters: body, verification: verification.ok }),
        ],
      );
    });
    return {
      "timeline.json": timelineJson,
      "evidence-manifest.json": manifestJson,
      "hash-verification.txt": hashVerificationText,
    };
  });

  app.get("/incidents", async (request, reply) =>
    listSignals(request, reply, { domain: "incident" }),
  );

  app.get("/tasks", async (request, reply) => {
    const authed = await loadAuthContext(request, reply);
    if (!authed) return;
    const result = await pool.query(
      `select * from workflow_tasks where tenant_id = $1 order by created_at desc limit 100`,
      [authed.auth.tenantId],
    );
    return result.rows;
  });
}
