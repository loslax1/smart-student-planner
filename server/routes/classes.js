// server/routes/classes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const classesController = require("../controllers/classesController");

// protect all class routes
router.use(authMiddleware);

router.get("/", classesController.getClasses);
router.post("/", classesController.createClass);
router.put("/:id", classesController.updateClass);
router.delete("/:id", classesController.deleteClass);

module.exports = router;