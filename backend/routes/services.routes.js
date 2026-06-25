const express = require("express");
const router  = express.Router();

const { getRouteFromEngine, getCities } = require("../services/route.services");
const { validateRoute }                 = require("../middleware/validateRoute");
const { errorResponse }                 = require("../utils/responseHelper");
const logger                            = require("../utils/logger");

// ── GET /api/route ────────────────────────────────────────────────────────────
// Query params: from, to, preference (distance | cost | time)
router.get("/route", validateRoute, async (req, res) => {
  const { from, to, preference } = req.query;

  logger.info("Route request", { from, to, preference });

  try {
    const result = await getRouteFromEngine(from, to, preference);

    return res.json({
      success:    true,
      from:       result.from,
      to:         result.to,
      preference: result.preference,
      unit:       result.unit,
      path:       result.path,
      transports: result.transports,
      distance:   result.distance,
      cost:       result.cost,
      time:       result.time,
    });

  } catch (err) {
    logger.error("Routing failed", { error: err.message });
    return res.status(400).json({
      success: false,
      error: {
        code:    "ROUTING_ERROR",
        message: err.message,
      },
    });
  }
});

// ── GET /api/cities ───────────────────────────────────────────────────────────
// Returns all city names in the graph (used for frontend autocomplete)
router.get("/cities", (req, res) => {
  return res.json({ success: true, cities: getCities() });
});

module.exports = router;
