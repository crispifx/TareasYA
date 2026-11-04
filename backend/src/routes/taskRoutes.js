// src/routes/taskRoutes.js
const express = require("express");
const c = require("../controllers/taskController");

const router = express.Router();

router.get("/salud", (req, res) => res.json({ ok: true }));
router.get("/tareas", c.getTareas);
router.post("/tareas", c.postTarea);
// Rutas fijas ANTES de /tareas/:id, si no "resumen" se tomaría como un id.
router.get("/tareas/resumen", c.getResumen);
router.get("/tareas/:id", c.getTarea);
router.patch("/tareas/:id", c.patchTarea);
router.delete("/tareas/:id", c.deleteTarea);

module.exports = router;
