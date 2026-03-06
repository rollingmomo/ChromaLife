import { Router, Request, Response } from "express";
import { getDb } from "../db.js";
import type { CreateJournalBody, DailyColor } from "../types.js";

const router = Router();
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(s: string): boolean {
  if (!DATE_REGEX.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

export function registerJournalRoutes(): Router {
  const db = getDb();

  const getAll = db.prepare<[]>("SELECT date, color, emotion, note FROM daily_colors ORDER BY date");
  const getByDate = db.prepare<[string]>("SELECT date, color, emotion, note FROM daily_colors WHERE date = ?");
  const upsert = db.prepare(`
    INSERT INTO daily_colors (date, color, emotion, note)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      color = excluded.color,
      emotion = excluded.emotion,
      note = excluded.note
  `);
  const deleteByDate = db.prepare<[string]>("DELETE FROM daily_colors WHERE date = ?");

  router.get("/", (_req: Request, res: Response) => {
    try {
      const rows = getAll.all() as DailyColor[];
      res.json(rows);
    } catch (e) {
      console.error("GET /api/journal", e);
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  router.get("/:date", (req: Request, res: Response) => {
    const { date } = req.params;
    if (!isValidDate(date)) {
      return res.status(400).json({ error: "Invalid date format (use YYYY-MM-DD)" });
    }
    try {
      const row = getByDate.get(date) as DailyColor | undefined;
      if (!row) return res.status(404).json({ error: "Entry not found" });
      res.json(row);
    } catch (e) {
      console.error("GET /api/journal/:date", e);
      res.status(500).json({ error: "Failed to fetch entry" });
    }
  });

  router.post("/", (req: Request, res: Response) => {
    const body = req.body as CreateJournalBody;
    const { date, color, emotion, note } = body;
    if (!date || !color || !emotion) {
      return res.status(400).json({ error: "Missing required fields: date, color, emotion" });
    }
    if (!isValidDate(date)) {
      return res.status(400).json({ error: "Invalid date format (use YYYY-MM-DD)" });
    }
    try {
      upsert.run(date, color, emotion, note ?? "");
      res.status(200).json({ success: true });
    } catch (e) {
      console.error("POST /api/journal", e);
      res.status(500).json({ error: "Failed to save entry" });
    }
  });

  router.delete("/:date", (req: Request, res: Response) => {
    const { date } = req.params;
    if (!isValidDate(date)) {
      return res.status(400).json({ error: "Invalid date format (use YYYY-MM-DD)" });
    }
    try {
      const info = deleteByDate.run(date);
      if (info.changes === 0) return res.status(404).json({ error: "Entry not found" });
      res.status(200).json({ success: true });
    } catch (e) {
      console.error("DELETE /api/journal/:date", e);
      res.status(500).json({ error: "Failed to delete entry" });
    }
  });

  return router;
}
