// server/index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { pool } = require("./config/db");

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const userRoutes = require("./routes/user");       // profile / settings
const classRoutes = require("./routes/classes");   // <-- NEW: class schedules

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// health/root
app.get("/", (req, res) => {
  res.send("Smart Student Planner API is running!");
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/user", userRoutes);
app.use("/api/classes", classRoutes);  // <-- NEW: mount classes API

// global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(PORT, async () => {
  try {
    await pool.query("SELECT 1");
    console.log(`Server running on port ${PORT}`);
    console.log("✅ Connected to PostgreSQL");
  } catch (e) {
    console.error("❌ Database connection error:", e.message);
  }
});
