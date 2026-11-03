// taskStorage.js
// Persistencia local (localStorage). Usada por TaskForm.jsx.
// Si el frontend pasa a consumir la API del backend,
// este es el único archivo que habría que reemplazar.

const STORAGE_KEY = "tareasya.tareas";

export function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return []; // datos corruptos: no rompemos la app
  }
}

export function saveTasks(tareas) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tareas));
}
