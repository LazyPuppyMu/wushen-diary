import { describe, expect, it } from "vitest";
import type { DiaryEntry } from "../storage/db";
import { filterEntriesByDate, isEntryHiddenByDateFilter } from "./date-filter";

const entries: DiaryEntry[] = [
  { id: "new", date: "2026-09-30", content: "new", createdAt: "2026-09-30T00:00:00.000Z" },
  { id: "old", date: "2026-09-28", content: "old", createdAt: "2026-09-28T00:00:00.000Z" }
];

describe("filterEntriesByDate", () => {
  it("keeps both boundaries inclusive", () => {
    expect(filterEntriesByDate(entries, "2026-09-28", "2026-09-30")).toEqual(entries);
  });

  it("supports either open boundary", () => {
    expect(filterEntriesByDate(entries, "2026-09-29", "")).toEqual([entries[0]]);
    expect(filterEntriesByDate(entries, "", "2026-09-29")).toEqual([entries[1]]);
  });

  it("returns all entries when no range is set", () => {
    expect(filterEntriesByDate(entries, "", "")).toEqual(entries);
  });

  it("detects when an existing entry is hidden by the active date range", () => {
    expect(isEntryHiddenByDateFilter(entries, "2026-09-29", "", "old")).toBe(true);
    expect(isEntryHiddenByDateFilter(entries, "2026-09-29", "", "new")).toBe(false);
    expect(isEntryHiddenByDateFilter(entries, "2026-09-29", "", "missing")).toBe(false);
  });
});
