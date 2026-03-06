import { Router, Request, Response } from "express";
import { getDb } from "../db.js";
import type { CreateEmotionBody, CustomEmotion } from "../types.js";

const router = Router();

export function registerEmotionsRoutes(): Router {
  const db = getDb();

  const getAll = db.prepare<[]>("SELECT id, name, color, icon, description FROM custom_emotions ORDER BY name");
  const getById = db.prepare<[number]>("SELECT id, name, color, icon, description FROM custom_emotions WHERE id = ?");
  const insert = db.prepare(
    "INSERT INTO custom_emotions (name, color, icon, description) VALUES (?, ?, ?, ?)"
  );
  const deleteById = db.prepare<[number]>("DELETE FROM custom_emotions WHERE id = ?");

  router.get("/", (_req: Request, res: Response) => {
    try {
      const rows = getAll.all() as CustomEmotion[];
      res.json(rows);
    } catch (e) {
      console.error("GET /api/emotions", e);
      res.status(500).json({ error: "Failed to fetch emotions" });
    }
  });

  router.get("/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ error: "Invalid emotion id" });
    }
    try {
      const row = getById.get(id) as CustomEmotion | undefined;
      if (!row) return res.status(404).json({ error: "Emotion not found" });
      res.json(row);
    } catch (e) {
      console.error("GET /api/emotions/:id", e);
      res.status(500).json({ error: "Failed to fetch emotion" });
    }
  });

  router.post("/", (req: Request, res: Response) => {
    const body = req.body as CreateEmotionBody;
    const { name, color, icon, description } = body;
    if (!name || !color || !icon) {
      return res.status(400).json({ error: "Missing required fields: name, color, icon" });
    }
    try {
      insert.run(name.trim(), color, icon, description?.trim() ?? "");
      res.status(201).json({ success: true });
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return res.status(409).json({ error: "Emotion with this name already exists" });
      }
      console.error("POST /api/emotions", e);
      res.status(500).json({ error: "Failed to create emotion" });
    }
  });

  router.delete("/:id", (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 1) {
      return res.status(400).json({ error: "Invalid emotion id" });
    }
    try {
      const info = deleteById.run(id);
      if (info.changes === 0) return res.status(404).json({ error: "Emotion not found" });
      res.status(200).json({ success: true });
    } catch (e) {
      console.error("DELETE /api/emotions/:id", e);
      res.status(500).json({ error: "Failed to delete emotion" });
    }
  });

  return router;
}
