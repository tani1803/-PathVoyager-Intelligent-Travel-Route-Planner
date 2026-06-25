const axios = require("axios");

const VALID_PREFERENCES = ["distance", "time", "cost"];

// Load extended airport database
const AIRPORTS = require("../data/airports");

// Local geocoding database — works offline, no external API needed
const CITIES = require("../data/cities");

// Utility estimators — edit these files to change cost/time assumptions
const { estimateDriveCost, estimateFlightCost } = require("../utils/costEstimator");
const { estimateDriveTime, estimateFlightTime } = require("../utils/timeEstimator");

// ── Haversine: straight-line distance between two [lon, lat] points in km ──
const haversine = (lon1, lat1, lon2, lat2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Find the best airport pair scored by the given preference ──
const findBestAirports = (startCoord, endCoord, pref) => {
  let bestPair = null;
  let bestScore = Infinity;

  // Top 5 nearest airports to each endpoint
  const sortedOrigin = AIRPORTS
    .map(a => ({ airport: a, dist: haversine(startCoord.lon, startCoord.lat, a.lon, a.lat) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 5);

  const sortedDest = AIRPORTS
    .map(a => ({ airport: a, dist: haversine(endCoord.lon, endCoord.lat, a.lon, a.lat) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 5);

  for (const o of sortedOrigin) {
    for (const d of sortedDest) {
      if (o.airport.code === d.airport.code) continue;

      const driveDist1  = o.dist;
      const flightDist  = haversine(o.airport.lon, o.airport.lat, d.airport.lon, d.airport.lat);
      const driveDist2  = d.dist;

      const totalDist = driveDist1 + flightDist + driveDist2;
      const totalTime = estimateDriveTime(driveDist1) + estimateFlightTime(flightDist) + estimateDriveTime(driveDist2);
      const totalCost = estimateDriveCost(driveDist1) + estimateFlightCost(flightDist, o.airport.hub, d.airport.hub) + estimateDriveCost(driveDist2);

      const score = pref === "time" ? totalTime : pref === "cost" ? totalCost : totalDist;

      if (score < bestScore) {
        bestScore = score;
        bestPair  = { origin: o.airport, dest: d.airport };
      }
    }
  }

  return bestPair;
};

// ── Try to get a real driving route from OpenRouteService ──
const getDrivingRoute = async (startLon, startLat, endLon, endLat, apiKey) => {
  const res = await axios.post(
    "https://api.openrouteservice.org/v2/directions/driving-car",
    { coordinates: [[startLon, startLat], [endLon, endLat]] },
    { headers: { "Content-Type": "application/json", Authorization: apiKey }, timeout: 4000 }
  );
  let summary;
  if (res.data.features) {
    summary = res.data.features[0].properties.summary;
  } else if (res.data.routes) {
    summary = res.data.routes[0].summary;
  }
  return {
    distanceKm: parseFloat((summary.distance / 1000).toFixed(2)),
    timeHours:  parseFloat((summary.duration / 3600).toFixed(2)),
  };
};

// ── Extract score value for the chosen preference ──
const getScore = (pref, dist, time, cost) => {
  if (pref === "time") return time;
  if (pref === "cost") return cost;
  return dist;
};

// ── Main routing function ─────────────────────────────────────────────────────
exports.getRouteFromEngine = async (from, to, preference = "distance") => {
  if (!from || !to) throw new Error("Source and destination are required");
  const pref   = VALID_PREFERENCES.includes(preference) ? preference : "distance";
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) throw new Error("ORS_API_KEY is missing in .env file.");

  // 1. Geocode both cities — local DB first, Nominatim as fallback
  const geocode = async (city) => {
    const key = city.trim().toLowerCase();

    // (a) Check local cities database
    if (CITIES[key]) {
      return { lat: CITIES[key].lat, lon: CITIES[key].lon };
    }

    // (b) Check airport database by city name
    const airportMatch = AIRPORTS.find(a => a.city.toLowerCase() === key);
    if (airportMatch) {
      return { lat: airportMatch.lat, lon: airportMatch.lon };
    }

    // (c) Fallback: Nominatim API (requires internet)
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json`,
        { headers: { "User-Agent": "TravelPlannerApp/1.0" }, timeout: 5000 }
      );
      if (res.data && res.data.length > 0) {
        return { lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) };
      }
    } catch (_) {
      // Nominatim unreachable — that's fine, we already tried local
    }

    throw new Error(`City not found: "${city}". Try a major city name.`);
  };

  const startCoord = await geocode(from);
  const endCoord   = await geocode(to);

  const straightLineDist = haversine(startCoord.lon, startCoord.lat, endCoord.lon, endCoord.lat);

  // 2. Build the direct driving option (may fail or fallback to offline estimation)
  let driveOption = null;
  // Only attempt direct drive if the straight-line distance is reasonable (e.g., <= 1500 km)
  // This completely prevents showing a "road trip" across the ocean from New York to Haridwar.
  if (straightLineDist <= 1500) {
    try {
      const direct    = await getDrivingRoute(startCoord.lon, startCoord.lat, endCoord.lon, endCoord.lat, apiKey);
      const driveCost = estimateDriveCost(direct.distanceKm);
      const score     = getScore(pref, direct.distanceKm, direct.timeHours, driveCost);
      driveOption = {
        score,
        result: {
          legs: [{ from, to, mode: "driving", distanceKm: direct.distanceKm, timeHours: direct.timeHours, cost: driveCost }],
          total:      parseFloat(score.toFixed(2)),
          preference: pref
        }
      };
    } catch (_) {
      // If ORS fails/timeout/offline, use Haversine approximation as fallback for direct drive
      // Add 25% road winding factor for distance estimation
      const driveDist = straightLineDist * 1.25; 
      const approxTime = estimateDriveTime(driveDist);
      const approxCost = estimateDriveCost(driveDist);
      const score = getScore(pref, driveDist, approxTime, approxCost);
      driveOption = {
        score,
        result: {
          legs: [{ from, to, mode: "driving", distanceKm: parseFloat(driveDist.toFixed(2)), timeHours: approxTime, cost: approxCost }],
          total: parseFloat(score.toFixed(2)),
          preference: pref
        }
      };
    }
  }

  // 3. Build the multi-leg flight option: drive → fly → drive
  let flightOption = null;
  const bestPair   = findBestAirports(startCoord, endCoord, pref);
  if (bestPair) {
    const originAirport = bestPair.origin;
    const destAirport   = bestPair.dest;
    const legs = [];
    let totalDist = 0, totalTime = 0, totalCost = 0;

    // Leg 1: Drive to origin airport
    const distToOriginAirport = haversine(startCoord.lon, startCoord.lat, originAirport.lon, originAirport.lat);
    if (distToOriginAirport > 5) {
      try {
        const drive1 = await getDrivingRoute(startCoord.lon, startCoord.lat, originAirport.lon, originAirport.lat, apiKey);
        const cost1  = estimateDriveCost(drive1.distanceKm);
        legs.push({ from, to: `${originAirport.city} Airport`, mode: "driving", distanceKm: drive1.distanceKm, timeHours: drive1.timeHours, cost: cost1 });
        totalDist += drive1.distanceKm; totalTime += drive1.timeHours; totalCost += cost1;
      } catch (_) {
        // ORS failed for this short leg — use Haversine approximation
        const approxTime = estimateDriveTime(distToOriginAirport);
        const approxCost = estimateDriveCost(distToOriginAirport);
        legs.push({ from, to: `${originAirport.city} Airport`, mode: "driving", distanceKm: parseFloat(distToOriginAirport.toFixed(2)), timeHours: approxTime, cost: approxCost });
        totalDist += distToOriginAirport; totalTime += approxTime; totalCost += approxCost;
      }
    }

    // Leg 2: Flight between airports
    const flightDist = parseFloat(haversine(originAirport.lon, originAirport.lat, destAirport.lon, destAirport.lat).toFixed(2));
    const flightTime = estimateFlightTime(flightDist);
    const flightCost = estimateFlightCost(flightDist, originAirport.hub, destAirport.hub);
    legs.push({ from: `${originAirport.city} Airport`, to: `${destAirport.city} Airport`, mode: "flight", distanceKm: flightDist, timeHours: flightTime, cost: flightCost });
    totalDist += flightDist; totalTime += flightTime; totalCost += flightCost;

    // Leg 3: Drive from destination airport to final city
    const distFromDestAirport = haversine(destAirport.lon, destAirport.lat, endCoord.lon, endCoord.lat);
    if (distFromDestAirport > 5) {
      try {
        const drive2 = await getDrivingRoute(destAirport.lon, destAirport.lat, endCoord.lon, endCoord.lat, apiKey);
        const cost2  = estimateDriveCost(drive2.distanceKm);
        legs.push({ from: `${destAirport.city} Airport`, to, mode: "driving", distanceKm: drive2.distanceKm, timeHours: drive2.timeHours, cost: cost2 });
        totalDist += drive2.distanceKm; totalTime += drive2.timeHours; totalCost += cost2;
      } catch (_) {
        const approxTime = estimateDriveTime(distFromDestAirport);
        const approxCost = estimateDriveCost(distFromDestAirport);
        legs.push({ from: `${destAirport.city} Airport`, to, mode: "driving", distanceKm: parseFloat(distFromDestAirport.toFixed(2)), timeHours: approxTime, cost: approxCost });
        totalDist += distFromDestAirport; totalTime += approxTime; totalCost += approxCost;
      }
    }

    const flightScore = getScore(pref, totalDist, totalTime, totalCost);
    flightOption = {
      score:  flightScore,
      result: { legs, total: parseFloat(flightScore.toFixed(2)), preference: pref }
    };
  }

  // 4. Pick the winner
  if (!driveOption && !flightOption) throw new Error("No route could be calculated between these cities.");
  if (!driveOption)  return flightOption.result;
  if (!flightOption) return driveOption.result;

  // Distance → direct road is always the shortest physical path
  // Time / Cost → compare scores and return the better option
  if (pref === "distance") return driveOption.result;
  return flightOption.score < driveOption.score ? flightOption.result : driveOption.result;
};
