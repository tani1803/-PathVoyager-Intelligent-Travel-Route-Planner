/**
 * drivePairs.js
 *
 * City pairs that have road (Drive) connections.
 * Distances, times, and costs for these pairs are NOT hardcoded here —
 * they are fetched from OpenRouteService during  npm run seed  and
 * persisted to MongoDB.
 *
 * This means Drive routes only appear in the graph AFTER seeding.
 * ORS is the single source of truth for all driving distances.
 */

const CITY_COORDS = {
  Delhi:       { lon: 77.2090, lat: 28.6139 },
  Agra:        { lon: 78.0081, lat: 27.1767 },
  Jaipur:      { lon: 75.7873, lat: 26.9124 },
  Lucknow:     { lon: 80.9462, lat: 26.8467 },
  Haridwar:    { lon: 78.1642, lat: 29.9457 },
  Dehradun:    { lon: 78.0322, lat: 30.3165 },
  Chandigarh:  { lon: 76.7794, lat: 30.7333 },
  Amritsar:    { lon: 74.8723, lat: 31.6340 },
  Mumbai:      { lon: 72.8777, lat: 19.0760 },
  Pune:        { lon: 73.8567, lat: 18.5204 },
  Nashik:      { lon: 73.7898, lat: 19.9975 },
  Surat:       { lon: 72.8311, lat: 21.1702 },
  Ahmedabad:   { lon: 72.5714, lat: 23.0225 },
  Bangalore:   { lon: 77.5946, lat: 12.9716 },
  Chennai:     { lon: 80.2707, lat: 13.0827 },
  Hyderabad:   { lon: 78.4867, lat: 17.3850 },
  Cochin:      { lon: 76.2673, lat:  9.9312 },
  Coimbatore:  { lon: 76.9558, lat: 11.0168 },
  Kolkata:     { lon: 88.3639, lat: 22.5726 },
  Bhubaneswar: { lon: 85.8245, lat: 20.2961 },
};

// City pairs for which ORS driving distances will be fetched.
// Each pair produces two bidirectional Drive edges in MongoDB.
const DRIVE_PAIRS = [
  ["Delhi",       "Agra"],
  ["Delhi",       "Jaipur"],
  ["Delhi",       "Haridwar"],
  ["Delhi",       "Chandigarh"],
  ["Haridwar",    "Dehradun"],
  ["Chandigarh",  "Amritsar"],
  ["Agra",        "Jaipur"],
  ["Mumbai",      "Pune"],
  ["Mumbai",      "Nashik"],
  ["Mumbai",      "Surat"],
  ["Surat",       "Ahmedabad"],
  ["Pune",        "Nashik"],
  ["Bangalore",   "Chennai"],
  ["Bangalore",   "Coimbatore"],
  ["Coimbatore",  "Cochin"],
  ["Chennai",     "Hyderabad"],
  ["Hyderabad",   "Bangalore"],
  ["Kolkata",     "Bhubaneswar"],
];

module.exports = { DRIVE_PAIRS, CITY_COORDS };
