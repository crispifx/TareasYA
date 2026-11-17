// src/services/taskService.js
// Reglas de negocio. No sabe de HTTP ni de cómo se guardan los datos.

const {
  validarDatosTarea,
  validarCambios,
  validarConsulta,
  errorFechaPasada,
  crearTarea,
  aplicarCambios,
  filtrarYOrdenar,
  resumenTareas,
  tareasPorVencer,
  validarHoras,
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
  return { ok: true, status: 201, datos: tarea };
}

function listarTareas(consulta) {
  const { valido, error } = validarConsulta(consulta);
  if (!valido) return { ok: false, status: 400, error };
  return { ok: true, status: 200, datos: filtrarYOrdenar(repo.obtenerTodas(), consulta) };
}

function obtenerTarea(id) {
  const tarea = repo.buscarPorId(id);
  return tarea ? { ok: true, status: 200, datos: tarea } : NO_ENCONTRADA;
}

function actualizarTarea(id, cambios) {
  const { valido, error } = validarCambios(cambios);
  if (!valido) return { ok: false, status: 400, error };

  const actual = repo.buscarPorId(id);
  if (!actual) return NO_ENCONTRADA;

  // Mover la fecha al pasado se rechaza; reenviar la misma fecha (aunque ya venció) no es un cambio.
  if (
    cambios.fechaLimite !== undefined &&
    new Date(cambios.fechaLimite).getTime() !== new Date(actual.fechaLimite).getTime()
  ) {
    const errorFecha = errorFechaPasada(cambios.fechaLimite);
    if (errorFecha) return { ok: false, status: 400, error: errorFecha };
  }

  const nueva = aplicarCambios(actual, cambios);

  // Si el cambio la deja activa y con título/materia repetidos, se rechaza.
  if (
    nueva.estado !== "completada" &&
    repo.existeMateriaYTitulo(nueva.titulo, nueva.materia, id)
  )
    return { ok: false, status: 409, error: MSG_DUPLICADA };

  repo.reemplazar(id, nueva);
  return { ok: true, status: 200, datos: nueva };
}

function eliminarTarea(id) {
  return repo.eliminar(id) ? { ok: true, status: 204 } : NO_ENCONTRADA;
}

function obtenerResumen() {
  return { ok: true, status: 200, datos: resumenTareas(repo.obtenerTodas()) };
}

function listarProximas(horasCrudo) {
  const { valido, horas, error } = validarHoras(horasCrudo);
  if (!valido) return { ok: false, status: 400, error };
  return { ok: true, status: 200, datos: tareasPorVencer(repo.obtenerTodas(), horas) };
}

module.exports = {
  listarProximas,
  obtenerResumen,
  crearNuevaTarea,
  listarTareas,
  obtenerTarea,
  actualizarTarea,
  eliminarTarea,
};
