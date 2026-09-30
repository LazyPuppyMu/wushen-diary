import { describe, expect, it } from "vitest";
import type { DiaryEntry } from "../storage/db";
import { getSelectedEntries, getSelectionSummary, toggleSelection } from "./selection";

const entries: DiaryEntry[] = [
  { id: "first", date: "2026-09-30", content: "今天散步。", createdAt: "2026-09-30T08:00:00.000Z" },
  { id: "second", date: "2026-09-29", content: "完成了一个小任务。", createdAt: "2026-09-29T08:00:00.000Z" }
];

describe("selection helpers", () => {
  it("toggles one entry without mutating the original selection", () => {
    const selected = new Set(["first"]);

    expect([...toggleSelection(selected, "second")]).toEqual(["first", "second"]);
    expect([...toggleSelection(selected, "first")]).toEqual([]);
    expect([...selected]).toEqual(["first"]);
  });

  it("returns selected entries in list order and summarizes code point characters", () => {
    const selected = new Set(["second", "first"]);

    expect(getSelectedEntries(entries, selected)).toEqual(entries);
    expect(getSelectionSummary(entries, selected)).toEqual({ count: 2, characters: 14 });
  });

  it("ignores ids that are no longer in the local list", () => {
    const selected = new Set(["missing"]);

    expect(getSelectedEntries(entries, selected)).toEqual([]);
    expect(getSelectionSummary(entries, selected)).toEqual({ count: 0, characters: 0 });
  });
});
