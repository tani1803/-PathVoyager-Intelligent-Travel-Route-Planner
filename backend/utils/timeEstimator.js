// ─── DRIVING TIME CONFIG ───────────────────────────────────────────
const avgDriveSpeedKmh = 60;    // average road speed (change to update all drive time estimates)

// ─── FLIGHT TIME CONFIG ────────────────────────────────────────────
const cruisingSpeedKmh    = 800; // average commercial jet speed in km/h
const airportOverheadHrs  = 2;   // fixed hours added for check-in, boarding, taxiing etc.

// ──────────────────────────────────────────────────────────────────

/**
 * Estimate driving time for a road leg.
 * Used as a fallback when the ORS API cannot provide real road time.
 * @param {number} distanceKm - Straight-line (Haversine) distance in km
 * @returns {number} Estimated time in hours
 */
exports.estimateDriveTime = (distanceKm) => {
  return parseFloat((distanceKm / avgDriveSpeedKmh).toFixed(2));
};

/**
 * Estimate total flight duration including airport overhead.
 * @param {number} distanceKm - Straight-line distance between airports in km
 * @returns {number} Total time in hours (flight time + airport overhead)
 */
exports.estimateFlightTime = (distanceKm) => {
  const flightHours = distanceKm / cruisingSpeedKmh;
  return parseFloat((flightHours + airportOverheadHrs).toFixed(2));
};
