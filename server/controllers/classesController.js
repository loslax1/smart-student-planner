// server/controllers/classesController.js
const { pool } = require("../config/db");

/**
 * Helper to get the current user's id from req.user.
 * Works with several possible shapes: { id }, { user_id }, { userId }.
 */
function getUserId(req) {
  if (req.user && typeof req.user === "object") {
    if (req.user.id) return req.user.id;
    if (req.user.user_id) return req.user.user_id;
    if (req.user.userId) return req.user.userId;
  }
  return null;
}

// GET /api/classes
exports.getClasses = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const { rows } = await pool.query(
      `SELECT *
       FROM class_schedules
       WHERE user_id = $1
       ORDER BY course_name, start_date`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Get classes error:", err);
    next(err);
  }
};

// POST /api/classes
exports.createClass = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const {
      course_name,
      location,
      days_of_week,
      start_date,
      end_date,
      class_start_time,
      class_end_time,
    } = req.body;

    const daysArray = Array.isArray(days_of_week)
      ? days_of_week.map(Number)
      : [];

    const insertQuery = `
      INSERT INTO class_schedules
        (user_id, course_name, location, days_of_week,
         start_date, end_date, class_start_time, class_end_time)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const { rows } = await pool.query(insertQuery, [
      userId,
      course_name,
      location || null,
      daysArray,
      start_date,
      end_date,
      class_start_time,
      class_end_time,
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Create class error:", err);
    next(err);
  }
};

// PUT /api/classes/:id
exports.updateClass = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const { id } = req.params;
    const {
      course_name,
      location,
      days_of_week,
      start_date,
      end_date,
      class_start_time,
      class_end_time,
    } = req.body;

    const daysArray = Array.isArray(days_of_week)
      ? days_of_week.map(Number)
      : [];

    const updateQuery = `
      UPDATE class_schedules
      SET
        course_name      = $1,
        location         = $2,
        days_of_week     = $3,
        start_date       = $4,
        end_date         = $5,
        class_start_time = $6,
        class_end_time   = $7
      WHERE id = $8 AND user_id = $9
      RETURNING *;
    `;

    const { rows } = await pool.query(updateQuery, [
      course_name,
      location || null,
      daysArray,
      start_date,
      end_date,
      class_start_time,
      class_end_time,
      id,
      userId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Class not found." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Update class error:", err);
    next(err);
  }
};

// DELETE /api/classes/:id
exports.deleteClass = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    const { id } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM class_schedules WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: "Class not found." });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete class error:", err);
    next(err);
  }
};
