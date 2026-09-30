import type { DiaryEntry } from "../storage/db";

export function buildMarkdownExport(entries: readonly DiaryEntry[]): string {
  const sections = entries.map((entry) => `## ${entry.date}\n\n${entry.content}`);
  return sections.length > 0 ? `# 吾身日记\n\n${sections.join("\n\n")}\n` : "# 吾身日记\n";
}
