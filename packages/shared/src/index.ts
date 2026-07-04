import crypto from "node:crypto";

export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalize(value));
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  if (
    value &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(
      entries.map(([key, item]) => [key, normalize(item)]),
    );
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function calculateSignalHash(
  eventWithoutHash: unknown,
  previousHash?: string | null,
): string {
  const previous = previousHash || "GENESIS";
  return sha256(`${canonicalJson(eventWithoutHash)}:${previous}`);
}

export function getPreviousTenantHash(
  events: Array<{ hash: string; occurred_at: string }>,
): string | null {
  if (events.length === 0) return null;
  return (
    events
      .slice()
      .sort((a, b) => timeValue(a.occurred_at) - timeValue(b.occurred_at))
      .at(-1)?.hash ?? null
  );
}

export function verifyTenantChain(
  events: Array<
    Record<string, unknown> & {
      tenant_id: string;
      previous_hash: string | null;
      hash: string;
      occurred_at: string;
      received_at: string;
    }
  >,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const tenantIds = new Set(events.map((event) => (event as any).tenant_id));
  if (tenantIds.size > 1) {
    errors.push("cross-tenant chain contamination");
  }
  const sorted = events.slice().sort((a, b) => {
    const time = timeValue(a.occurred_at) - timeValue(b.occurred_at);
    if (time !== 0) return time;
    return a.hash.localeCompare(b.hash);
  });
  let previous: string | null = null;
  for (const event of sorted) {
    const e = event as any;
    if (e.previous_hash !== previous) {
      errors.push(`broken previous hash for ${e.hash}`);
    }
    const expected = calculateSignalHash(
      {
        tenant_id: e.tenant_id,
        domain: e.domain,
        type: e.type,
        severity: e.severity,
        actor: e.actor ?? {
          actor_id: e.actor_id,
          actor_type: e.actor_type,
          actor_display_name: e.actor_display_name,
          actor_role: e.actor_role,
        },
        subject_id: e.subject_id,
        participant_id: e.participant_id,
        property_id: e.property_id,
        shift_id: e.shift_id,
        incident_id: e.incident_id,
        occurred_at: e.occurred_at,
        observed_at: e.observed_at,
        received_at: e.received_at,
        payload: e.payload,
        evidence: e.evidence,
        correlation_id: e.correlation_id,
        causation_id: e.causation_id,
        visibility: e.visibility,
        retention_class: e.retention_class,
        schema_version: e.schema_version,
      },
      previous,
    );
    if (expected !== e.hash) {
      errors.push(`hash mismatch for ${e.hash}`);
    }
    previous = e.hash;
  }
  return { ok: errors.length === 0, errors };
}

function timeValue(value: unknown): number {
  const date = value instanceof Date ? value : new Date(String(value));
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}
