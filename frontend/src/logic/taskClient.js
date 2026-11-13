// taskClient.js
// Única puerta de entrada a los datos desde la interfaz.
// Si el backend responde, usa la API; si no, trabaja en "modo local" (localStorage).

import {
  validarDatosTarea,
  crearTarea,
  aplicarCambios,
  existeDuplicada,
} from "./taskLogic";
import { loadTasks, saveTasks } from "./taskStorage";

const MSG_DUPLICADA = "Ya existe una tarea activa con ese título en esa materia";
let modo = "api";

export const obtenerModo = () => modo;

async function http(ruta, opciones = {}) {
  const res = await fetch(`/api${ruta}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });
  if (res.status === 204) return null;
  const datos = await res.json().catch(() => null);
  if (!res.ok) throw new Error(datos?.error || "Error del servidor");
  return datos;
}

/** Detecta si hay backend. Devuelve "api" o "local". */
export async function detectarModo() {
  try {
    await http("/salud");
    modo = "api";
  } catch {
    modo = "local";
  }
  return modo;
}

export async function listarTareas() {
  return modo === "api" ? http("/tareas") : loadTasks();
}

export async function crearNuevaTarea(datos) {
  if (modo === "api") return http("/tareas", { method: "POST", body: JSON.stringify(datos) });
  const { valido, error } = validarDatosTarea(datos);
  if (!valido) throw new Error(error);
  const tareas = loadTasks();
  if (existeDuplicada(tareas, datos.titulo, datos.materia)) throw new Error(MSG_DUPLICADA);
  const tarea = crearTarea(datos);
  saveTasks([...tareas, tarea]);
  return tarea;
}

export async function actualizarTarea(id, cambios) {
  if (modo === "api") return http(`/tareas/${id}`, { method: "PATCH", body: JSON.stringify(cambios) });
  const tareas = loadTasks();
  const actual = tareas.find((t) => t.id === id);
  if (!actual) throw new Error("Tarea no encontrada");
  const nueva = aplicarCambios(actual, cambios);
  if (nueva.estado !== "completada" && existeDuplicada(tareas, nueva.titulo, nueva.materia, id))
    throw new Error(MSG_DUPLICADA);
  saveTasks(tareas.map((t) => (t.id === id ? nueva : t)));
  return nueva;
}

export async function eliminarTarea(id) {
  if (modo === "api") return http(`/tareas/${id}`, { method: "DELETE" });
  saveTasks(loadTasks().filter((t) => t.id !== id));
  return null;
}
