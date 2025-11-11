// server/initDb.js
const pool = require("./config/db");

async function createTables() {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Events table (classes, assignments, custom blocks, etc.)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,  -- 'class', 'assignment', 'exam', 'study', 'gym', etc.
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        course_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ Tables created (or already exist).");
  } catch (err) {
    console.error("❌ Error creating tables:", err.message);
  } finally {
    await pool.end();
    process.exit();
  }
}

createTables();