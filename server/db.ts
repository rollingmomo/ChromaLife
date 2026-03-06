import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "journal.db");
let db: Database.Database | null = null;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS daily_colors (
    date TEXT PRIMARY KEY,
    color TEXT NOT NULL,
    emotion TEXT NOT NULL,
    note TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS custom_emotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_daily_colors_date ON daily_colors(date);
  CREATE INDEX IF NOT EXISTS idx_custom_emotions_name ON custom_emotions(name);
`;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("foreign_keys = ON");
    db.exec(SCHEMA);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
