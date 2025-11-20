const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const auth = require("../middleware/auth"); // must verify JWT
const bcrypt = require("bcryptjs");

// GET /api/user/me
router.get("/me", auth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, full_name, email FROM users WHERE id = $1",
      [req.user.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found." });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/me   { full_name }
router.put("/me", auth, async (req, res, next) => {
  try {
    const { full_name } = req.body;
    if (!full_name) return res.status(400).json({ message: "full_name is required." });

    const { rows } = await pool.query(
      "UPDATE users SET full_name = $1 WHERE id = $2 RETURNING id, full_name, email",
      [full_name, req.user.userId]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/password  { current_password, new_password }
router.put("/password", auth, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: "current_password and new_password are required." });
    }

    const { rows } = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.user.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found." });

    const ok = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect." });

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      hash,
      req.user.userId,
    ]);

    res.json({ message: "Password updated." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
