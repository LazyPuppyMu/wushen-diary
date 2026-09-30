import type { DiaryEntry } from "../storage/db";

export function filterEntriesByDate(
  entries: readonly DiaryEntry[],
  fromDate: string,
  toDate: string
): DiaryEntry[] {
  return entries.filter((entry) => {
    const afterStart = !fromDate || entry.date >= fromDate;
    const beforeEnd = !toDate || entry.date <= toDate;
    return afterStart && beforeEnd;
  });
}

export function isEntryHiddenByDateFilter(
  entries: readonly DiaryEntry[],
  fromDate: string,
  toDate: string,
  entryId: string
): boolean {
  return entries.some(({ id }) => id === entryId) &&
    !filterEntriesByDate(entries, fromDate, toDate).some(({ id }) => id === entryId);
}
