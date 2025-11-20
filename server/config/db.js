// server/config/db.js
const { Pool } = require("pg");

// Only load .env locally; Docker already injects env
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ Database connection error:", err.message));

module.exports = { pool }; // ✅ matches const { pool } = require("./config/db")
