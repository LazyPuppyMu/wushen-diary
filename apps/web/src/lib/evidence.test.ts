import { describe, expect, it } from "vitest";
import { matchesEvidence, toUtf16Range } from "./evidence";

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

  it("matches server code point offsets when the quote contains emoji", () => {
    expect(matchesEvidence("看到了彩虹 🌈。", {
      quote: "彩虹 🌈",
      start: 3,
      end: 7
    })).toBe(true);
  });

  it("maps a code point range to the UTF-16 range used by DOM strings", () => {
    expect(toUtf16Range("看到了彩虹 🌈。", 6, 7)).toEqual({ start: 6, end: 8 });
  });
});
