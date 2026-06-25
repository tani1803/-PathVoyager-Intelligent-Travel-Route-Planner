/**
 * server.js
 * Application entry point.
 *
 * Startup sequence:
 *   1. Load environment variables
 *   2. Connect to MongoDB
 *   3. Load weighted graph into memory (from MongoDB cache)
 *   4. Start Express HTTP server
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const express    = require("express");
const cors       = require("cors");
const connectDB  = require("./db/db");
const logger     = require("./utils/logger");
const { loadGraphFromDB } = require("./services/route.services");
const serviceRouter = require("./routes/services.routes");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Request logger ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info("Incoming request", { method: req.method, url: req.url, query: req.query });
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", serviceRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } });
});

// ── Bootstrap ─────────────────────────────────────────────────────────────────
const bootstrap = async () => {
  // 1. Connect to MongoDB (non-fatal — service falls back to local graph if unavailable)
  try {
    await connectDB();
  } catch (err) {
    console.warn(`\n⚠  MongoDB connection failed: ${err.message}`);
    console.warn("   Running in local-graph mode. Run  npm run seed  once Atlas is reachable.\n");
  }

  // 2. Warm up the in-memory graph cache (MongoDB or local fallback)
  const { edgeCount, cityCount } = await loadGraphFromDB();
  logger.info("Graph loaded into memory", { edgeCount, cityCount });

  // 3. Start HTTP server
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`\n🚀  PathVoyager backend  →  http://localhost:${PORT}`);
    console.log(`    Graph: ${edgeCount} edges | ${cityCount} cities | C++ Dijkstra ready\n`);
  });
};

bootstrap().catch((err) => {
  console.error("\n❌  Fatal startup error:", err.message);
  process.exit(1);
});