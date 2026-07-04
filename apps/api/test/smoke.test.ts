import { describe, expect, it } from "vitest";
import { calculateSignalHash } from "@signalledger/shared";
import { SignalCreateInputSchema } from "@signalledger/signal-schema";

describe("api smoke", () => {
  it("loads workspace contracts", () => {
    const parsed = SignalCreateInputSchema.safeParse({
      envelope: {
        tenant_id: "tenant-1",
        domain: "system",
        type: "incident.created",
        severity: "notice",
        actor: { actor_type: "system" },
        occurred_at: "2026-01-01T00:00:00.000Z",
        payload: {},
        evidence: [],
      },
    });
    expect(parsed.success).toBe(true);
    expect(
      calculateSignalHash(
        {
          tenant_id: "tenant-1",
          payload: {},
          evidence: [],
          occurred_at: "2026-01-01T00:00:00.000Z",
          received_at: "2026-01-01T00:00:00.000Z",
        },
        null,
      ),
    ).toHaveLength(64);
  });
});
