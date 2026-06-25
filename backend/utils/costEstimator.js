// ─── DRIVING COST CONFIG ───────────────────────────────────────────
const fuelPrice = 100;       // ₹ per litre
const mileage = 17;        // km per litre (change this to update all drive costs)

// ─── FLIGHT COST CONFIG ────────────────────────────────────────────
const flightRatePerKm = 5;    // ₹ per km of flight distance
const nonHubSurcharge = 4000; // ₹ extra per non-hub airport (regional airports cost more)

// ──────────────────────────────────────────────────────────────────

/**
 * Estimate fuel cost for a road leg.
 * @param {number} distanceKm
 * @returns {number} Cost in ₹
 */
exports.estimateDriveCost = (distanceKm) => {
  const fuelUsed = distanceKm / mileage;
  return parseFloat((fuelUsed * fuelPrice).toFixed(2));
};

/**
 * Estimate flight ticket cost.
 * @param {number} distanceKm    - Straight-line distance between airports
 * @param {boolean} originIsHub  - Is departure airport a major hub?
 * @param {boolean} destIsHub    - Is arrival airport a major hub?
 * @returns {number} Cost in ₹
 */
exports.estimateFlightCost = (distanceKm, originIsHub = true, destIsHub = true) => {
  let cost = distanceKm * flightRatePerKm;
  if (!originIsHub) cost += nonHubSurcharge;
  if (!destIsHub) cost += nonHubSurcharge;
  return parseFloat(cost.toFixed(2));
};

// Legacy alias — keeps graphBuilder.js working without changes
exports.estimateCost = exports.estimateDriveCost;