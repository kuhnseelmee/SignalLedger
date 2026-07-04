import { describe, expect, it } from "vitest";
import { SignalCreateInputSchema } from "../src/index.js";

const valid = {
  envelope: {
    tenant_id: "tenant-1",
    domain: "incident",
    type: "incident.created",
    severity: "critical",
    actor: {
      actor_type: "staff",
      actor_id: "user-1",
      actor_display_name: "Demo Admin",
      actor_role: "owner",
    },
    occurred_at: "2026-01-01T00:00:00.000Z",
    visibility: "provider",
    retention_class: "incident",
    schema_version: 1,
    payload: { summary: "test" },
    evidence: [],
  },
};

describe("signal schema", () => {
  it("accepts valid input", () => {
    expect(SignalCreateInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid domain", () => {
    const parsed = SignalCreateInputSchema.safeParse({
      ...valid,
      envelope: { ...valid.envelope, domain: "bad" },
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid timestamp", () => {
    const parsed = SignalCreateInputSchema.safeParse({
      ...valid,
      envelope: { ...valid.envelope, occurred_at: "not-a-time" },
    });
    expect(parsed.success).toBe(false);
  });
});
