import { FormEvent, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { organizeAfterConfirmation } from "../lib/confirmation";
import { filterEntriesByDate, isEntryHiddenByDateFilter } from "../lib/date-filter";
import { matchesEvidence, toUtf16Range } from "../lib/evidence";
import { buildMarkdownExport } from "../lib/local-data";
import { organizeEntries, OrganizeApiError, OrganizeRequestError } from "../lib/organize";
import { getSelectionSummary } from "../lib/selection";
import { canSelectMore, toggleSelectionWithLimit } from "../lib/selection-limit";
import { partitionResults, type ResultPartition } from "../lib/result-validation";
import { createRequestGate } from "../lib/request-gate";
import { db, type DiaryEntry } from "../storage/db";

const entrySchema = z.object({
  date: z.string().min(1),
  content: z.string().trim().min(1, "先写下一句话").max(10000, "单条日记最多 10000 字")
});

function localDate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date(`${value}T00:00:00`));
}

const categoryLabels: Record<string, string> = {
  joy: "喜悦",
  fulfillment: "满足",
  reflection: "感悟",
  improvement: "改进",
  gratitude: "感激",
  weight: "沉重",
  murmur: "低语"
};

const confidenceLabels: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
  insufficient: "证据不足"
};

function confirmationText(summary: { count: number; earliestDate: string; latestDate: string; characters: number }): string {
  return [
    `将发送 ${summary.count} 条日记（${summary.earliestDate} 至 ${summary.latestDate}，共 ${summary.characters} 字）给 AI 服务。`,
    "只有所选内容会用于本次整理。确认发送吗？"
  ].join("\n");
}

function errorMessage(error: unknown): string {
  if (error instanceof OrganizeRequestError) {
    return error.message;
  }
  if (error instanceof OrganizeApiError && error.status === 503) {
    return "AI 整理服务尚未配置（503），日记仍保存在此设备。";
  }
  if (error instanceof OrganizeApiError) {
    if (error.status === 422) {
      return "所选记录不符合整理请求要求，请检查内容和日期。";
    }
    return `整理服务暂时不可用（${error.status}），日记仍保存在此设备。`;
  }
  if (error instanceof TypeError) {
    return "无法连接整理服务，请检查后端是否启动。日记仍保存在此设备。";
  }
  return "整理结果无法通过校验，请重试。日记仍保存在此设备。";
}

export default function App() {
  const [date, setDate] = useState(localDate);
  const [content, setContent] = useState("");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [organizeResult, setOrganizeResult] = useState<ResultPartition | null>(null);
  const [pendingEvidenceTarget, setPendingEvidenceTarget] = useState<{ entryId: string; start: number; end: number } | null>(null);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [status, setStatus] = useState("");
  const entryElements = useRef(new Map<string, HTMLLIElement>());
  const requestGate = useRef(createRequestGate());
  const isChangingEntries = useRef(false);

  const selectionSummary = getSelectionSummary(entries, selectedIds);
  const visibleEntries = filterEntriesByDate(entries, fromDate, toDate);

  useEffect(() => {
    if (!pendingEvidenceTarget) return;
    if (!visibleEntries.some(({ id }) => id === pendingEvidenceTarget.entryId)) return;
    focusEvidence(pendingEvidenceTarget.entryId, pendingEvidenceTarget.start, pendingEvidenceTarget.end);
    setPendingEvidenceTarget(null);
  }, [pendingEvidenceTarget, visibleEntries]);

  async function refreshEntries() {
    const saved = await db.entries.orderBy("createdAt").reverse().toArray();
    setEntries(saved);
  }

  useEffect(() => {
    void refreshEntries();
  }, []);

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = entrySchema.safeParse({ date, content });
    if (!parsed.success) {
      setStatus(parsed.error.issues[0]?.message ?? "请检查日记内容");
      return;
    }

    try {
      await db.entries.add({
        id: crypto.randomUUID(),
        date: parsed.data.date,
        content: parsed.data.content,
        createdAt: new Date().toISOString()
      });
      setContent("");
      setStatus("已保存在此设备");
      await refreshEntries();
    } catch {
      setStatus("保存失败，请重试");
    }
  }

  async function deleteEntry(entry: DiaryEntry) {
    if (isChangingEntries.current || isOrganizing || !window.confirm("删除这条日记？此操作无法撤销。")) return;
    isChangingEntries.current = true;
    requestGate.current.invalidate();
    try {
      await db.entries.delete(entry.id);
      setOrganizeResult(null);
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(entry.id);
        return next;
      });
      setStatus("记录已删除");
      await refreshEntries();
    } finally {
      isChangingEntries.current = false;
    }
  }

  async function clearEntries() {
    if (entries.length === 0 || isChangingEntries.current || isOrganizing || !window.confirm("清空此设备上的全部日记？此操作无法撤销。")) return;
    isChangingEntries.current = true;
    requestGate.current.invalidate();
    try {
      await db.entries.clear();
      setSelectedIds(new Set());
      setOrganizeResult(null);
      setStatus("已清空此设备上的全部日记");
      await refreshEntries();
    } finally {
      isChangingEntries.current = false;
    }
  }

  async function exportEntries() {
    const saved = await db.entries.orderBy("date").reverse().toArray();
    const blob = new Blob([buildMarkdownExport(saved)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `wushen-diary-${localDate()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("已导出本地日记");
  }

  async function organizeSelectedEntries() {
    const selectedEntries = entries.filter((entry) => selectedIds.has(entry.id));
    if (selectedEntries.length === 0 || selectedEntries.length > 20 || isChangingEntries.current || isOrganizing) return;

    setStatus("");
    setOrganizeResult(null);
    setIsOrganizing(true);
    const request = requestGate.current.begin();
    try {
      const response = await organizeAfterConfirmation(
        selectedEntries,
        (summary) => window.confirm(confirmationText(summary)),
        organizeEntries
      );
      if (response && requestGate.current.isCurrent(request)) {
        const result = partitionResults(response, selectedEntries);
        setOrganizeResult(result);
        setStatus(`整理完成：${result.verified.length} 条结论，${result.pending.length} 条待复核`);
      }
    } catch (error) {
      setStatus(errorMessage(error));
    } finally {
      setIsOrganizing(false);
    }
  }

  function jumpToEvidence(entryId: string, start: number, end: number) {
    const entry = entries.find((item) => item.id === entryId);
    if (!entry) return;
    if (isEntryHiddenByDateFilter(entries, fromDate, toDate, entryId)) {
      setPendingEvidenceTarget({ entryId, start, end });
      setFromDate("");
      setToDate("");
      return;
    }
    focusEvidence(entryId, start, end);
  }

  function focusEvidence(entryId: string, start: number, end: number) {
    const entry = entries.find((item) => item.id === entryId);
    const element = entryElements.current.get(entryId);
    if (!entry || !element) return;
    const range = toUtf16Range(entry.content, start, end);
    const contentElement = element.querySelector<HTMLElement>("[data-entry-content]");
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    contentElement?.focus({ preventScroll: true });
    if (contentElement) {
      const selection = window.getSelection();
      const textNode = contentElement.firstChild;
      if (selection && textNode) {
        const domRange = document.createRange();
        domRange.setStart(textNode, range.start);
        domRange.setEnd(textNode, range.end);
        selection.removeAllRanges();
        selection.addRange(domRange);
      }
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="吾身首页">吾身</a>
        <span className="local-status"><span aria-hidden="true" />仅保存在此设备</span>
      </header>

      <div className="workspace">
        <section className="composer" aria-labelledby="page-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">写下此刻</p>
              <h1 id="page-title">今天，留下些什么？</h1>
            </div>
            <span className="today-label">{displayDate(localDate())}</span>
          </div>

          <form onSubmit={saveEntry}>
            <label className="date-field">
              <span>记录日期</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label className="visually-hidden" htmlFor="entry-content">日记内容</label>
            <textarea
              id="entry-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="不用整理，照着自己的节奏写。"
              maxLength={10000}
              rows={9}
            />
            <div className="composer-footer">
              <span className="save-status" role="status">{status || ""}</span>
              <button className="save-button" type="submit">保存日记</button>
            </div>
          </form>
        </section>

        <section className="entries" aria-labelledby="entries-title">
          <div className="entries-heading">
            <div>
              <h2 id="entries-title">日记</h2>
              <span>{entries.length} 条</span>
            </div>
            <div className="local-actions">
              <button type="button" className="text-button" onClick={() => void exportEntries()} disabled={entries.length === 0}>导出</button>
              <button type="button" className="text-button danger" onClick={() => void clearEntries()} disabled={entries.length === 0 || isOrganizing}>清空</button>
            </div>
          </div>
          <p className="selection-summary" role="status">已选 {selectionSummary.count} 条 · {selectionSummary.characters} 字</p>
          <div className="date-filters" aria-label="按日期筛选">
            <label>从 <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
            <label>到 <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
          </div>
          <div className="organize-bar">
            <p>{selectionSummary.count > 0 ? `已选择 ${selectionSummary.count} 条，共 ${selectionSummary.characters} 字` : "选择日记后整理"}</p>
            <button
              className="organize-button"
              type="button"
              disabled={selectionSummary.count === 0 || isOrganizing}
              onClick={() => void organizeSelectedEntries()}
            >{isOrganizing ? "整理中…" : "整理所选"}</button>
          </div>
          <p className="save-status" role="status">{status}</p>
          {entries.length === 0 ? (
            <p className="empty-state">还没有记录</p>
          ) : visibleEntries.length === 0 ? (
            <p className="empty-state">此日期范围内没有记录</p>
          ) : (
            <ul className="entry-list">
              {visibleEntries.map((entry) => (
                <li className="entry" key={entry.id} ref={(element) => {
                  if (element) entryElements.current.set(entry.id, element);
                  else entryElements.current.delete(entry.id);
                }}>
                  <div className="entry-meta">
                    <time dateTime={entry.date}>{displayDate(entry.date)}</time>
                    <div className="entry-actions">
                      <label className="entry-select">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(entry.id)}
                          onChange={() => {
                            if (!canSelectMore(selectedIds, entry.id)) {
                              setStatus("最多选择 20 条日记");
                              return;
                            }
                            setSelectedIds((current) => toggleSelectionWithLimit(current, entry.id));
                          }}
                        />
                        <span>选择</span>
                      </label>
                      <button
                        className="delete-button"
                        type="button"
                        disabled={isOrganizing}
                        onClick={() => void deleteEntry(entry)}
                        aria-label={`删除 ${displayDate(entry.date)} 的日记`}
                      >删除</button>
                    </div>
                  </div>
                  <p data-entry-content tabIndex={-1}>{entry.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {organizeResult && (
          <section className="results" aria-labelledby="results-title">
            <h2 id="results-title">整理结果</h2>
            {organizeResult.verified.length === 0 ? (
              <p className="empty-state">没有找到有充分原文证据的结论。</p>
            ) : (
              <ul className="result-list">
                {organizeResult.verified.map((item, index) => (
                  <li className="result-item" key={`${item.category}-${index}`}>
                    <div className="result-meta">
                      <span>{categoryLabels[item.category]}</span>
                      <span>{item.type === "fact" ? "事实" : "推断"}</span>
                      <span>置信度：{confidenceLabels[item.confidence]}</span>
                    </div>
                    <p>{item.text}</p>
                    {item.evidence.map((evidence, evidenceIndex) => {
                      const entry = entries.find(({ id }) => id === evidence.entry_id);
                      const valid = Boolean(entry && matchesEvidence(entry.content, evidence));
                      return valid ? (
                        <button
                          className="evidence-link"
                          type="button"
                          key={`${evidence.entry_id}-${evidence.start}-${evidenceIndex}`}
                          onClick={() => jumpToEvidence(evidence.entry_id, evidence.start, evidence.end)}
                        >“{evidence.quote}” · 查看原文</button>
                      ) : (
                        <p className="unverified-evidence" key={`${evidence.entry_id}-${evidenceIndex}`}>
                          待复核：{evidence.quote}
                        </p>
                      );
                    })}
                  </li>
                ))}
              </ul>
            )}
            {organizeResult.pending.length > 0 && (
              <div className="pending-results">
                <h3>待复核</h3>
                {organizeResult.pending.map((item, index) => (
                  <p key={`${item.category}-pending-${index}`}>{item.text}：原文引用未通过本地复核。</p>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
