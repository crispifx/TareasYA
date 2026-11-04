// src/controllers/taskController.js
// Solo traduce HTTP <-> Service. Sin lógica de negocio.

const service = require("../services/taskService");

function responder(res, r) {
  if (!r.ok) return res.status(r.status).json({ error: r.error });
  if (r.status === 204) return res.status(204).end();
  return res.status(r.status).json(r.tarea);
}

const postTarea = (req, res) => responder(res, service.crearNuevaTarea(req.body));
const getTareas = (req, res) => res.status(200).json(service.listarTareas(req.query));
const getTarea = (req, res) => responder(res, service.obtenerTarea(req.params.id));
const patchTarea = (req, res) =>
  responder(res, service.actualizarTarea(req.params.id, req.body));
const deleteTarea = (req, res) => responder(res, service.eliminarTarea(req.params.id));

module.exports = { postTarea, getTareas, getTarea, patchTarea, deleteTarea };
