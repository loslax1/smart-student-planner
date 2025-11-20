// server/controllers/eventsController.js
const { pool } = require("../config/db");

/** Simple payload validation */
function validateEvent(body) {
  const { title, type, start_time, end_time } = body;

  if (!title || typeof title !== "string") {
    return { ok: false, message: "Title is required." };
  }

  const allowed = ["assignment", "quiz", "exam", "timeblock"];
  if (!type || !allowed.includes(type)) {
    return { ok: false, message: `Type must be one of: ${allowed.join(", ")}.` };
  }

  if (!start_time || !end_time) {
    return { ok: false, message: "start_time and end_time are required." };
  }

  const start = new Date(start_time);
  const end = new Date(end_time);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { ok: false, message: "start_time and end_time must be valid ISO datetimes." };
  }
  if (end <= start) {
    return { ok: false, message: "end_time must be after start_time." };
  }

  return { ok: true };
}

/** GET /api/events — list all events for the authenticated user */
exports.getEvents = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { rows } = await pool.query(
      `SELECT id, user_id, title, description, type, start_time, end_time, course_name, created_at
       FROM events
       WHERE user_id = $1
       ORDER BY start_time ASC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Get events error:", err.message);
    next(err);
  }
};

/** GET /api/events/:id */
exports.getEventById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT id, user_id, title, description, type, start_time, end_time, course_name, created_at
       FROM events
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Event not found." });
    res.json(rows[0]);
  } catch (err) {
    console.error("Get event error:", err.message);
    next(err);
  }
};

/** POST /api/events — create a new event and return the created row */
exports.createEvent = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const v = validateEvent(req.body);
    if (!v.ok) return res.status(400).json({ message: v.message });

    const { title, description, type, start_time, end_time, course_name } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO events (user_id, title, description, type, start_time, end_time, course_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, title, description, type, start_time, end_time, course_name, created_at`,
      [userId, title, description || null, type, start_time, end_time, course_name || null]
    );

    res.status(201).json(rows[0]); // ✅ return created event for instant UI update
  } catch (err) {
    console.error("Create event error:", err.message);
    next(err);
  }
};

/** PUT /api/events/:id — simple full-update */
exports.updateEvent = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Require full payload for simplicity
    const v = validateEvent({ ...req.body });
    if (!v.ok) return res.status(400).json({ message: v.message });

    const { title, description, type, start_time, end_time, course_name } = req.body;

    const { rows } = await pool.query(
      `UPDATE events
         SET title = $1,
             description = $2,
             type = $3,
             start_time = $4,
             end_time = $5,
             course_name = $6
       WHERE id = $7 AND user_id = $8
       RETURNING id, user_id, title, description, type, start_time, end_time, course_name, created_at`,
      [title, description || null, type, start_time, end_time, course_name || null, id, userId]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Event not found." });
    res.json(rows[0]);
  } catch (err) {
    console.error("Update event error:", err.message);
    next(err);
  }
};

/** DELETE /api/events/:id */
exports.deleteEvent = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM events WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (rowCount === 0) return res.status(404).json({ message: "Event not found." });
    res.status(204).send();
  } catch (err) {
    console.error("Delete event error:", err.message);
    next(err);
  }
};