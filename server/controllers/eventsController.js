// server/controllers/eventsController.js
const pool = require("../config/db");

const createEvent = async (req, res) => {
  try {
    const { title, description, type, start_time, end_time, course_name } = req.body;

    if (!title || !type || !start_time || !end_time) {
      return res.status(400).json({ message: "title, type, start_time, and end_time are required." });
    }

    const result = await pool.query(
      `INSERT INTO events (user_id, title, description, type, start_time, end_time, course_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        title,
        description || null,
        type,
        start_time,
        end_time,
        course_name || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create event error:", err.message);
    res.status(500).json({ message: "Server error creating event." });
  }
};

const getEvents = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM events
       WHERE user_id = $1
       ORDER BY start_time`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Get events error:", err.message);
    res.status(500).json({ message: "Server error fetching events." });
  }
};

module.exports = { createEvent, getEvents };