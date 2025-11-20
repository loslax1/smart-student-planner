const express = require("express");
const jwt = require("jsonwebtoken"); // ✅ keep it here
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventsController");

const router = express.Router();

// JWT middleware here
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

// Mount the controllers
router.get("/", getEvents);
router.get("/:id", getEventById);
router.post("/", createEvent);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

module.exports = router;
