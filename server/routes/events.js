// server/routes/events.js
const express = require("express");
const router = express.Router();
const { createEvent, getEvents } = require("../controllers/eventsController");
const auth = require("../middleware/authMiddleware");

// protect all /api/events routes with auth
router.use(auth);

router.get("/", getEvents);   // GET /api/events
router.post("/", createEvent); // POST /api/events

module.exports = router;