// server/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./config/db"); // Database connection
const authRoutes = require("./routes/auth"); // Authentication routes
const eventsRoutes = require("./routes/events"); // Event routes

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root route (simple test)
app.get("/", (req, res) => {
  res.send("Smart Student Planner API is running");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});