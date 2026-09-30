import { describe, expect, it } from "vitest";
import type { DiaryEntry } from "../storage/db";
import { buildMarkdownExport } from "./local-data";

const entries: DiaryEntry[] = [
  { id: "one", date: "2026-09-30", content: "今天完成了练习。", createdAt: "2026-09-30T08:00:00.000Z" },
  { id: "two", date: "2026-09-29", content: "准备明天散步。", createdAt: "2026-09-29T08:00:00.000Z" }
];

describe("buildMarkdownExport", () => {
  it("exports only local entries as readable markdown", () => {
    expect(buildMarkdownExport(entries)).toBe([
      "# 吾身日记",
      "",
      "## 2026-09-30",
      "",
      "今天完成了练习。",
      "",
      "## 2026-09-29",
      "",
      "准备明天散步。",
      ""
    ].join("\n"));
  });

  it("returns an empty document when there are no local entries", () => {
    expect(buildMarkdownExport([])).toBe("# 吾身日记\n");
  });
});
