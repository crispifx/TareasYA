// taskStorage.js
// Persistencia local (localStorage), usada en "modo local" cuando no hay backend.

const STORAGE_KEY = "tareasya.tareas";

export function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const datos = raw ? JSON.parse(raw) : [];
    return Array.isArray(datos) ? datos : [];
  } catch {
    return []; // datos corruptos: no rompemos la app
  }
}

export function saveTasks(tareas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
}
