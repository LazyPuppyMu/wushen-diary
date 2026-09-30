import type { DiaryEntry } from "../storage/db";

export interface ConfirmationSummary {
  count: number;
  earliestDate: string;
  latestDate: string;
  characters: number;
}

export function summarizeEntries(entries: readonly DiaryEntry[]): ConfirmationSummary {
  const dates = entries.map(({ date }) => date).sort();
  return {
    count: entries.length,
    earliestDate: dates[0] ?? "",
    latestDate: dates.at(-1) ?? "",
    characters: entries.reduce((total, entry) => total + Array.from(entry.content).length, 0)
  };
}

export async function organizeAfterConfirmation<T>(
  entries: readonly DiaryEntry[],
  confirm: (summary: ConfirmationSummary) => boolean,
  organize: (selected: readonly DiaryEntry[]) => Promise<T>
): Promise<T | null> {
  if (entries.length === 0 || !confirm(summarizeEntries(entries))) {
    return null;
  }
  return organize(entries);
}
