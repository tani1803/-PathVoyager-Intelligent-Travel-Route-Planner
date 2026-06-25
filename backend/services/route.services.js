/**
 * route.services.js
 *
 * Bridges the Node.js REST API to the C++ Dijkstra engine via
 * child_process IPC.
 *
 * Graph loading strategy (minimises API latency):
 *   • On first request, fetches ALL edges from MongoDB → builds in-memory cache.
 *   • Subsequent requests reuse the warm cache (zero DB overhead).
 *   • Cache is rebuilt by re-running: npm run seed
 *
 * IPC flow:
 *   1. Convert cached edges → CSV string
 *   2. Spawn  backend/route-engine/dijkstra[.exe]
 *   3. Pipe   CSV to child's stdin
 *   4. Parse  JSON path from child's stdout
 */

const { execFile } = require("child_process");
const path         = require("path");
const GraphEdge    = require("../models/GraphEdge");

// ── Binary path (platform-aware) ──────────────────────────────────────────────
const BINARY_NAME = process.platform === "win32" ? "dijkstra.exe" : "dijkstra";
const BINARY_PATH = path.join(__dirname, "..", "route-engine", BINARY_NAME);

// ── Valid preferences ─────────────────────────────────────────────────────────
const VALID_PREFERENCES = ["distance", "cost", "time"];
const UNIT_LABELS       = { distance: "km", cost: "₹", time: "min" };

// ── In-memory graph cache (loaded from MongoDB once at startup) ───────────────
let graphCSVCache  = null;
let citiesCache    = null;

/**
 * Build CSV string from a list of edge documents.
 * Format per line: from,to,distance,cost,time,transport
 */
const buildCSV = (edgeDocs) =>
  edgeDocs
    .map((e) => `${e.from},${e.to},${e.distance},${e.cost},${e.time},${e.transport}`)
    .join("\n");

/**
 * Load the complete weighted graph from MongoDB into memory.
 * Falls back to the local graphEdges.js if MongoDB is unreachable.
 * Called once on server startup.
 */
const loadGraphFromDB = async () => {
  let edgeDocs;

  try {
    edgeDocs = await GraphEdge.find({}).lean();
  } catch (dbErr) {
    console.warn("\n⚠  MongoDB unavailable — falling back to local graphEdges.js");
    console.warn("   Resume your Atlas cluster and run  npm run seed  for production.\n");
    edgeDocs = null;
  }

  // If DB empty or unreachable, fall back to local static file
  if (!edgeDocs || edgeDocs.length === 0) {
    const { edges } = require("../data/graphEdges");
    edgeDocs = edges.map((e) => ({
      from: e.from, to: e.to,
      distance: e.distance, cost: e.cost, time: e.time, transport: e.transport,
    }));
    console.warn(`   Using local graph: ${edgeDocs.length} edges loaded.\n`);
  }

  graphCSVCache = buildCSV(edgeDocs);

  const citySet = new Set();
  edgeDocs.forEach((e) => { citySet.add(e.from); citySet.add(e.to); });
  citiesCache = Array.from(citySet).sort();

  return { edgeCount: edgeDocs.length, cityCount: citiesCache.length };
};

/**
 * Calls the C++ Dijkstra binary with the cached graph CSV.
 *
 * @param {string} from       - Origin city
 * @param {string} to         - Destination city
 * @param {string} preference - "distance" | "cost" | "time"
 * @returns {Promise<Object>}
 */
const getRouteFromEngine = (from, to, preference = "distance") => {
  return new Promise((resolve, reject) => {
    if (!graphCSVCache) {
      return reject(new Error("Graph not loaded. Server may still be starting up."));
    }

    const pref = VALID_PREFERENCES.includes(preference) ? preference : "distance";

    const child = execFile(
      BINARY_PATH,
      [from, to, pref, "ALL"],
      { timeout: 8000 },
      (err, stdout, stderr) => {
        if (err) {
          if (err.code === "ENOENT") {
            return reject(new Error(
              `C++ binary not found at: ${BINARY_PATH}. Run  npm run compile  first.`
            ));
          }
          return reject(new Error(`Engine error: ${stderr || err.message}`));
        }

        const raw = stdout.trim();
        if (!raw) return reject(new Error("No output from Dijkstra engine."));

        let parsed;
        try { parsed = JSON.parse(raw); }
        catch (_) { return reject(new Error(`Invalid JSON from engine: ${raw}`)); }

        if (parsed.error) return reject(new Error(parsed.error));

        resolve({
          from,
          to,
          preference: pref,
          unit:       UNIT_LABELS[pref],
          path:       parsed.path,
          transports: parsed.transports,
          distance:   parsed.distance,
          cost:       parsed.cost,
          time:       parsed.time,
        });
      }
    );

    child.stdin.write(graphCSVCache);
    child.stdin.end();
  });
};

/** Returns sorted list of all cities in the loaded graph. */
const getCities = () => citiesCache || [];

module.exports = { loadGraphFromDB, getRouteFromEngine, getCities };
