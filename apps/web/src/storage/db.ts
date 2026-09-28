import Dexie, { type Table } from "dexie";

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  createdAt: string;
}

class DiaryDatabase extends Dexie {
  entries!: Table<DiaryEntry, string>;

  constructor() {
    super("woshen");
    this.version(1).stores({ entries: "id, date, createdAt" });
  }
}

export const db = new DiaryDatabase();
