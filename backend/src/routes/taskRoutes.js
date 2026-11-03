// src/routes/taskRoutes.js
const express = require("express");
const { postTarea, getTareas } = require("../controllers/taskController");

const router = express.Router();

router.post("/tareas", postTarea);
router.get("/tareas", getTareas);

module.exports = router;
