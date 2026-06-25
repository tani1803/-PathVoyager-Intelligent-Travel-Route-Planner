const { errorResponse } = require("../utils/responseHelper");
const logger = require("../utils/logger");

const VALID_PREFERENCES = ["distance", "time", "cost"];

exports.validateRoute = (req, res, next) => {
  const { from, to, preference } = req.query;

  // 1. Check required fields
  if (!from || !to) {
    logger.warn("Missing required parameters", { from, to });
    return errorResponse(
      res,
      "MISSING_PARAMS",
      "Both 'from' and 'to' query parameters are required",
      400
    );
  }

  // 2. Sanitize — only letters, spaces, hyphens
  const safe = (str) => /^[a-zA-Z\s\-]+$/.test(str.trim());
  if (!safe(from) || !safe(to)) {
    logger.warn("Invalid characters in city name", { from, to });
    return errorResponse(
      res,
      "INVALID_INPUT",
      "City names must contain only letters, spaces, or hyphens",
      400
    );
  }

  // 3. Check same city
  if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
    logger.warn("Source and destination are the same", { from, to });
    return errorResponse(
      res,
      "SAME_CITY",
      "Source and destination cannot be the same city",
      400
    );
  }

  // 4. Validate preference — default to distance if missing/invalid
  if (preference && !VALID_PREFERENCES.includes(preference)) {
    logger.warn("Invalid preference, defaulting to distance", { preference });
    req.query.preference = "distance";
  }

  next();
};
