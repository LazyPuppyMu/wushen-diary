import { describe, expect, it } from "vitest";
import { matchesEvidence } from "./evidence";

describe("matchesEvidence", () => {
  it("accepts an exact quote at the supplied range", () => {
    expect(matchesEvidence("今天去散步，心情轻松。", {
      quote: "心情轻松。",
      start: 6,
      end: 11
    })).toBe(true);
  });

  it("rejects a mismatched quote or range", () => {
    expect(matchesEvidence("今天去散步，心情轻松。", {
      quote: "感到开心。",
      start: 6,
      end: 11
    })).toBe(false);
  });
});
