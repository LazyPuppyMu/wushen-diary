import { z } from "zod";
import type { DiaryEntry } from "../storage/db";

const categories = ["joy", "fulfillment", "reflection", "improvement", "gratitude", "weight", "murmur"] as const;
const conclusionTypes = ["fact", "inference"] as const;
const confidenceLevels = ["high", "medium", "low", "insufficient"] as const;

const responseSchema = z.object({
  items: z.array(z.object({
    category: z.enum(categories),
    type: z.enum(conclusionTypes),
    text: z.string().min(1).max(500),
    confidence: z.enum(confidenceLevels),
    evidence: z.array(z.object({
      entry_id: z.string().min(1).max(100),
      quote: z.string().min(1),
      start: z.number().int().nonnegative(),
      end: z.number().int().positive()
    }).strict()).min(1)
  }).strict())
}).strict();

export type OrganizeResponse = z.infer<typeof responseSchema>;

export interface OrganizeOptions {
  fetcher?: typeof fetch;
  baseUrl?: string;
}

export class OrganizeApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Organize API returned HTTP ${status}`);
    this.name = "OrganizeApiError";
    this.status = status;
  }
}

export class OrganizeRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrganizeRequestError";
  }
}

function defaultBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
}

export async function organizeEntries(
  entries: readonly DiaryEntry[],
  options: OrganizeOptions = {}
): Promise<OrganizeResponse> {
  if (entries.length < 1 || entries.length > 20) {
    throw new OrganizeRequestError("整理请求必须包含 1 到 20 条日记");
  }
  const fetcher = options.fetcher ?? fetch;
  const baseUrl = (options.baseUrl ?? defaultBaseUrl()).replace(/\/$/, "");
  const response = await fetcher(`${baseUrl}/v1/organize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      consent: true,
      entries: entries.map(({ id, date, content }) => ({ id, date, content }))
    })
  });

  if (!response.ok) {
    throw new OrganizeApiError(response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("Invalid organize response");
  }

  const parsed = responseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("Invalid organize response");
  }
  return parsed.data;
}
