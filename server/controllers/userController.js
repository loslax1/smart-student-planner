// server/controllers/userController.js
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

/** GET /api/user/me */
exports.getMe = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, full_name, email, created_at
       FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found." });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

/** PUT /api/user/me  Body: { full_name } */
exports.updateMe = async (req, res, next) => {
  try {
    const { full_name } = req.body;
    if (!full_name || full_name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters." });
    }

    const { rows } = await pool.query(
      `UPDATE users SET full_name = $1 WHERE id = $2
       RETURNING id, full_name, email, created_at`,
      [full_name.trim(), req.user.userId]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

/** PUT /api/user/password  Body: { current_password, new_password } */
exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: "Both current and new password are required." });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    // get current hash
    const { rows } = await pool.query(
      `SELECT password_hash FROM users WHERE id = $1`,
      [req.user.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found." });

    const ok = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect." });

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
      newHash,
      req.user.userId,
    ]);

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    next(err);
  }
};
