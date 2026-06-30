import bcrypt from "bcryptjs";
import { pool } from "./index.js";
import { calculateSignalHash } from "@signalledger/shared";

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash("DemoPassword123!", 12);
  const tenant = await pool.query(
    `insert into tenants (name, slug, status)
     values ($1, $2, 'active')
     on conflict (slug) do update set name = excluded.name
     returning id`,
    ["Demo Tenant", "demo"],
  );
  const tenantId = tenant.rows[0].id as string;

  const user = await pool.query(
    `insert into users (email, password_hash, display_name, status)
     values ($1, $2, $3, 'active')
     on conflict (email) do update set password_hash = excluded.password_hash, display_name = excluded.display_name
     returning id`,
    ["demo.admin@signalledger.local", passwordHash, "Demo Admin"],
  );
  const userId = user.rows[0].id as string;

  await pool.query(
    `insert into tenant_memberships (tenant_id, user_id, role)
     values ($1, $2, 'owner')
     on conflict (tenant_id, user_id) do update set role = excluded.role`,
    [tenantId, userId],
  );

  const actor = {
    actor_id: userId,
    actor_type: "staff",
    actor_display_name: "Demo Admin",
    actor_role: "owner",
  };
  const receivedAt = new Date().toISOString();
  const envelope = {
    tenant_id: tenantId,
    domain: "incident",
    type: "incident.created",
    severity: "critical",
    actor,
    subject_id: null,
    participant_id: null,
    property_id: null,
    shift_id: null,
    incident_id: "incident-demo-1",
    occurred_at: new Date().toISOString(),
    observed_at: new Date().toISOString(),
    correlation_id: "seeded-demo",
    causation_id: null,
    visibility: "provider",
    retention_class: "incident",
    schema_version: 1,
    payload: { summary: "Demo incident for local testing" },
    evidence: [],
    received_at: receivedAt,
  };
  const hash = calculateSignalHash(
    {
      tenant_id: envelope.tenant_id,
      domain: envelope.domain,
      type: envelope.type,
      severity: envelope.severity,
      actor: envelope.actor,
      subject_id: envelope.subject_id,
      participant_id: envelope.participant_id,
      property_id: envelope.property_id,
      shift_id: envelope.shift_id,
      incident_id: envelope.incident_id,
      occurred_at: envelope.occurred_at,
      observed_at: envelope.observed_at,
      received_at: envelope.received_at,
      correlation_id: envelope.correlation_id,
      causation_id: envelope.causation_id,
      visibility: envelope.visibility,
      retention_class: envelope.retention_class,
      schema_version: envelope.schema_version,
      payload: envelope.payload,
      evidence: envelope.evidence,
    },
    null,
  );

  await pool.query(
    `insert into signal_events (
      id, tenant_id, domain, type, severity, actor_id, actor_type, actor_display_name, actor_role,
      subject_id, participant_id, property_id, shift_id, incident_id,
      occurred_at, observed_at, received_at, payload, evidence, correlation_id, causation_id,
      previous_hash, hash, signature, visibility, retention_class, schema_version
    ) values (
      gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13,
      $14, $15, $16, $17, $18, $19, $20,
      null, $21, null, $22, $23, $24
    )`,
    [
      tenantId,
      envelope.domain,
      envelope.type,
      envelope.severity,
      actor.actor_id,
      actor.actor_type,
      actor.actor_display_name,
      actor.actor_role,
      envelope.subject_id,
      envelope.participant_id,
      envelope.property_id,
      envelope.shift_id,
      envelope.incident_id,
      envelope.occurred_at,
      envelope.observed_at,
      envelope.received_at,
      JSON.stringify(envelope.payload),
      JSON.stringify(envelope.evidence),
      envelope.correlation_id,
      envelope.causation_id,
      hash,
      envelope.visibility,
      envelope.retention_class,
      envelope.schema_version,
    ],
  );

  console.log("seeded demo tenant and admin");
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
