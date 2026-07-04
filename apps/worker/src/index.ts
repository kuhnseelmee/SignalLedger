import { connect, StringCodec, type JetStreamClient } from "nats";
import { config } from "@signalledger/config";
import { pool, closePool } from "@signalledger/db";

const sc = StringCodec();
const streamName = "SIGNALEDGER";

async function ensureStream() {
  const nc = await connect({ servers: config.NATS_URL });
  const jsm = await nc.jetstreamManager();
  try {
    await jsm.streams.info(streamName);
  } catch {
    await jsm.streams.add({ name: streamName, subjects: ["acc.>"] });
  }
  return { nc, js: nc.jetstream() };
}

async function publishOutboxOnce(js: JetStreamClient) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const claim = await client.query(
      `update signal_outbox
       set locked_at = now(), locked_by = $1
       where id in (
         select id from signal_outbox
         where published_at is null and locked_at is null
         order by created_at asc
         for update skip locked
         limit 25
       )
       returning *`,
      ["worker"],
    );
    await client.query("COMMIT");
    for (const row of claim.rows) {
      try {
        await js.publish(row.topic, sc.encode(JSON.stringify(row.payload)));
        await pool.query(
          `update signal_outbox
           set published_at = now(), last_error = null, locked_at = null, locked_by = null
           where id = $1`,
          [row.id],
        );
      } catch (error) {
        await pool.query(
          `update signal_outbox
           set attempts = attempts + 1, last_error = $2, locked_at = null, locked_by = null
           where id = $1`,
          [row.id, error instanceof Error ? error.message : String(error)],
        );
      }
    }
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function routeWorkflowTask(event: any) {
  const type = String(event?.envelope?.type ?? event?.type ?? "");
  const tenantId = String(
    event?.tenantId ?? event?.envelope?.tenant_id ?? event?.tenant_id ?? "",
  );
  const eventId = String(event?.eventId ?? event?.id ?? "");
  const severity = String(
    event?.envelope?.severity ?? event?.severity ?? "notice",
  );
  if (!tenantId || !eventId || !type) return;
  const taskConfig = {
    "incident.created": {
      type: "incident_triage",
      assignedRole: "compliance",
      priority: severity === "critical" ? "critical" : "high",
      title: "Triage incident",
      description: "Review new incident and determine next action.",
    },
    "incident.reportable_flagged": {
      type: "reportable_review",
      assignedRole: "compliance",
      priority: "critical",
      title: "Review reportable incident",
      description: "Prepare evidence pack stub and review reportable incident.",
    },
    "participant.unseen": {
      type: "welfare_check",
      assignedRole: "coordinator",
      priority: severity === "critical" ? "critical" : "high",
      title: "Complete welfare check",
      description: "Participant has not been seen in expected window.",
    },
    "property.hazard_detected": {
      type: "property_hazard",
      assignedRole: "property_manager",
      priority: severity === "critical" ? "critical" : "high",
      title: "Address property hazard",
      description: "Investigate property hazard and take corrective action.",
    },
    "restrictive_practice.observed": {
      type: "restrictive_practice_review",
      assignedRole: "compliance",
      priority: severity === "critical" ? "critical" : "high",
      title: "Review restrictive practice",
      description: "Compliance review required for restrictive practice event.",
    },
    "document.verified": {
      type: "document_verified_audit",
      assignedRole: "compliance",
      priority: "normal",
      title: "Review verified document",
      description: "Verified document should be linked into audit trail.",
    },
  }[type];
  if (!taskConfig) return;
  await pool.query(
    `insert into workflow_tasks (
      tenant_id, source_event_id, type, status, priority, title, description, assigned_role
     ) values ($1, $2, $3, 'open', $4, $5, $6, $7)
     on conflict (tenant_id, source_event_id, type) do nothing`,
    [
      tenantId,
      eventId,
      taskConfig.type,
      taskConfig.priority,
      taskConfig.title,
      taskConfig.description,
      taskConfig.assignedRole,
    ],
  );
  if (type === "document.verified") {
    await pool.query(
      `insert into audit_log (tenant_id, user_id, action, entity_type, entity_id, metadata)
       select $1, null, 'document.verified', 'signal_event', $2, $3::jsonb
       where not exists (
         select 1 from audit_log where tenant_id = $1 and action = 'document.verified' and entity_id = $2
       )`,
      [tenantId, eventId, JSON.stringify({ routed: true })],
    );
  }
}

async function main(): Promise<void> {
  const { nc, js } = await ensureStream();
  const subscription = nc.subscribe("acc.>");
  (async () => {
    for await (const message of subscription) {
      try {
        const payload = JSON.parse(sc.decode(message.data));
        await routeWorkflowTask(payload);
      } catch (error) {
        console.error("consumer failed", error);
      }
    }
  })().catch((error) => console.error("subscription loop failed", error));

  const interval = setInterval(() => {
    publishOutboxOnce(js).catch((error) =>
      console.error("outbox publish failed", error),
    );
  }, config.SIGNALLEDGER_OUTBOX_INTERVAL_MS);
  await publishOutboxOnce(js);

  const shutdown = async () => {
    clearInterval(interval);
    await nc.drain();
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
