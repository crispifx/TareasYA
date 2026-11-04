// src/services/taskService.js
// Reglas de negocio. No sabe de HTTP ni de cómo se guardan los datos.

const {
  validarDatosTarea,
  validarCambios,
  crearTarea,
  aplicarCambios,
  filtrarYOrdenar,
} = require("../logic/taskLogic");
const repo = require("../repositories/taskRepository");

const MSG_DUPLICADA = "Ya existe una tarea activa con ese título en esa materia";
const NO_ENCONTRADA = { ok: false, status: 404, error: "Tarea no encontrada" };

function crearNuevaTarea(datos) {
  const { valido, error } = validarDatosTarea(datos);
  if (!valido) return { ok: false, status: 400, error };

  if (repo.existeMateriaYTitulo(datos.titulo, datos.materia))
    return { ok: false, status: 409, error: MSG_DUPLICADA };

  const tarea = crearTarea(datos);
  repo.agregar(tarea);
  return { ok: true, status: 201, tarea };
}

function listarTareas(consulta) {
  return filtrarYOrdenar(repo.obtenerTodas(), consulta);
}

function obtenerTarea(id) {
  const tarea = repo.buscarPorId(id);
  return tarea ? { ok: true, status: 200, tarea } : NO_ENCONTRADA;
}

function actualizarTarea(id, cambios) {
  const { valido, error } = validarCambios(cambios);
  if (!valido) return { ok: false, status: 400, error };

  const actual = repo.buscarPorId(id);
  if (!actual) return NO_ENCONTRADA;

  const nueva = aplicarCambios(actual, cambios);

  // Si el cambio la deja activa y con título/materia repetidos, se rechaza.
  if (
    nueva.estado !== "completada" &&
    repo.existeMateriaYTitulo(nueva.titulo, nueva.materia, id)
  )
    return { ok: false, status: 409, error: MSG_DUPLICADA };

  repo.reemplazar(id, nueva);
  return { ok: true, status: 200, tarea: nueva };
}

function eliminarTarea(id) {
  return repo.eliminar(id) ? { ok: true, status: 204 } : NO_ENCONTRADA;
}

module.exports = {
  crearNuevaTarea,
  listarTareas,
  obtenerTarea,
  actualizarTarea,
  eliminarTarea,
};
