import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { registerJournalRoutes } from "./server/routes/journal.js";
import { registerEmotionsRoutes } from "./server/routes/emotions.js";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.use("/api/journal", registerJournalRoutes());
  app.use("/api/emotions", registerEmotionsRoutes());

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
