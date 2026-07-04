import { describe, expect, it } from "vitest";
import {
  calculateSignalHash,
  canonicalJson,
  verifyTenantChain,
} from "../src/index.js";

describe("hash helpers", () => {
  it("produces deterministic canonical json", () => {
    expect(canonicalJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
  });

  it("changes when payload changes", () => {
    const base = {
      tenant_id: "t1",
      payload: { a: 1 },
      evidence: [],
      occurred_at: "2026-01-01T00:00:00.000Z",
      received_at: "2026-01-01T00:00:00.000Z",
    };
    const h1 = calculateSignalHash(base, null);
    const h2 = calculateSignalHash({ ...base, payload: { a: 2 } }, null);
    expect(h1).not.toBe(h2);
  });

  it("verifies tenant chain order", () => {
    const e1 = {
      tenant_id: "t1",
      previous_hash: null,
      hash: calculateSignalHash(
        {
          tenant_id: "t1",
          domain: "incident",
          type: "incident.created",
          severity: "critical",
          actor: { actor_type: "staff" },
          subject_id: null,
          participant_id: null,
          property_id: null,
          shift_id: null,
          incident_id: null,
          occurred_at: "2026-01-01T00:00:00.000Z",
          observed_at: null,
          received_at: "2026-01-01T00:00:00.000Z",
          payload: { a: 1 },
          evidence: [],
          correlation_id: null,
          causation_id: null,
          visibility: "provider",
          retention_class: "incident",
          schema_version: 1,
        },
        null,
      ),
      occurred_at: "2026-01-01T00:00:00.000Z",
      domain: "incident",
      type: "incident.created",
      severity: "critical",
      actor: { actor_type: "staff" },
      subject_id: null,
      participant_id: null,
      property_id: null,
      shift_id: null,
      incident_id: null,
      payload: { a: 1 },
      evidence: [],
      received_at: "2026-01-01T00:00:00.000Z",
      observed_at: null,
      correlation_id: null,
      causation_id: null,
      visibility: "provider",
      retention_class: "incident",
      schema_version: 1,
    };
    const e2 = {
      tenant_id: "t1",
      previous_hash: e1.hash,
      hash: calculateSignalHash(
        {
          tenant_id: "t1",
          domain: "incident",
          type: "incident.triaged",
          severity: "warning",
          actor: { actor_type: "staff" },
          subject_id: null,
          participant_id: null,
          property_id: null,
          shift_id: null,
          incident_id: null,
          occurred_at: "2026-01-02T00:00:00.000Z",
          observed_at: null,
          received_at: "2026-01-02T00:00:00.000Z",
          payload: { b: 2 },
          evidence: [],
          correlation_id: null,
          causation_id: null,
          visibility: "provider",
          retention_class: "incident",
          schema_version: 1,
        },
        e1.hash,
      ),
      occurred_at: "2026-01-02T00:00:00.000Z",
      domain: "incident",
      type: "incident.triaged",
      severity: "warning",
      actor: { actor_type: "staff" },
      subject_id: null,
      participant_id: null,
      property_id: null,
      shift_id: null,
      incident_id: null,
      payload: { b: 2 },
      evidence: [],
      received_at: "2026-01-02T00:00:00.000Z",
      observed_at: null,
      correlation_id: null,
      causation_id: null,
      visibility: "provider",
      retention_class: "incident",
      schema_version: 1,
    };
    expect(verifyTenantChain([e1, e2]).ok).toBe(true);
  });
});
