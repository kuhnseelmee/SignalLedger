import { describe, expect, it } from "vitest";
import { hasPermission } from "../src/index.js";

describe("auth roles", () => {
  it("grants owner full access", () => {
    expect(hasPermission("owner", "anything")).toBe(true);
  });

  it("restricts viewer", () => {
    expect(hasPermission("viewer", "participant_timeline")).toBe(false);
  });
});
