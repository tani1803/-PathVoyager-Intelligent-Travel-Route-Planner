/**
 * graphEdges.js
 *
 * Weighted bidirectional graph used by the C++ Dijkstra engine.
 * Each edge: { from, to, distance (km), cost (INR), time (minutes), transport }
 * Transport codes:  T = Train | B = Bus | F = Flight | D = Drive
 *
 * The C++ engine reads these as CSV via stdin:
 *   from,to,distance,cost,time,transport
 */

const edges = [
  // ── North India – Ground ──────────────────────────────────────────────────
  { from: "Delhi",       to: "Agra",         distance: 200,  cost: 450,   time: 120,  transport: "T" },
  { from: "Delhi",       to: "Agra",         distance: 200,  cost: 220,   time: 195,  transport: "B" },
  { from: "Delhi",       to: "Jaipur",       distance: 280,  cost: 520,   time: 240,  transport: "T" },
  { from: "Delhi",       to: "Jaipur",       distance: 280,  cost: 260,   time: 300,  transport: "B" },
  { from: "Delhi",       to: "Lucknow",      distance: 500,  cost: 750,   time: 360,  transport: "T" },
  { from: "Delhi",       to: "Haridwar",     distance: 210,  cost: 380,   time: 225,  transport: "T" },
  { from: "Delhi",       to: "Haridwar",     distance: 210,  cost: 200,   time: 270,  transport: "B" },
  { from: "Delhi",       to: "Chandigarh",   distance: 250,  cost: 430,   time: 210,  transport: "T" },
  { from: "Delhi",       to: "Chandigarh",   distance: 250,  cost: 240,   time: 270,  transport: "B" },
  { from: "Delhi",       to: "Amritsar",     distance: 450,  cost: 650,   time: 360,  transport: "T" },
  { from: "Haridwar",    to: "Dehradun",     distance: 55,   cost: 90,    time: 75,   transport: "T" },
  { from: "Haridwar",    to: "Dehradun",     distance: 55,   cost: 70,    time: 90,   transport: "B" },
  { from: "Chandigarh",  to: "Amritsar",     distance: 200,  cost: 320,   time: 180,  transport: "T" },
  { from: "Agra",        to: "Jaipur",       distance: 240,  cost: 240,   time: 300,  transport: "B" },
  { from: "Jaipur",      to: "Ahmedabad",    distance: 680,  cost: 820,   time: 480,  transport: "T" },
  { from: "Lucknow",     to: "Patna",        distance: 500,  cost: 610,   time: 360,  transport: "T" },
  { from: "Patna",       to: "Kolkata",      distance: 600,  cost: 720,   time: 480,  transport: "T" },

  // ── West India – Ground ───────────────────────────────────────────────────
  { from: "Mumbai",      to: "Pune",         distance: 150,  cost: 220,   time: 180,  transport: "T" },
  { from: "Mumbai",      to: "Pune",         distance: 150,  cost: 180,   time: 210,  transport: "B" },
  { from: "Mumbai",      to: "Nashik",       distance: 165,  cost: 190,   time: 240,  transport: "B" },
  { from: "Mumbai",      to: "Ahmedabad",    distance: 530,  cost: 680,   time: 480,  transport: "T" },
  { from: "Mumbai",      to: "Surat",        distance: 265,  cost: 380,   time: 300,  transport: "T" },
  { from: "Surat",       to: "Ahmedabad",    distance: 265,  cost: 300,   time: 210,  transport: "T" },
  { from: "Pune",        to: "Nashik",       distance: 210,  cost: 210,   time: 270,  transport: "B" },

  // ── South India – Ground ──────────────────────────────────────────────────
  { from: "Bangalore",   to: "Chennai",      distance: 350,  cost: 580,   time: 360,  transport: "T" },
  { from: "Bangalore",   to: "Chennai",      distance: 350,  cost: 320,   time: 420,  transport: "B" },
  { from: "Bangalore",   to: "Hyderabad",    distance: 570,  cost: 820,   time: 540,  transport: "T" },
  { from: "Bangalore",   to: "Coimbatore",   distance: 360,  cost: 480,   time: 360,  transport: "T" },
  { from: "Bangalore",   to: "Cochin",       distance: 540,  cost: 680,   time: 600,  transport: "T" },
  { from: "Chennai",     to: "Hyderabad",    distance: 630,  cost: 880,   time: 600,  transport: "T" },
  { from: "Chennai",     to: "Cochin",       distance: 700,  cost: 860,   time: 660,  transport: "T" },
  { from: "Coimbatore",  to: "Cochin",       distance: 185,  cost: 240,   time: 180,  transport: "T" },
  { from: "Hyderabad",   to: "Mumbai",       distance: 720,  cost: 980,   time: 720,  transport: "T" },
  { from: "Chennai",     to: "Bhubaneswar",  distance: 1000, cost: 1150,  time: 1080, transport: "T" },
  { from: "Kolkata",     to: "Bhubaneswar",  distance: 440,  cost: 560,   time: 450,  transport: "T" },

  // ── Domestic Flights ──────────────────────────────────────────────────────
  { from: "Delhi",       to: "Mumbai",       distance: 1150, cost: 5200,  time: 145,  transport: "F" },
  { from: "Delhi",       to: "Bangalore",    distance: 1750, cost: 6100,  time: 175,  transport: "F" },
  { from: "Delhi",       to: "Chennai",      distance: 2100, cost: 6800,  time: 180,  transport: "F" },
  { from: "Delhi",       to: "Kolkata",      distance: 1450, cost: 5500,  time: 150,  transport: "F" },
  { from: "Delhi",       to: "Hyderabad",    distance: 1500, cost: 5600,  time: 150,  transport: "F" },
  { from: "Delhi",       to: "Ahmedabad",    distance: 900,  cost: 4500,  time: 120,  transport: "F" },
  { from: "Delhi",       to: "Cochin",       distance: 2900, cost: 7800,  time: 210,  transport: "F" },
  { from: "Delhi",       to: "Dehradun",     distance: 295,  cost: 2800,  time: 75,   transport: "F" },
  { from: "Mumbai",      to: "Bangalore",    distance: 990,  cost: 4400,  time: 120,  transport: "F" },
  { from: "Mumbai",      to: "Chennai",      distance: 1330, cost: 4900,  time: 150,  transport: "F" },
  { from: "Mumbai",      to: "Kolkata",      distance: 1660, cost: 5800,  time: 180,  transport: "F" },
  { from: "Mumbai",      to: "Hyderabad",    distance: 720,  cost: 3900,  time: 90,   transport: "F" },
  { from: "Mumbai",      to: "Ahmedabad",    distance: 530,  cost: 3200,  time: 75,   transport: "F" },
  { from: "Bangalore",   to: "Kolkata",      distance: 1880, cost: 6400,  time: 180,  transport: "F" },
  { from: "Chennai",     to: "Kolkata",      distance: 1660, cost: 5900,  time: 175,  transport: "F" },
  { from: "Kolkata",     to: "Bhubaneswar",  distance: 440,  cost: 3000,  time: 60,   transport: "F" },
  { from: "Hyderabad",   to: "Bangalore",    distance: 570,  cost: 3500,  time: 75,   transport: "F" },

  // ── International Flights ─────────────────────────────────────────────────
  { from: "Delhi",       to: "Dubai",        distance: 2200, cost: 15000, time: 240,  transport: "F" },
  { from: "Delhi",       to: "Singapore",    distance: 4200, cost: 25000, time: 360,  transport: "F" },
  { from: "Delhi",       to: "London",       distance: 6700, cost: 45000, time: 480,  transport: "F" },
  { from: "Delhi",       to: "New York",     distance: 11800,cost: 70000, time: 900,  transport: "F" },
  { from: "Delhi",       to: "Bangkok",      distance: 3100, cost: 17000, time: 330,  transport: "F" },
  { from: "Delhi",       to: "Tokyo",        distance: 5800, cost: 38000, time: 450,  transport: "F" },
  { from: "Delhi",       to: "Frankfurt",    distance: 6100, cost: 42000, time: 465,  transport: "F" },
  { from: "Mumbai",      to: "Dubai",        distance: 1900, cost: 12000, time: 210,  transport: "F" },
  { from: "Mumbai",      to: "London",       distance: 7200, cost: 44000, time: 510,  transport: "F" },
  { from: "Mumbai",      to: "New York",     distance: 12500,cost: 72000, time: 960,  transport: "F" },
  { from: "Mumbai",      to: "Singapore",    distance: 4000, cost: 22000, time: 360,  transport: "F" },
  { from: "Mumbai",      to: "Bangkok",      distance: 2900, cost: 16000, time: 315,  transport: "F" },
  { from: "Kolkata",     to: "Singapore",    distance: 2800, cost: 18000, time: 300,  transport: "F" },
  { from: "Kolkata",     to: "Bangkok",      distance: 2400, cost: 15000, time: 270,  transport: "F" },
  { from: "Chennai",     to: "Singapore",    distance: 3200, cost: 19500, time: 330,  transport: "F" },
  { from: "Cochin",      to: "Dubai",        distance: 2400, cost: 11500, time: 240,  transport: "F" },
  { from: "Hyderabad",   to: "Dubai",        distance: 2600, cost: 13500, time: 270,  transport: "F" },
  { from: "Bangalore",   to: "Singapore",    distance: 3600, cost: 20000, time: 345,  transport: "F" },
  { from: "Dubai",       to: "London",       distance: 5500, cost: 33000, time: 420,  transport: "F" },
  { from: "Dubai",       to: "New York",     distance: 11000,cost: 52000, time: 780,  transport: "F" },
  { from: "Dubai",       to: "Singapore",    distance: 5700, cost: 32000, time: 420,  transport: "F" },
  { from: "Dubai",       to: "Frankfurt",    distance: 4900, cost: 28000, time: 390,  transport: "F" },
  { from: "Dubai",       to: "Bangkok",      distance: 4900, cost: 25000, time: 390,  transport: "F" },
  { from: "London",      to: "New York",     distance: 5500, cost: 38000, time: 420,  transport: "F" },
  { from: "London",      to: "Singapore",    distance: 10800,cost: 52000, time: 720,  transport: "F" },
  { from: "London",      to: "Frankfurt",    distance: 650,  cost: 14000, time: 105,  transport: "F" },
  { from: "London",      to: "Tokyo",        distance: 9500, cost: 55000, time: 660,  transport: "F" },
  { from: "London",      to: "Sydney",       distance: 16900,cost: 75000, time: 1170, transport: "F" },
  { from: "Frankfurt",   to: "New York",     distance: 6200, cost: 40000, time: 465,  transport: "F" },
  { from: "Frankfurt",   to: "Singapore",    distance: 10200,cost: 50000, time: 720,  transport: "F" },
  { from: "Singapore",   to: "Sydney",       distance: 6300, cost: 32000, time: 480,  transport: "F" },
  { from: "Singapore",   to: "Tokyo",        distance: 5300, cost: 29000, time: 390,  transport: "F" },
  { from: "Singapore",   to: "Bangkok",      distance: 1400, cost: 9500,  time: 150,  transport: "F" },
  { from: "Bangkok",     to: "Tokyo",        distance: 4600, cost: 26000, time: 360,  transport: "F" },
  { from: "Bangkok",     to: "Sydney",       distance: 7500, cost: 36000, time: 540,  transport: "F" },
  { from: "Tokyo",       to: "New York",     distance: 10800,cost: 58000, time: 720,  transport: "F" },
  { from: "Tokyo",       to: "Sydney",       distance: 7800, cost: 38000, time: 570,  transport: "F" },
];

/**
 * Build the CSV string that the C++ binary reads from stdin.
 * Format per line: from,to,distance,cost,time,transport
 */
function buildGraphCSV() {
  return edges
    .map(e => `${e.from},${e.to},${e.distance},${e.cost},${e.time},${e.transport}`)
    .join('\n');
}

/**
 * Return the sorted list of all unique city names in the graph.
 */
function getAllCities() {
  const citySet = new Set();
  edges.forEach(e => { citySet.add(e.from); citySet.add(e.to); });
  return Array.from(citySet).sort();
}

module.exports = { edges, buildGraphCSV, getAllCities };
