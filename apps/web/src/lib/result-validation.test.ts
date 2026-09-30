import { describe, expect, it } from "vitest";
import type { DiaryEntry } from "../storage/db";
import type { OrganizeResponse } from "./organize";
import { partitionResults } from "./result-validation";

const selected: DiaryEntry[] = [
  { id: "selected", date: "2026-09-30", content: "今天看到了彩虹 🌈。", createdAt: "2026-09-30T08:00:00.000Z" }
];
const conclusion = (entryId: string, quote: string, start: number, end: number) => ({
  category: "joy" as const,
  type: "fact" as const,
  text: "看到了彩虹。",
  confidence: "high" as const,
  evidence: [{ entry_id: entryId, quote, start, end }]
});

describe("partitionResults", () => {
  it("keeps only exact evidence from selected entries in normal results", () => {
    const response: OrganizeResponse = {
      items: [
        conclusion("selected", "彩虹 🌈", 5, 9),
        conclusion("selected", "不存在的引用", 5, 8),
        conclusion("not-selected", "彩虹 🌈", 5, 9)
      ]
    };

    expect(partitionResults(response, selected)).toEqual({
      verified: [response.items[0]],
      pending: [response.items[1], response.items[2]]
    });
  });

  it("requires every quote on a conclusion to be valid", () => {
    const response: OrganizeResponse = {
      items: [{
        ...conclusion("selected", "彩虹 🌈", 5, 9),
        evidence: [
          { entry_id: "selected", quote: "彩虹 🌈", start: 5, end: 9 },
          { entry_id: "selected", quote: "错误", start: 0, end: 2 }
        ]
      }]
    };

    expect(partitionResults(response, selected)).toEqual({ verified: [], pending: response.items });
  });
});
