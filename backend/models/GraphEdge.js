/**
 * GraphEdge.js
 *
 * Mongoose schema that persists each edge of the weighted travel graph
 * in MongoDB.  The seed script populates this collection once; the
 * route service loads it into memory on startup and keeps it as a
 * warm in-process cache — eliminating per-request DB overhead.
 *
 * Transport codes:  F = Flight | T = Train | B = Bus | D = Drive
 */

const mongoose = require("mongoose");

const GraphEdgeSchema = new mongoose.Schema(
  {
    from:      { type: String, required: true, index: true },
    to:        { type: String, required: true, index: true },
    distance:  { type: Number, required: true },   // km
    cost:      { type: Number, required: true },   // INR
    time:      { type: Number, required: true },   // minutes
    transport: { type: String, required: true, enum: ["F", "T", "B", "D"] },
  },
  { timestamps: true }
);

// Compound index — quickly fetch all edges leaving a city
GraphEdgeSchema.index({ from: 1, transport: 1 });

module.exports = mongoose.model("GraphEdge", GraphEdgeSchema);
