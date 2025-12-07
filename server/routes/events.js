const express = require("express");
const jwt = require("jsonwebtoken");
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleCompleted,     // <-- add this
} = require("../controllers/eventsController");

const router = express.Router();

// JWT middleware
function auth(req, res, next) {
  const authz = req.headers.authorization || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userId };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

router.use(auth);

// Existing routes
router.get("/", getEvents);
router.get("/:id", getEventById);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

// NEW: toggle completed
router.patch("/:id/complete", toggleCompleted);

module.exports = router;
