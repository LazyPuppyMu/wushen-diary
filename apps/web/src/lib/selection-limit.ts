const MAX_SELECTED_ENTRIES = 20;

export function canSelectMore(selectedIds: ReadonlySet<string>, entryId: string): boolean {
  return selectedIds.has(entryId) || selectedIds.size < MAX_SELECTED_ENTRIES;
}

export function toggleSelectionWithLimit(selectedIds: ReadonlySet<string>, entryId: string): Set<string> {
  if (!canSelectMore(selectedIds, entryId)) return new Set(selectedIds);
  const next = new Set(selectedIds);
  if (next.has(entryId)) next.delete(entryId);
  else next.add(entryId);
  return next;
}

export { MAX_SELECTED_ENTRIES };
