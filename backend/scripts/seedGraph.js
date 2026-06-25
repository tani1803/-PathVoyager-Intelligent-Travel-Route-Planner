/**
 * seedGraph.js
 *
 * Data-seeding script — automates 100% of graph construction:
 *
 *   1. Loads the static edge definitions from graphEdges.js
 *   2. For key short-haul city pairs, calls OpenRouteService to fetch
 *      real-world driving distances & durations (enriches edge accuracy).
 *   3. Upserts all edges into MongoDB (GraphEdge collection).
 *
 * Run once (or whenever the graph needs rebuilding):
 *
 *   npm run seed
 *
 * The route service then loads the complete graph from MongoDB at startup,
 * caching it in memory so every subsequent request hits zero DB overhead.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const mongoose  = require("mongoose");
const axios     = require("axios");
const connectDB = require("../db/db");
const GraphEdge = require("../models/GraphEdge");
const { edges } = require("../data/graphEdges");

const { DRIVE_PAIRS, CITY_COORDS } = require("../data/drivePairs");

// ── ORS: fetch real driving distance & duration ───────────────────────────────
const fetchDrivingEdge = async (from, to) => {
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) return null;

  const { lon: lonFrom, lat: latFrom } = CITY_COORDS[from];
  const { lon: lonTo,   lat: latTo   } = CITY_COORDS[to];

  try {
    const res = await axios.post(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      { coordinates: [[lonFrom, latFrom], [lonTo, latTo]] },
      { headers: { Authorization: apiKey, "Content-Type": "application/json" }, timeout: 6000 }
    );

    const summary = res.data.features
      ? res.data.features[0].properties.summary
      : res.data.routes[0].summary;

    const distanceKm = Math.round(summary.distance / 1000);
    const timeMin    = Math.round(summary.duration  / 60);
    // Driving cost estimate: ₹7/km (fuel + tolls)
    const cost       = Math.round(distanceKm * 7);

    return { distance: distanceKm, cost, time: timeMin, transport: "D" };
  } catch (err) {
    console.warn(`  ⚠ ORS failed for ${from}→${to}: ${err.message} (skipping)`);
    return null;
  }
};

// ── Main seeding function ─────────────────────────────────────────────────────
const seed = async () => {
  await connectDB();
  console.log("\n🌱  PathVoyager — Graph Seeding Script");
  console.log("══════════════════════════════════════\n");

  // 1. Wipe existing graph
  const deleted = await GraphEdge.deleteMany({});
  console.log(`🗑  Cleared ${deleted.deletedCount} existing edges.\n`);

  // 2. Build edge array from static definitions
  const toInsert = edges.map((e) => ({
    from:      e.from,
    to:        e.to,
    distance:  e.distance,
    cost:      e.cost,
    time:      e.time,
    transport: e.transport,
  }));

  // 3. Enrich with real ORS driving data for key short-haul pairs
  console.log("🗺  Fetching driving distances from OpenRouteService...");
  for (const [from, to] of DRIVE_PAIRS) {
    process.stdout.write(`   ${from} → ${to} ... `);
    const driveEdge = await fetchDrivingEdge(from, to);
    if (driveEdge) {
      // Add Drive edge in both directions
      toInsert.push({ from, to, ...driveEdge });
      toInsert.push({ from: to, to: from, ...driveEdge });
      console.log(`✅  ${driveEdge.distance} km / ${driveEdge.time} min / ₹${driveEdge.cost}`);
    } else {
      console.log("⏭  skipped");
    }
  }

  // 4. Bulk-insert into MongoDB
  console.log(`\n💾  Inserting ${toInsert.length} edges into MongoDB...`);
  await GraphEdge.insertMany(toInsert, { ordered: false });

  const total = await GraphEdge.countDocuments();
  console.log(`\n✅  Seeding complete — ${total} edges stored in MongoDB.\n`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error("\n❌  Seeding failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
