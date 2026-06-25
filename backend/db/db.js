/**
 * db.js
 * MongoDB connection via Mongoose.
 * Exported as a singleton — calling connectDB() multiple times is safe.
 */

const mongoose = require("mongoose");
const logger   = require("../utils/logger");

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not defined in .env");

  await mongoose.connect(uri);
  isConnected = true;
  logger.info("MongoDB connected", { db: mongoose.connection.name });
};

module.exports = connectDB;
