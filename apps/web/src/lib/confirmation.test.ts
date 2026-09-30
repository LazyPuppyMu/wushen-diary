import { describe, expect, it, vi } from "vitest";
import type { DiaryEntry } from "../storage/db";
import { organizeAfterConfirmation } from "./confirmation";

const entries: DiaryEntry[] = [
  { id: "one", date: "2026-09-30", content: "今天看到🌈", createdAt: "2026-09-30T08:00:00.000Z" },
  { id: "two", date: "2026-09-28", content: "完成散步", createdAt: "2026-09-28T08:00:00.000Z" }
];

describe("organizeAfterConfirmation", () => {
  it("does not request organization when the user cancels", async () => {
    const send = vi.fn(async () => ({ items: [] }));
    const confirm = vi.fn(() => false);

    const result = await organizeAfterConfirmation(entries, confirm, send);

    expect(result).toBeNull();
    expect(confirm).toHaveBeenCalledWith({ count: 2, earliestDate: "2026-09-28", latestDate: "2026-09-30", characters: 9 });
    expect(send).not.toHaveBeenCalled();
  });

  it("does not show confirmation or request organization when nothing is selected", async () => {
    const confirm = vi.fn(() => true);
    const send = vi.fn(async () => ({ items: [] }));

    expect(await organizeAfterConfirmation([], confirm, send)).toBeNull();
    expect(confirm).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("sends the same selected snapshots only after confirmation", async () => {
    const send = vi.fn(async (selected: readonly DiaryEntry[]) => ({ items: [{ ids: selected.map(({ id }) => id) }] }));

    const result = await organizeAfterConfirmation(entries, () => true, send);

    expect(send).toHaveBeenCalledWith(entries);
    expect(result).toEqual({ items: [{ ids: ["one", "two"] }] });
  });
});
