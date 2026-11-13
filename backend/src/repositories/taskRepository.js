// src/repositories/taskRepository.js
// Única capa que sabe dónde y cómo se guardan los datos (hoy, un JSON).
// La ruta se puede cambiar con TAREASYA_DB (útil para los tests).

const fs = require("fs");
const path = require("path");

const rutaDb = () =>
  process.env.TAREASYA_DB || path.join(__dirname, "..", "..", "data", "tareas.json");

function asegurarArchivo() {
  const ruta = rutaDb();
  const dir = path.dirname(ruta);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(ruta)) fs.writeFileSync(ruta, "[]", "utf-8");
}

function obtenerTodas() {
  asegurarArchivo();
  const contenido = fs.readFileSync(rutaDb(), "utf-8");
  try {
    const datos = JSON.parse(contenido);
    if (!Array.isArray(datos)) throw new Error("formato");
    return datos;
  } catch {
    // No devolvemos [] en silencio: sería perder datos sin avisar.
    throw new Error("La base de datos está dañada");
  }
}

// Escritura atómica: se escribe un temporal y se renombra, así un corte
// a mitad de escritura no deja el JSON a medias.
function guardarTodas(tareas) {
  asegurarArchivo();
  const ruta = rutaDb();
  const tmp = `${ruta}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(tareas, null, 2), "utf-8");
  fs.renameSync(tmp, ruta);
}

function agregar(tarea) {
  const tareas = obtenerTodas();
  tareas.push(tarea);
  guardarTodas(tareas);
  return tarea;
}

function buscarPorId(id) {
  return obtenerTodas().find((t) => t.id === id) || null;
}

function reemplazar(id, tareaNueva) {
  const tareas = obtenerTodas();
  const i = tareas.findIndex((t) => t.id === id);
  if (i === -1) return null;
  tareas[i] = tareaNueva;
  guardarTodas(tareas);
  return tareaNueva;
}

function eliminar(id) {
  const tareas = obtenerTodas();
  const restantes = tareas.filter((t) => t.id !== id);
  if (restantes.length === tareas.length) return false;
  guardarTodas(restantes);
  return true;
}

// ¿Hay otra tarea activa con el mismo título y materia?
function existeMateriaYTitulo(titulo, materia, excluirId = null) {
  const t1 = String(titulo).trim().toLowerCase();
  const m1 = String(materia).trim().toLowerCase();
  return obtenerTodas().some(
    (t) =>
      t.id !== excluirId &&
      t.estado !== "completada" &&
      String(t.titulo).toLowerCase() === t1 &&
      String(t.materia).toLowerCase() === m1
  );
}

module.exports = {
  obtenerTodas,
  guardarTodas,
  agregar,
  buscarPorId,
  reemplazar,
  eliminar,
  existeMateriaYTitulo,
};
