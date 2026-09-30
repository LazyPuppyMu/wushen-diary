import type { DiaryEntry } from "../storage/db";
import type { OrganizeResponse } from "./organize";
import { matchesEvidence } from "./evidence";

export interface ResultPartition {
  verified: OrganizeResponse["items"];
  pending: OrganizeResponse["items"];
}

export function partitionResults(
  response: OrganizeResponse,
  submittedEntries: readonly DiaryEntry[]
): ResultPartition {
  const submittedById = new Map(submittedEntries.map((entry) => [entry.id, entry]));
  const verified: OrganizeResponse["items"] = [];
  const pending: OrganizeResponse["items"] = [];

  for (const item of response.items) {
    const isVerified = item.evidence.every((evidence) => {
      const entry = submittedById.get(evidence.entry_id);
      return Boolean(entry && matchesEvidence(entry.content, evidence));
    });
    (isVerified ? verified : pending).push(item);
  }

  return { verified, pending };
}
