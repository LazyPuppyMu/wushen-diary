import { describe, expect, it } from "vitest";
import type { DiaryEntry } from "../storage/db";
import { OrganizeApiError, OrganizeRequestError, organizeEntries } from "./organize";

const entries: DiaryEntry[] = [
  { id: "entry-1", date: "2026-09-30", content: "今天看到了彩虹 🌈。", createdAt: "2026-09-30T08:00:00.000Z" }
];

describe("organizeEntries", () => {
  it("sends only the selected snapshots with explicit consent", async () => {
    let request: RequestInit | undefined;
    const response = {
      items: [{
        category: "joy",
        type: "fact",
        text: "看到了彩虹。",
        confidence: "high",
        evidence: [{ entry_id: "entry-1", quote: "彩虹 🌈", start: 5, end: 9 }]
      }]
    };

    const result = await organizeEntries(entries, {
      fetcher: async (_input, init) => {
        request = init;
        return new Response(JSON.stringify(response), { status: 200 });
      },
      baseUrl: "http://127.0.0.1:8000"
    });

    expect(result).toEqual(response);
    expect(request?.method).toBe("POST");
    expect(request?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(request?.body))).toEqual({
      consent: true,
      entries: [{ id: "entry-1", date: "2026-09-30", content: "今天看到了彩虹 🌈。" }]
    });
  });

  it("exposes the HTTP status without creating a result for a 503", async () => {
    await expect(organizeEntries(entries, {
      fetcher: async () => new Response(JSON.stringify({ detail: "unavailable" }), { status: 503 }),
      baseUrl: "http://127.0.0.1:8000"
    })).rejects.toEqual(new OrganizeApiError(503));
  });

  it("rejects a response that cannot be rendered as an organize result", async () => {
    await expect(organizeEntries(entries, {
      fetcher: async () => new Response(JSON.stringify({ items: [{ category: "unknown" }] }), { status: 200 }),
      baseUrl: "http://127.0.0.1:8000"
    })).rejects.toThrow("Invalid organize response");
  });

  it("rejects a selection outside the API entry limit before requesting", async () => {
    const fetcher = async () => new Response("", { status: 200 });
    const tooMany = Array.from({ length: 21 }, (_, index) => ({
      ...entries[0],
      id: `entry-${index}`
    }));

    await expect(organizeEntries(tooMany, { fetcher })).rejects.toEqual(
      new OrganizeRequestError("整理请求必须包含 1 到 20 条日记")
    );
  });

  it("rejects a response with fields outside the API contract", async () => {
    await expect(organizeEntries(entries, {
      fetcher: async () => new Response(JSON.stringify({ items: [{
        category: "joy",
        type: "fact",
        text: "x".repeat(501),
        confidence: "high",
        evidence: [{ entry_id: "entry-1", quote: "彩虹 🌈", start: 5, end: 9 }]
      }] }), { status: 200 }),
      baseUrl: "http://127.0.0.1:8000"
    })).rejects.toThrow("Invalid organize response");
  });
});
