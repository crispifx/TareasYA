// src/controllers/taskController.js
// Controller: SOLO traduce HTTP <-> Service. Sin lógica de negocio acá.

const taskService = require("../services/taskService");

function postTarea(req, res) {
  const resultado = taskService.crearNuevaTarea(req.body);

  if (!resultado.ok) {
    return res.status(resultado.status).json({ error: resultado.error });
  }
  return res.status(resultado.status).json(resultado.tarea);
}

function getTareas(req, res) {
  const tareas = taskService.listarTareas();
  return res.status(200).json(tareas);
}

module.exports = { postTarea, getTareas };
