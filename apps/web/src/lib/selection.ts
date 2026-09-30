import type { DiaryEntry } from "../storage/db";

export interface SelectionSummary {
  count: number;
  characters: number;
}

export function toggleSelection(selectedIds: ReadonlySet<string>, entryId: string): Set<string> {
  const next = new Set(selectedIds);
  if (next.has(entryId)) {
    next.delete(entryId);
  } else {
    next.add(entryId);
  }
  return next;
}

export function getSelectedEntries(
  entries: readonly DiaryEntry[],
  selectedIds: ReadonlySet<string>
): DiaryEntry[] {
  return entries.filter((entry) => selectedIds.has(entry.id));
}

export function getSelectionSummary(
  entries: readonly DiaryEntry[],
  selectedIds: ReadonlySet<string>
): SelectionSummary {
  const selectedEntries = getSelectedEntries(entries, selectedIds);
  return {
    count: selectedEntries.length,
    characters: selectedEntries.reduce((total, entry) => total + Array.from(entry.content).length, 0)
  };
}
