import { describe, expect, it } from "vitest";
import { createRequestGate } from "./request-gate";

describe("createRequestGate", () => {
  it("prevents a pending result from being applied after local data is cleared", () => {
    const gate = createRequestGate();
    const request = gate.begin();

    gate.invalidate();

    expect(gate.isCurrent(request)).toBe(false);
    const nextRequest = gate.begin();
    expect(gate.isCurrent(nextRequest)).toBe(true);
  });
});
