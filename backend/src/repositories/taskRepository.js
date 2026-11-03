// src/repositories/taskRepository.js
// Repository: es la ÚNICA capa que sabe cómo y dónde se guardan los datos.
// Hoy es un archivo JSON (equivalente backend del localStorage que usaba
// el frontend); el día de mañana esto puede cambiar a SQLite o Postgres
// sin tocar el Service ni el Controller.

const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "..", "data", "tareas.json");

function asegurarArchivo() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]", "utf-8");
}

function obtenerTodas() {
  asegurarArchivo();
  const contenido = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(contenido);
}

function guardarTodas(tareas) {
  asegurarArchivo();
  fs.writeFileSync(DB_PATH, JSON.stringify(tareas, null, 2), "utf-8");
}

function agregar(tarea) {
  const tareas = obtenerTodas();
  tareas.push(tarea);
  guardarTodas(tareas);
  return tarea;
}

function existeMateriaYTitulo(titulo, materia) {
  const tareas = obtenerTodas();
  return tareas.some(
    (t) =>
      t.titulo.toLowerCase() === titulo.toLowerCase() &&
      t.materia.toLowerCase() === materia.toLowerCase() &&
      t.estado !== "completada"
  );
}

module.exports = { obtenerTodas, guardarTodas, agregar, existeMateriaYTitulo };
