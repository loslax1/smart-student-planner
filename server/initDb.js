// server/initDb.js
const { pool } = require("./config/db");

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT CHECK (type IN ('assignment','quiz','exam','timeblock')) NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        end_time   TIMESTAMPTZ NOT NULL,
        course_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log("✅ DB init complete.");
  } catch (e) {
    console.error("❌ DB init error:", e);
    process.exit(1);
  } finally {
    // end the pool so the script exits
    await pool.end();
  }
})();
