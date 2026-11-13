// taskLogic.js
// Lógica de datos pura, sin dependencias de React ni del DOM.
// Espeja las reglas del backend para poder funcionar también en modo local.

export const PRIORIDADES_VALIDAS = ["baja", "media", "alta"];
export const ESTADOS_VALIDOS = ["pendiente", "en curso", "completada"];
const HORA = 60 * 60 * 1000;

/**
 * Valida los datos ingresados para crear una tarea.
 * @returns {{valido: boolean, error: string|null}}
 */
export function validarDatosTarea(datos) {
  const { titulo, materia, fechaLimite, prioridad } = datos;

  if (!titulo || titulo.trim() === "") {
    return { valido: false, error: "El título es obligatorio" };
  }
  if (titulo.trim().length > 100) {
    return { valido: false, error: "El título no puede superar los 100 caracteres" };
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

export function generarIdTarea() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Crea el objeto tarea a partir de datos ya validados. */
export function crearTarea(datos) {
  const { titulo, descripcion = "", materia, fechaLimite, prioridad } = datos;
  const ahora = new Date().toISOString();
  return {
    id: generarIdTarea(),
    titulo: titulo.trim(),
    descripcion: descripcion.trim(),
    materia: materia.trim(),
    fechaLimite: new Date(fechaLimite).toISOString(),
    prioridad,
    estado: "pendiente",
    favorito: false,
    fechaCreacion: ahora,
    fechaActualizacion: ahora,
  };
}

/** Devuelve una tarea nueva con los cambios aplicados (no muta la original). */
export function aplicarCambios(tarea, cambios) {
  const nueva = { ...tarea, ...cambios };
  if (cambios.titulo !== undefined) nueva.titulo = cambios.titulo.trim();
  if (cambios.materia !== undefined) nueva.materia = cambios.materia.trim();
  if (cambios.descripcion !== undefined) nueva.descripcion = cambios.descripcion.trim();
  if (cambios.fechaLimite !== undefined)
    nueva.fechaLimite = new Date(cambios.fechaLimite).toISOString();
  nueva.fechaActualizacion = new Date().toISOString();
  return nueva;
}

/** ¿Hay otra tarea activa con el mismo título y materia? */
export function existeDuplicada(tareas, titulo, materia, excluirId = null) {
  const t = titulo.trim().toLowerCase();
  const m = materia.trim().toLowerCase();
  return tareas.some(
    (x) =>
      x.id !== excluirId &&
      x.estado !== "completada" &&
      x.titulo.toLowerCase() === t &&
      x.materia.toLowerCase() === m
  );
}

/** ISO -> valor para <input type="datetime-local"> (hora local). */
export function aInputFecha(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * Filtra por texto (título/materia), materia, estado, prioridad y favoritas.
 * Valores vacíos = sin filtro.
 */
export function filtrarTareas(tareas, f = {}) {
  const texto = (f.q || "").trim().toLowerCase();
  return tareas.filter((t) => {
    if (texto && !`${t.titulo} ${t.materia}`.toLowerCase().includes(texto)) return false;
    if (f.materia && t.materia !== f.materia) return false;
    if (f.estado && t.estado !== f.estado) return false;
    if (f.prioridad && t.prioridad !== f.prioridad) return false;
    if (f.soloFavoritas && !t.favorito) return false;
    return true;
  });
}

const PESO = { alta: 0, media: 1, baja: 2 };

/** Ordena sin mutar. orden: "fecha" (próxima primero) | "prioridad" | "creacion". */
export function ordenarTareas(tareas, orden = "fecha") {
  const porFecha = (a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite);
  const copia = [...tareas];
  if (orden === "prioridad")
    return copia.sort((a, b) => PESO[a.prioridad] - PESO[b.prioridad] || porFecha(a, b));
  if (orden === "creacion")
    return copia.sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
  return copia.sort(porFecha);
}

/** Una tarea activa cuya fecha ya pasó. */
export function estaVencida(tarea, ahora = new Date()) {
  return tarea.estado !== "completada" && new Date(tarea.fechaLimite) < ahora;
}

/** Tareas activas que vencen dentro de las próximas `horas` (default 48). */
export function tareasPorVencer(tareas, horas = 48, ahora = new Date()) {
  const limite = new Date(ahora.getTime() + horas * HORA);
  return tareas.filter((t) => {
    if (t.estado === "completada") return false;
    const f = new Date(t.fechaLimite);
    return f >= ahora && f <= limite;
  });
}

/** Contadores para el resumen de arriba. */
export function resumenTareas(tareas, ahora = new Date()) {
  return {
    total: tareas.length,
    pendientes: tareas.filter((t) => t.estado === "pendiente").length,
    enCurso: tareas.filter((t) => t.estado === "en curso").length,
    completadas: tareas.filter((t) => t.estado === "completada").length,
    vencidas: tareas.filter((t) => estaVencida(t, ahora)).length,
  };
}

/** Texto amigable: "vence en 3 h", "vence mañana", "venció hace 2 días". */
export function textoVencimiento(tarea, ahora = new Date()) {
  const dif = new Date(tarea.fechaLimite) - ahora;
  const horas = Math.round(Math.abs(dif) / HORA);
  const dias = Math.round(Math.abs(dif) / (24 * HORA));
  if (dif < 0) return horas < 24 ? `venció hace ${horas} h` : `venció hace ${dias} d`;
  if (horas < 1) return "vence en menos de 1 h";
  if (horas < 24) return `vence en ${horas} h`;
  return dias === 1 ? "vence mañana" : `vence en ${dias} d`;
}
