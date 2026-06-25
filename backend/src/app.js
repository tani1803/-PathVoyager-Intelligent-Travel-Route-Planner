// src/app.js

const express = require("express");
const cors = require("cors");
const routeRoutes = require("../routes/services.routes");
const logger = require("../utils/logger");

const app = express();

app.use(express.json());
app.use(cors());

// Request logger middleware — logs every incoming request
app.use((req, res, next) => {
  logger.info("Incoming request", {
    method: req.method,
    url: req.url,
    query: req.query
  });
  next();
});

// Routes
app.use("/api", routeRoutes);

// 404 handler — unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route '${req.url}' does not exist`
    }
  });
});

// Global error handler — catches anything unhandled
app.use((err, req, res, next) => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred. Please try again later."
    }
  });
});

module.exports = app;
