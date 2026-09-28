import { FormEvent, useEffect, useState } from "react";
import { z } from "zod";
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

export default function App() {
  const [date, setDate] = useState(localDate);
  const [content, setContent] = useState("");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [status, setStatus] = useState("");

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
    if (!window.confirm("删除这条日记？此操作无法撤销。")) return;
    await db.entries.delete(entry.id);
    setStatus("记录已删除");
    await refreshEntries();
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
            <h2 id="entries-title">日记</h2>
            <span>{entries.length} 条</span>
          </div>
          {entries.length === 0 ? (
            <p className="empty-state">还没有记录</p>
          ) : (
            <ul className="entry-list">
              {entries.map((entry) => (
                <li className="entry" key={entry.id}>
                  <div className="entry-meta">
                    <time dateTime={entry.date}>{displayDate(entry.date)}</time>
                    <button
                      className="delete-button"
                      type="button"
                      onClick={() => void deleteEntry(entry)}
                      aria-label={`删除 ${displayDate(entry.date)} 的日记`}
                    >删除</button>
                  </div>
                  <p>{entry.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
