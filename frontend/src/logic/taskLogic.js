// taskLogic.js
// Lógica de datos pura, sin dependencias de React ni del DOM.
// Separa la validación y la creación de tareas de la interfaz,
// para que sea fácil de testear y de reutilizar.

const PRIORIDADES_VALIDAS = ["baja", "media", "alta"];

/**
 * Valida los datos ingresados para crear una tarea.
 * No modifica nada, solo devuelve si es válido y, si no, el motivo.
 * @param {{titulo: string, materia: string, fechaLimite: string, prioridad: string}} datos
 * @returns {{valido: boolean, error: string|null}}
 */
export function validarDatosTarea(datos) {
  const { titulo, materia, fechaLimite, prioridad } = datos;

  if (!titulo || titulo.trim() === "") {
    return { valido: false, error: "El título es obligatorio" };
  }
  if (!materia || materia.trim() === "") {
    return { valido: false, error: "La materia es obligatoria" };
  }
  if (!fechaLimite) {
    return { valido: false, error: "La fecha límite es obligatoria" };
  }
  if (isNaN(new Date(fechaLimite).getTime())) {
    return { valido: false, error: "La fecha límite no es válida" };
  }
  if (!PRIORIDADES_VALIDAS.includes(prioridad)) {
    return { valido: false, error: "La prioridad no es válida" };
  }

  return { valido: true, error: null };
}

/**
 * Genera un id simple único para una tarea nueva.
 */
export function generarIdTarea() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Crea el objeto tarea a partir de datos ya validados.
 * Asume que los datos son válidos (llamar a validarDatosTarea antes).
 * @param {{titulo: string, descripcion: string, materia: string, fechaLimite: string, prioridad: string}} datos
 * @returns {object} tarea lista para guardar
 */
export function crearTarea(datos) {
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
