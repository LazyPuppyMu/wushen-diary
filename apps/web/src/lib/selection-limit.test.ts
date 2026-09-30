import { describe, expect, it } from "vitest";
import type { DiaryEntry } from "../storage/db";
import { canSelectMore, toggleSelectionWithLimit } from "./selection-limit";

const entries = (count: number): DiaryEntry[] => Array.from({ length: count }, (_, index) => ({
  id: String(index),
  date: "2026-09-30",
  content: "entry",
  createdAt: `2026-09-30T00:00:0${index}.000Z`
}));

describe("selection limit", () => {
  it("allows selecting up to 20 records and rejects the 21st", () => {
    const selected = new Set(entries(20).map(({ id }) => id));
    expect(canSelectMore(selected, "20")).toBe(false);
    expect(toggleSelectionWithLimit(selected, "20")).toEqual(selected);
  });

  it("always allows unselecting a selected record", () => {
    const selected = new Set(["one"]);
    expect(canSelectMore(selected, "one")).toBe(true);
    expect(toggleSelectionWithLimit(selected, "one")).toEqual(new Set());
  });
});
