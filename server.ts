import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API Routes - Define these synchronously so they are available immediately
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Sistema DP API is running" });
});

async function setupDevServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  if (process.env.NODE_ENV !== "production" || (!process.env.VERCEL && !process.env.NETLIFY)) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

// Only setup dev server if not in production and not in serverless
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL && !process.env.NETLIFY) {
  setupDevServer();
}

export default app;
