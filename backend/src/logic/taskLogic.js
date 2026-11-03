// src/logic/taskLogic.js
// Lógica pura, sin dependencias de Express ni de la base de datos.
// Es la misma lógica ya probada en el TP N.2 (taskLogic.js del frontend),
// migrada al backend porque una regla de negocio (qué es una tarea válida)
// no debe vivir ni en el componente React ni en el controller.

const PRIORIDADES_VALIDAS = ["baja", "media", "alta"];
const ESTADOS_VALIDOS = ["pendiente", "en curso", "completada"];

function validarDatosTarea(datos) {
  const { titulo, materia, fechaLimite, prioridad } = datos || {};

  if (!titulo || titulo.trim() === "") {
    return { valido: false, error: "El título es obligatorio" };
  }
  if (!materia || materia.trim() === "") {
    return { valido: false, error: "La materia es obligatoria" };
  }
  if (!fechaLimite || isNaN(new Date(fechaLimite).getTime())) {
    return { valido: false, error: "La fecha límite no es válida" };
  }
  if (!PRIORIDADES_VALIDAS.includes(prioridad)) {
    return { valido: false, error: "La prioridad no es válida" };
  }
  return { valido: true, error: null };
}

function generarIdTarea() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function crearTarea(datos) {
  const { titulo, descripcion = "", materia, fechaLimite, prioridad } = datos;
  return {
    id: generarIdTarea(),
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    materia: materia.trim(),
    fechaLimite: new Date(fechaLimite).toISOString(),
    prioridad,
    estado: "pendiente",
    favorito: false,
    fechaCreacion: new Date().toISOString(),
  };
}

module.exports = {
  PRIORIDADES_VALIDAS,
  ESTADOS_VALIDOS,
  validarDatosTarea,
  crearTarea,
  generarIdTarea,
};
