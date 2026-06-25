const express = require("express");
const router = express.Router();

const { getRouteFromEngine } = require("../services/route.services");
const { validateRoute } =require("../middleware/validateRoute");
const { successResponse, errorResponse } = require("../utils/responseHelper");
const logger = require("../utils/logger");

const VALID_PREFERENCES = ["distance", "time", "cost"];

router.get("/route", validateRoute, async (req, res) => {

  const { from, to, preference } = req.query;

  // Validate preference or default to distance
  const pref = VALID_PREFERENCES.includes(preference) ? preference : "distance";

  try {

    const result = await getRouteFromEngine(from, to, pref);

    res.json({
      from,
      to,
      preference: pref,
      legs: result.legs,
      total: result.total
    });

  } catch (err) {
    console.error("DEBUG ERROR:", err);
    // Force the exact error to be returned to the frontend
    const errorText = err && err.message ? err.message : String(err);
    
    return res.status(400).json({
      success: false,
      error: {
        code: "ROUTING_ERROR",
        message: errorText
      }
    });
  }

});

module.exports = router;
